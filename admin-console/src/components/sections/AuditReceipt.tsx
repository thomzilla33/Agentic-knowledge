import type { AuditEvent } from '../../types';
import { store } from '../../mockApi/store';

interface Props {
  event: AuditEvent;
  onDismiss: () => void;
}

export function AuditReceipt({ event, onDismiss }: Props) {
  const fixture = store.getFixture();
  const scope = fixture.scopes.find(s => s.id === event.scopeId);
  const actor = store.getPrincipal(event.actorId);
  const def = store.getSettingDef(event.settingId);

  return (
    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1.5" role="alert">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.5" fill="var(--primary)"/>
            <path d="M3.5 6l2 2 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Saved
        </span>
        <button
          onClick={onDismiss}
          className="text-emerald-600 hover:text-emerald-800 focus-ring rounded"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="text-emerald-700 space-y-0.5">
        <div><span className="font-medium">Setting:</span> {def?.label ?? event.settingId}</div>
        <div><span className="font-medium">Scope:</span> {scope?.name ?? event.scopeId}</div>
        <div><span className="font-medium">By:</span> {actor?.name ?? event.actorId}</div>
        <div><span className="font-medium">At:</span> {new Date(event.at).toLocaleString()}</div>
        {event.affectedScopeIds.length > 1 && (
          <div>
            <span className="font-medium">Affected:</span> {event.affectedScopeIds.length} scopes
          </div>
        )}
        {event.onBehalfOfScopeId && (
          <div className="text-amber-700">
            <span className="font-medium">On behalf of:</span>{' '}
            {fixture.scopes.find((s: any) => s.id === event.onBehalfOfScopeId)?.name ?? event.onBehalfOfScopeId}
          </div>
        )}
      </div>
      <div className="text-emerald-600 font-mono text-[10px]">audit-id: {event.id}</div>
    </div>
  );
}
