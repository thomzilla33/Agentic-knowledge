import { useState } from 'react';
import { Button } from '../primitives/Button';

interface AddOnlyValue {
  inherited: string[];
  local: string[];
}

interface Props {
  value: AddOnlyValue;
  canWrite: boolean;
  locked: boolean;
  onAdd: (item: string) => void;
}

export function AddOnlyList({ value, canWrite, locked, onAdd }: Props) {
  const [draft, setDraft] = useState('');

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
  }

  return (
    <div className="space-y-1.5">
      {value.inherited.map(item => (
        <div
          key={`inherited-${item}`}
          className="flex items-center gap-2 px-2 py-1 bg-[var(--ac-surface2)] border border-[var(--border)] rounded text-xs text-[var(--field-supporting)]"
        >
          <span className="font-mono flex-1">{item}</span>
          <span className="text-[9px] uppercase tracking-wide text-[var(--color-caption)]">inherited</span>
        </div>
      ))}

      {value.local.map(item => (
        <div
          key={`local-${item}`}
          className="flex items-center gap-2 px-2 py-1 bg-white border border-[var(--border)] rounded text-xs text-[var(--field-text)]"
        >
          <span className="font-mono flex-1">{item}</span>
          <span className="text-[9px] uppercase tracking-wide text-[var(--primary)]">local</span>
        </div>
      ))}

      {value.inherited.length === 0 && value.local.length === 0 && (
        <div className="text-xs text-[var(--color-caption)] italic">No entries yet.</div>
      )}

      {canWrite && !locked && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Add entry…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)] focus-ring"
          />
          <Button variant="secondary" size="sm" onClick={handleAdd} disabled={!draft.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
