import { useState } from 'react';
import type { SettingDef, ResolvedValue, Scope, Principal, AuditEvent } from '../../types';
import { writeSetting } from '../../mockApi/settings';
import { validateHardenOnly } from '../../core/inheritance';
import { store } from '../../mockApi/store';
import { Toggle } from '../primitives/Toggle';
import { ProvenanceExpander } from './ProvenanceExpander';
import { ValueEditor } from './ValueEditor';
import { ImpactPreview } from './ImpactPreview';
import { AuditReceipt } from './AuditReceipt';
import { AddOnlyList } from './AddOnlyList';
import { InlineMessage } from '../primitives/InlineMessage';

interface Props {
  def: SettingDef;
  resolved: ResolvedValue;
  scope: Scope;
  principal: Principal;
  canWrite: boolean;
  onWrite: () => void;
}

type RowState =
  | { phase: 'idle' }
  | { phase: 'editing' }
  | { phase: 'previewing'; candidate: unknown }
  | { phase: 'saving' }
  | { phase: 'saved'; event: AuditEvent }
  | { phase: 'error'; message: string; priorValue: unknown; newValue?: unknown };

export function SettingRow({ def, resolved, scope, principal, canWrite, onWrite }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [rowState, setRowState] = useState<RowState>({ phase: 'idle' });

  const isLocked = resolved.locked;
  const isSuspended = scope.status === 'suspended';
  const isEditable = canWrite && !isLocked && !isSuspended && def.valueKind !== 'readonly';
  const isAddOnly = def.cascade === 'ADD_ONLY';
  const isNotCascadable = def.cascade === 'NOT_CASCADABLE';
  const hasNoLocal = isNotCascadable && resolved.source !== 'local';

  function handleRequestPreview(candidate: unknown) {
    const fixture = store.getFixture();
    const hardenErr = def.floorRule === 'HARDEN_ONLY'
      ? validateHardenOnly(def, scope.id, candidate, fixture)
      : null;
    if (hardenErr) {
      setRowState({ phase: 'error', message: hardenErr, priorValue: resolved.value });
      return;
    }
    setRowState({ phase: 'previewing', candidate });
  }

  async function handleConfirm(versionToken: string) {
    if (rowState.phase !== 'previewing') return;
    const candidate = rowState.candidate;
    setRowState({ phase: 'saving' });

    try {
      const result = await writeSetting(def.id, scope.id, candidate, versionToken, principal, scope);

      if (!result.ok) {
        if (result.error.code === 'STALE_WRITE') {
          setRowState({
            phase: 'error',
            message: `The value was changed while you were reviewing. Current value: ${JSON.stringify(result.currentValue)}. Try again.`,
            priorValue: resolved.value,
            newValue: result.currentValue,
          });
        } else {
          setRowState({
            phase: 'error',
            message: result.error.message ?? `Write failed (${result.error.code}). Try again or contact support if it persists.`,
            priorValue: resolved.value,
          });
        }
        return;
      }

      setRowState({ phase: 'saved', event: result.event });
    } catch {
      setRowState({
        phase: 'error',
        message: 'Request failed. Check your connection and try again.',
        priorValue: resolved.value,
      });
    }
  }

  function handleAddOnlyItem(item: string) {
    const existing = (resolved.value as any)?.local ?? [];
    handleRequestPreview([...existing, item]);
  }

  function renderValue() {
    if (hasNoLocal) {
      return (
        <span className="text-xs text-[var(--color-caption)] italic">
          No value set for this scope.{isEditable ? ' Add one below.' : ''}
        </span>
      );
    }

    if (isAddOnly && resolved.value && typeof resolved.value === 'object') {
      const addOnlyVal = resolved.value as { inherited: string[]; local: string[] };
      return (
        <AddOnlyList
          value={addOnlyVal}
          canWrite={isEditable}
          locked={isLocked}
          onAdd={handleAddOnlyItem}
        />
      );
    }

    if (def.valueKind === 'toggle') {
      return (
        <Toggle
          checked={!!resolved.value}
          onChange={() => {}}
          disabled={!isEditable}
          label={def.label}
        />
      );
    }

    if (def.valueKind === 'list' && Array.isArray(resolved.value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {(resolved.value as string[]).map(v => (
            <span key={v} className="px-1.5 py-0.5 bg-[var(--ac-surface2)] border border-[var(--border)] rounded text-xs font-mono text-[var(--field-text)]">
              {v}
            </span>
          ))}
        </div>
      );
    }

    return (
      <span className="text-xs font-mono text-[var(--field-text)]">
        {String(resolved.value ?? def.defaultValue)}
      </span>
    );
  }

  return (
    <div className={`py-4 border-b border-[var(--ac-surface2)] last:border-0 ${isSuspended ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-[var(--field-text)]">{def.label}</span>
            {isLocked && (
              <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-semibold text-amber-700 uppercase tracking-wide">
                Locked
              </span>
            )}
            {isNotCascadable && (
              <span className="px-1.5 py-0.5 bg-[var(--ac-surface2)] border border-[var(--border)] rounded text-[9px] font-semibold text-[var(--field-supporting)] uppercase tracking-wide">
                Private
              </span>
            )}
            {resolved.source === 'inherited' && !isLocked && (
              <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] text-blue-700">
                inherited
              </span>
            )}
            {resolved.source === 'default' && (
              <span className="px-1.5 py-0.5 bg-[var(--ac-surface2)] rounded text-[9px] text-[var(--color-caption)]">
                default
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--field-supporting)] mb-2">{def.description}</p>

          {/* Value display */}
          {rowState.phase === 'idle' && renderValue()}
          {rowState.phase === 'editing' && (
            <ValueEditor
              def={def}
              resolved={resolved}
              onRequestPreview={handleRequestPreview}
              onCancel={() => setRowState({ phase: 'idle' })}
            />
          )}
          {rowState.phase === 'previewing' && (
            <ImpactPreview
              def={def}
              scope={scope}
              principal={principal}
              candidateValue={rowState.candidate}
              onConfirm={handleConfirm}
              onCancel={() => setRowState({ phase: 'idle' })}
            />
          )}
          {rowState.phase === 'saving' && (
            <div className="flex items-center gap-2 text-xs text-[var(--field-supporting)] mt-1">
              <div className="w-3 h-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              Saving…
            </div>
          )}
          {rowState.phase === 'saved' && (
            <AuditReceipt
              event={rowState.event}
              onDismiss={() => { setRowState({ phase: 'idle' }); onWrite(); }}
            />
          )}
          {rowState.phase === 'error' && (
            <div className="mt-2">
              <InlineMessage kind="error">{rowState.message}</InlineMessage>
              <button
                onClick={() => setRowState({ phase: 'idle' })}
                className="mt-1 text-xs text-[var(--field-supporting)] hover:text-[var(--field-text)] focus-ring rounded"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Provenance expander */}
          {expanded && rowState.phase === 'idle' && (
            <ProvenanceExpander settingId={def.id} resolved={resolved} scopeId={scope.id} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {/* Provenance toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-[var(--color-caption)] hover:text-[var(--field-supporting)] focus-ring rounded px-1 transition-colors"
            aria-expanded={expanded}
            aria-label="Toggle provenance"
          >
            {expanded ? '▲ hide' : '▼ source'}
          </button>

          {/* Edit button */}
          {isEditable && rowState.phase === 'idle' && !isAddOnly && !hasNoLocal && (
            <button
              onClick={() => setRowState({ phase: 'editing' })}
              className="text-xs text-[var(--primary)] hover:underline focus-ring rounded px-1"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
