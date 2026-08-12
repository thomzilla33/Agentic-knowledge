import { useState } from 'react';
import type { SettingDef, ResolvedValue } from '../../types';
import { Toggle } from '../primitives/Toggle';
import { Button } from '../primitives/Button';

interface Props {
  def: SettingDef;
  resolved: ResolvedValue;
  onRequestPreview: (candidate: unknown) => void;
  onCancel: () => void;
}

export function ValueEditor({ def, resolved, onRequestPreview, onCancel }: Props) {
  const [draft, setDraft] = useState<unknown>(
    resolved.source !== 'default' ? resolved.value : def.defaultValue
  );

  function handleSubmit() {
    onRequestPreview(draft);
  }

  if (def.valueKind === 'readonly') {
    return <span className="text-xs text-[var(--color-caption)] italic">Read-only value</span>;
  }

  if (def.valueKind === 'list') {
    return (
      <div className="space-y-1.5 mt-1">
        <textarea
          value={(draft as string[])?.join('\n') ?? ''}
          onChange={e => setDraft(e.target.value.split('\n').filter(Boolean))}
          rows={4}
          className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded font-mono resize-y focus:outline-none focus:border-[var(--primary)] focus-ring"
          placeholder="One entry per line"
        />
        <EditorActions onSubmit={handleSubmit} onCancel={onCancel} />
      </div>
    );
  }

  if (def.valueKind === 'toggle') {
    return (
      <div className="flex items-center gap-3 mt-1">
        <Toggle
          checked={draft as boolean}
          onChange={v => setDraft(v)}
          label={def.label}
        />
        <span className="text-xs text-[var(--field-supporting)]">{draft ? 'Enabled' : 'Disabled'}</span>
        <EditorActions onSubmit={handleSubmit} onCancel={onCancel} />
      </div>
    );
  }

  if (def.valueKind === 'enum' && def.options) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <select
          value={draft as string}
          onChange={e => setDraft(e.target.value)}
          className="px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-white focus:outline-none focus:border-[var(--primary)] focus-ring"
        >
          {def.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <EditorActions onSubmit={handleSubmit} onCancel={onCancel} />
      </div>
    );
  }

  if (def.valueKind === 'number') {
    return (
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          value={draft as number}
          onChange={e => setDraft(Number(e.target.value))}
          className="w-28 px-2 py-1.5 text-xs border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)] focus-ring"
        />
        <EditorActions onSubmit={handleSubmit} onCancel={onCancel} />
      </div>
    );
  }

  // text (default)
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="text"
        value={draft as string}
        onChange={e => setDraft(e.target.value)}
        className="flex-1 max-w-xs px-2 py-1.5 text-xs border border-[var(--border)] rounded focus:outline-none focus:border-[var(--primary)] focus-ring"
      />
      <EditorActions onSubmit={handleSubmit} onCancel={onCancel} />
    </div>
  );
}

function EditorActions({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="primary" size="sm" onClick={onSubmit}>Preview</Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
    </div>
  );
}
