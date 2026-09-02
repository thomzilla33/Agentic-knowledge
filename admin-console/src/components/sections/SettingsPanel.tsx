import { useState, useEffect, useMemo } from 'react';
import type { SectionId, Scope, Principal } from '../../types';
import { store } from '../../mockApi/store';
import { resolveValue } from '../../core/inheritance';
import { isEntitled } from '../../core/entitlements';
import { Spinner } from '../primitives/Spinner';
import { SettingRow } from './SettingRow';

interface Props {
  sectionId: SectionId;
  scope: Scope;
  principal: Principal;
  canWrite: boolean;
  onWrite: () => void;
}

export function SettingsPanel({ sectionId, scope, principal, canWrite, onWrite }: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(t);
  }, [sectionId, scope.id]);

  const fixture = store.getFixture();

  const defs = useMemo(() => {
    return store.getSettingDefs().filter(def => {
      if (def.sectionId !== sectionId) return false;
      if (def.requiresProduct && !isEntitled(scope.id, def.requiresProduct, fixture.entitlements, fixture.closure)) return false;
      return true;
    });
  }, [sectionId, scope.id, fixture]);

  const rows = useMemo(() => {
    return defs.map(def => ({
      def,
      resolved: resolveValue(def.id, scope.id, fixture),
    }));
  }, [defs, scope.id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-xs text-[var(--field-supporting)]">
        <Spinner size={14} /> Loading settings…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--ac-surface2)] flex items-center justify-center mb-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM8 11V8M8 5.5v.5" stroke="var(--color-caption)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-sm text-[var(--field-supporting)]">No configurable settings in this section.</p>
        <p className="text-xs text-[var(--color-caption)] mt-1">
          Settings may require additional product entitlements.
        </p>
      </div>
    );
  }

  return (
    <div>
      {rows.map(({ def, resolved }) => (
        <SettingRow
          key={def.id}
          def={def}
          resolved={resolved}
          scope={scope}
          principal={principal}
          canWrite={canWrite}
          onWrite={onWrite}
        />
      ))}
    </div>
  );
}
