import type { ResolvedValue, SettingDef, Fixture } from '../types';
import { REGISTRY_MAP } from '../fixtures/settingRegistry';
import { ancestorsWithSelf } from './scopeTree';

/**
 * Resolves the effective value of a setting at a scope by walking the closure
 * table from the scope up to the root. No recursion at call time.
 *
 * Cascade modes:
 * - LOCKED: only ancestor values are visible; descendant is read-only.
 * - OVERRIDABLE: first value found (local wins over ancestor).
 * - ADD_ONLY: local and inherited entries are merged; inherited cannot be removed.
 * - NOT_CASCADABLE: only local value is used; ancestor values are invisible.
 */
export function resolveValue(settingId: string, scopeId: string, fixture: Fixture): ResolvedValue {
  const def = REGISTRY_MAP[settingId];
  if (!def) {
    return { value: undefined, source: 'default', locked: false, mode: 'OVERRIDABLE' };
  }

  if (def.cascade === 'NOT_CASCADABLE') {
    return resolveNotCascadable(def, scopeId, fixture);
  }

  const chain = ancestorsWithSelf(scopeId, fixture.closure);
  const values = fixture.settingValues.filter(v => v.settingId === settingId);

  if (def.cascade === 'ADD_ONLY') {
    return resolveAddOnly(def, scopeId, chain, values);
  }

  // LOCKED and OVERRIDABLE share the walk-up pattern
  return resolveWalkUp(def, scopeId, chain, values);
}

function resolveNotCascadable(def: SettingDef, scopeId: string, fixture: Fixture): ResolvedValue {
  const local = fixture.settingValues.find(v => v.settingId === def.id && v.scopeId === scopeId);
  if (local) {
    return {
      value: local.value,
      source: 'local',
      sourceScopeId: scopeId,
      locked: false,
      mode: 'NOT_CASCADABLE',
      packageVersion: local.packageVersion,
      setBy: local.setBy,
      setAt: local.setAt,
    };
  }
  // No local value, no ancestor peeking. Return empty default.
  return {
    value: undefined,
    source: 'default',
    locked: false,
    mode: 'NOT_CASCADABLE',
  };
}

function resolveWalkUp(
  def: SettingDef,
  scopeId: string,
  chain: string[], // [self, parent, grandparent, …, root]
  values: { settingId: string; scopeId: string; value: unknown; setBy: string; setAt: string; packageVersion: string }[]
): ResolvedValue {
  for (let i = 0; i < chain.length; i++) {
    const id = chain[i];
    const val = values.find(v => v.scopeId === id);
    if (!val) continue;

    const isLocal = i === 0;

    if (def.cascade === 'LOCKED' && !isLocal) {
      // Descendant can read but not write; value comes from ancestor
      return {
        value: val.value,
        source: 'inherited',
        sourceScopeId: id,
        locked: true,
        mode: 'LOCKED',
        packageVersion: val.packageVersion,
        setBy: val.setBy,
        setAt: val.setAt,
      };
    }

    if (def.cascade === 'LOCKED' && isLocal) {
      // The defining scope itself — editable here, locked at descendants
      return {
        value: val.value,
        source: 'local',
        sourceScopeId: id,
        locked: false,
        mode: 'LOCKED',
        packageVersion: val.packageVersion,
        setBy: val.setBy,
        setAt: val.setAt,
      };
    }

    // OVERRIDABLE
    return {
      value: val.value,
      source: isLocal ? 'local' : 'inherited',
      sourceScopeId: id,
      locked: false,
      mode: 'OVERRIDABLE',
      packageVersion: val.packageVersion,
      setBy: val.setBy,
      setAt: val.setAt,
    };
  }

  // Nothing found in the chain — use registry default
  return {
    value: def.defaultValue,
    source: 'default',
    locked: def.cascade === 'LOCKED' ? false : false, // at root, not locked
    mode: def.cascade,
  };
}

function resolveAddOnly(
  def: SettingDef,
  scopeId: string,
  chain: string[],
  values: { settingId: string; scopeId: string; value: unknown }[]
): ResolvedValue {
  // Merge all ancestor list values + local. Local entries are additive.
  const inheritedEntries: unknown[] = [];
  const localEntries: unknown[] = [];

  for (let i = chain.length - 1; i >= 0; i--) {
    const id = chain[i];
    const val = values.find(v => v.scopeId === id);
    if (!val) continue;
    const entries = Array.isArray(val.value) ? val.value : [val.value];
    if (i === 0) {
      localEntries.push(...entries);
    } else {
      inheritedEntries.push(...entries);
    }
  }

  // Deduplicate but preserve origin information via a structured object
  const mergedValue = { inherited: inheritedEntries, local: localEntries };

  const localRecord = values.find(v => v.scopeId === scopeId);
  return {
    value: mergedValue,
    source: localRecord ? 'local' : inheritedEntries.length > 0 ? 'inherited' : 'default',
    sourceScopeId: chain.find(id => values.some(v => v.scopeId === id)),
    locked: false,
    mode: 'ADD_ONLY',
  };
}

// Validate HARDEN_ONLY floor before committing a write.
// Returns null if allowed, or a plain-language reason string if rejected.
export function validateHardenOnly(
  def: SettingDef,
  scopeId: string,
  candidate: unknown,
  fixture: Fixture
): string | null {
  if (def.floorRule !== 'HARDEN_ONLY' || !def.isStricter) return null;

  // Find the floor value from ancestors
  const chain = ancestorsWithSelf(scopeId, fixture.closure).slice(1); // skip self
  for (const id of chain) {
    const val = fixture.settingValues.find(v => v.settingId === def.id && v.scopeId === id);
    if (!val) continue;
    if (!def.isStricter(candidate, val.value)) {
      const scope = fixture.scopes.find(s => s.id === id);
      return `This setting has a floor set by ${scope?.name ?? id}. You can only set a stricter value.`;
    }
    break; // only check the nearest ancestor with a value
  }
  return null;
}
