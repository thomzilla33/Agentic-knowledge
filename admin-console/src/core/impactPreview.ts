import type { ImpactResult, ImpactEntry, Fixture } from '../types';
import { REGISTRY_MAP } from '../fixtures/settingRegistry';
import { descendants } from './scopeTree';
import { resolveValue } from './inheritance';

// Compute the impact of writing newValue to settingId at scopeId.
// Returns per-scope outcome breakdown for the impact preview dialog.
export function computeImpact(
  settingId: string,
  scopeId: string,
  _newValue: unknown,
  fixture: Fixture
): ImpactResult {
  const def = REGISTRY_MAP[settingId];
  const descendantIds = descendants(scopeId, fixture.closure);
  const entries: ImpactEntry[] = [];

  for (const descId of descendantIds) {
    const scope = fixture.scopes.find(s => s.id === descId);
    if (!scope) continue;

    const resolved = resolveValue(settingId, descId, fixture);

    let outcome: ImpactEntry['outcome'];

    if (resolved.locked && resolved.sourceScopeId !== scopeId) {
      // Locked by a rule further up (above the scope being edited) — shouldn't happen
      // in normal flow but defensively handled
      outcome = 'locked-upstream';
    } else if (resolved.source === 'local' && resolved.sourceScopeId === descId) {
      // Descendant has its own local override — keeps it
      outcome = 'keeps-override';
    } else if (def?.cascade === 'LOCKED') {
      // LOCKED mode: descendant cannot override, will take new value
      outcome = 'will-update';
    } else {
      // OVERRIDABLE without a local override — will inherit new value
      outcome = 'will-update';
    }

    entries.push({ scopeId: descId, scopeName: scope.name, outcome });
  }

  return {
    entries,
    version: generateSnapshotToken(settingId, scopeId, fixture),
  };
}

// Snapshot token encodes relevant state for staleness detection (edge case 22).
// A change to any setting value in the fixture changes this token.
function generateSnapshotToken(settingId: string, scopeId: string, fixture: Fixture): string {
  const relevant = fixture.settingValues
    .filter(v => v.settingId === settingId)
    .map(v => `${v.scopeId}:${JSON.stringify(v.value)}`)
    .sort()
    .join('|');
  return btoa(`${settingId}:${scopeId}:${relevant}`).slice(0, 16);
}
