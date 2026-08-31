import type { ResolvedValue, ImpactResult, ApiError, AuditEvent, SectionId, Principal, Scope } from '../types';
import { delay } from './delay';
import { store } from './store';
import { resolveValue, validateHardenOnly } from '../core/inheritance';
import { computeImpact } from '../core/impactPreview';
import { canWrite } from '../core/gate';
import { REGISTRY_MAP, SETTING_REGISTRY } from '../fixtures/settingRegistry';
import { isEntitled } from '../core/entitlements';
import { descendants } from '../core/scopeTree';

// Simulate occasional API failure (edge case 23)
function maybeFailure(): boolean {
  return Math.random() < 0.05; // 5% failure rate
}

export async function getResolvedValue(settingId: string, scopeId: string): Promise<ResolvedValue> {
  await delay();
  const fixture = store.getFixture();
  return resolveValue(settingId, scopeId, fixture);
}

export async function getSectionSettings(
  sectionId: SectionId,
  scopeId: string,
  _principal: Principal,
  scope: Scope
): Promise<{ settingId: string; resolved: ResolvedValue; versionToken: string }[]> {
  await delay();
  const fixture = store.getFixture();

  const settings = SETTING_REGISTRY.filter(s => s.sectionId === sectionId);
  const result = [];

  for (const setting of settings) {
    // Entitlement gate per setting
    if (setting.requiresProduct) {
      if (!isEntitled(scopeId, setting.requiresProduct, fixture.entitlements, fixture.closure)) {
        continue;
      }
    }

    // editableAtKinds filter — setting not shown at wrong scope kind
    if (!setting.editableAtKinds.includes(scope.kind)) {
      continue;
    }

    const resolved = resolveValue(setting.id, scopeId, fixture);
    const versionToken = store.issueVersionToken(setting.id, scopeId);
    result.push({ settingId: setting.id, resolved, versionToken });
  }

  return result;
}

export async function previewImpact(
  settingId: string,
  scopeId: string,
  newValue: unknown
): Promise<ImpactResult> {
  await delay();
  const fixture = store.getFixture();
  return computeImpact(settingId, scopeId, newValue, fixture);
}

export type WriteResult =
  | { ok: true; versionToken: string; event: AuditEvent }
  | { ok: false; error: ApiError; currentValue?: unknown };

export async function writeSetting(
  settingId: string,
  scopeId: string,
  newValue: unknown,
  versionToken: string,
  principal: Principal,
  scope: Scope
): Promise<WriteResult> {
  await delay(200 + Math.random() * 100);

  if (maybeFailure()) {
    return {
      ok: false,
      error: {
        code: 'API_FAILURE',
        message: 'The save request failed. Check your connection and try again.',
      },
    };
  }

  const fixture = store.getFixture();

  // Permission check
  const def = REGISTRY_MAP[settingId];
  if (!def || !canWrite(principal, scope, def.sectionId, fixture)) {
    return {
      ok: false,
      error: { code: 'PERMISSION_DENIED', message: 'You do not have write access to this setting.' },
    };
  }

  // Stale write check (edge case 21/22)
  if (!store.checkVersionToken(settingId, scopeId, versionToken)) {
    const current = store.getSettingValue(settingId, scopeId);
    return {
      ok: false,
      error: {
        code: 'STALE_WRITE',
        message: 'This value was changed by someone else while you were editing. Review both values before saving.',
      },
      currentValue: current?.value,
    };
  }

  // HARDEN_ONLY floor check (edge case 15)
  if (def.floorRule === 'HARDEN_ONLY') {
    const violation = validateHardenOnly(def, scopeId, newValue, fixture);
    if (violation) {
      return {
        ok: false,
        error: { code: 'FLOOR_VIOLATION', message: violation },
      };
    }
  }

  // Write
  const prior = resolveValue(settingId, scopeId, fixture);
  store.writeValue(settingId, scopeId, newValue, principal.id);

  // Compute affected scopes for audit
  const affectedIds = computeAffectedScopes(settingId, scopeId, newValue, fixture);

  // Audit event
  const event: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    settingId,
    scopeId,
    actorId: principal.id,
    at: new Date().toISOString(),
    priorValue: prior.value,
    newValue,
    affectedScopeIds: affectedIds,
    onBehalfOfScopeId: principal.homeScopeId !== scopeId ? scopeId : undefined,
  };
  store.addAuditEvent(event);

  const newToken = store.issueVersionToken(settingId, scopeId);
  return { ok: true, versionToken: newToken, event };
}

function computeAffectedScopes(settingId: string, scopeId: string, _newValue: unknown, fixture: ReturnType<typeof store.getFixture>): string[] {
  const def = REGISTRY_MAP[settingId];
  if (!def || def.cascade === 'NOT_CASCADABLE') return [scopeId];
  if (def.cascade === 'LOCKED') {
    // All descendants that don't have their own local value
    const descIds = descendants(scopeId, fixture.closure);
    return [scopeId, ...descIds.filter(id =>
      !fixture.settingValues.some(v => v.settingId === settingId && v.scopeId === id)
    )];
  }
  return [scopeId];
}
