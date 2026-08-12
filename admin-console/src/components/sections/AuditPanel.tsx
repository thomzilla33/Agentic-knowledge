import { useState, useEffect } from 'react';
import type { AuditEvent } from '../../types';
import { getAuditEvents } from '../../mockApi/audit';
import { store } from '../../mockApi/store';
import { Spinner } from '../primitives/Spinner';

export function AuditPanel() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAuditEvents({}).then(result => {
      setEvents(result);
      setLoading(false);
    });
  }, []);

  const fixture = store.getFixture();
  const principals = store.getPrincipals();

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-xs text-[var(--field-supporting)]">
        <Spinner size={14} /> Loading audit log…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-[var(--field-supporting)]">No audit events yet.</p>
        <p className="text-xs text-[var(--color-caption)] mt-1">
          Changes to settings will appear here immediately after they are saved.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--field-text)]">Audit & Compliance</h2>
        <p className="text-xs text-[var(--field-supporting)] mt-0.5">
          All configuration changes are recorded here immediately.
        </p>
      </div>

      <div className="space-y-2">
        {events.slice().reverse().map(event => {
          const scope = fixture.scopes.find(s => s.id === event.scopeId);
          const def = store.getSettingDef(event.settingId);
          const onBehalf = event.onBehalfOfScopeId
            ? fixture.scopes.find(s => s.id === event.onBehalfOfScopeId)
            : null;
          const actor = principals.find(p => p.id === event.actorId);

          return (
            <div
              key={event.id}
              className="p-3 bg-white border border-[var(--border)] rounded-lg text-xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-[var(--field-text)]">{def?.label ?? event.settingId}</div>
                  <div className="text-[var(--field-supporting)] mt-0.5">
                    Scope: {scope?.name ?? event.scopeId}
                    {onBehalf && (
                      <span className="ml-2 text-amber-700">
                        (on behalf of {onBehalf.name})
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-[var(--color-caption)]">
                    <span>By: {actor?.name ?? event.actorId}</span>
                    <span>{new Date(event.at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[var(--color-caption)]">
                    {JSON.stringify(event.priorValue)} → {JSON.stringify(event.newValue)}
                  </div>
                  {event.affectedScopeIds.length > 1 && (
                    <div className="text-[var(--color-caption)] mt-0.5">
                      {event.affectedScopeIds.length} scopes affected
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
