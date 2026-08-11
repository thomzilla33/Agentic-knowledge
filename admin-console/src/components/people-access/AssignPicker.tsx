import { useState, useEffect, useRef } from 'react';
import { Button } from '../primitives/Button';

interface PickerItem {
  id: string;
  primary: string;
  secondary: string;
  initials: string;
}

interface AssignPickerProps {
  title: string;
  items: PickerItem[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}

export function AssignPicker({ title, items, onConfirm, onClose }: AssignPickerProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    return !q || item.primary.toLowerCase().includes(q) || item.secondary.toLowerCase().includes(q);
  });

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Dialog */}
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-64px)] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-[var(--border)] shrink-0">
          <div className="text-sm font-semibold text-[var(--field-text)] mb-3">{title}</div>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-colors"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-[var(--field-supporting)]">No results.</div>
          ) : (
            filtered.map(item => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`w-full text-left flex items-center gap-3 px-5 py-2.5 transition-colors ${
                    isSelected ? 'bg-[var(--primary)]/5' : 'hover:bg-[var(--ac-surface2)]'
                  }`}
                >
                  {/* Checkbox */}
                  <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[var(--primary)] border-[var(--primary)]'
                      : 'bg-[var(--ac-surface2)] border-[var(--border)]'
                  }`}>
                    {isSelected && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[var(--field-text)] truncate">{item.primary}</div>
                    <div className="text-[11px] text-[var(--field-supporting)] truncate">{item.secondary}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--border)] shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            disabled={selected.size === 0}
            onClick={() => onConfirm(Array.from(selected))}
          >
            Assign {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
