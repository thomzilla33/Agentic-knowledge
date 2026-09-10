import { useState, useEffect } from 'react';
import type { SettingDef, Scope, Principal, ImpactResult } from '../../types';
import { computeImpact } from '../../core/impactPreview';
import { store } from '../../mockApi/store';
import { Spinner } from '../primitives/Spinner';
import { Button } from '../primitives/Button';

interface Props {
  def: SettingDef;
  scope: Scope;
  principal: Principal;
  candidateValue: unknown;
  onConfirm: (versionToken: string) => void;
  onCancel: () => void;
}

export function ImpactPreview({ def, scope, principal: _principal, candidateValue, onConfirm, onCancel }: Props) {
  const [impact, setImpact] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [staleWarning, setStaleWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStaleWarning(false);

    const fixture = store.getFixture();
    const result = computeImpact(def.id, scope.id, candidateValue, fixture);

    setTimeout(() => {
      if (!cancelled) {
        setImpact(result);
        setLoading(false);
      }
    }, 180);

    return () => { cancelled = true; };
  }, [def.id, scope.id, candidateValue]);

  function handleConfirm() {
    if (!impact) return;
    // Edge case 22: recompute snapshot and compare to detect value changes since preview loaded
    const fixture = store.getFixture();
    const fresh = computeImpact(def.id, scope.id, candidateValue, fixture);
    if (fresh.version !== impact.version) {
      setStaleWarning(true);
      setImpact(fresh);
      return;
    }
    // Issue concurrency token for the write (edge case 21)
    const token = store.issueVersionToken(def.id, scope.id);
    onConfirm(token);
  }

  const willUpdate = impact?.entries.filter(e => e.outcome === 'will-update') ?? [];
  const keepsOverride = impact?.entries.filter(e => e.outcome === 'keeps-override') ?? [];
  const lockedUpstream = impact?.entries.filter(e => e.outcome === 'locked-upstream') ?? [];

  return (
    <div className="mt-3 p-3 bg-[var(--ac-surface2)] border border-[var(--border)] rounded-lg text-xs space-y-3">
      <div className="font-semibold text-[var(--field-text)]">Impact preview</div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--field-supporting)]">
          <Spinner size={12} /> Calculating impact…
        </div>
      ) : (
        <>
          {staleWarning && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
              The value changed while you were reviewing. Recalculating…
            </div>
          )}

          {willUpdate.length > 0 && (
            <div>
              <div className="font-medium text-[var(--field-text)] mb-1">
                Will take new value ({willUpdate.length}):
              </div>
              {willUpdate.slice(0, 8).map(e => {
                const s = store.getFixture().scopes.find((sc: Scope) => sc.id === e.scopeId);
                return (
                  <div key={e.scopeId} className="text-[var(--field-supporting)] pl-2">{s?.name ?? e.scopeId}</div>
                );
              })}
              {willUpdate.length > 8 && (
                <div className="text-[var(--field-supporting)] pl-2 italic">…and {willUpdate.length - 8} more</div>
              )}
            </div>
          )}

          {keepsOverride.length > 0 && (
            <div>
              <div className="font-medium text-amber-700 mb-1">
                Keeps local override ({keepsOverride.length}):
              </div>
              {keepsOverride.map(e => {
                const s = store.getFixture().scopes.find((sc: Scope) => sc.id === e.scopeId);
                return (
                  <div key={e.scopeId} className="text-amber-700 pl-2">{s?.name ?? e.scopeId}</div>
                );
              })}
            </div>
          )}

          {lockedUpstream.length > 0 && (
            <div>
              <div className="font-medium text-[var(--field-supporting)] mb-1">
                Locked by upstream rule ({lockedUpstream.length}):
              </div>
              {lockedUpstream.slice(0, 4).map(e => {
                const s = store.getFixture().scopes.find((sc: Scope) => sc.id === e.scopeId);
                return (
                  <div key={e.scopeId} className="text-[var(--field-supporting)] pl-2">{s?.name ?? e.scopeId}</div>
                );
              })}
            </div>
          )}

          {willUpdate.length === 0 && keepsOverride.length === 0 && lockedUpstream.length === 0 && (
            <div className="text-[var(--field-supporting)]">Only this scope will be updated.</div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
            >
              Confirm & save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
