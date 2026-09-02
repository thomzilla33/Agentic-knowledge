import type { ResolvedValue } from '../../types';
import { store } from '../../mockApi/store';

interface Props {
  settingId: string;
  resolved: ResolvedValue;
  scopeId: string;
}

export function ProvenanceExpander({ settingId, resolved, scopeId }: Props) {
  const fixture = store.getFixture();

  const sourceScope = resolved.sourceScopeId
    ? fixture.scopes.find(s => s.id === resolved.sourceScopeId)
    : null;

  const value = store.getValueRecord(settingId, resolved.sourceScopeId ?? scopeId);

  return (
    <div className="mt-2 ml-4 pl-3 border-l-2 border-[var(--border)] text-xs text-[var(--field-supporting)] space-y-1">
      <div className="flex gap-2">
        <span className="font-medium text-[var(--field-text)]">Source:</span>
        <span>
          {resolved.source === 'local'
            ? 'Set on this scope'
            : resolved.source === 'inherited'
            ? `Inherited from ${sourceScope?.name ?? resolved.sourceScopeId ?? 'ancestor'}`
            : 'Registry default'}
        </span>
      </div>
      {resolved.locked && (
        <div className="flex gap-2">
          <span className="font-medium text-amber-700">Locked by:</span>
          <span>{sourceScope?.name ?? resolved.sourceScopeId}</span>
        </div>
      )}
      {value && (
        <>
          <div className="flex gap-2">
            <span className="font-medium text-[var(--field-text)]">Set by:</span>
            <span>{value.setBy}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-[var(--field-text)]">Set at:</span>
            <span>{new Date(value.setAt).toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-[var(--field-text)]">Package:</span>
            <span className="font-mono">{value.packageVersion}</span>
          </div>
        </>
      )}
      {resolved.source === 'default' && (
        <div className="text-[var(--field-supporting)] italic">No custom value set — showing registry default.</div>
      )}
    </div>
  );
}
