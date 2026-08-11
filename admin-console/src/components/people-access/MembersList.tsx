import { useState } from 'react';
import type { Member, StudioId } from '../../types';

const STUDIO_LABELS: Record<StudioId | 'all', string> = {
  all: 'All studios',
  ag:    'Agentic Studio',
  gov:   'Governance Studio',
  helix: 'Helix DS',
};

const STATUS_STYLE: Record<string, string> = {
  active:    'text-green-700 bg-green-50 border-green-200',
  invited:   'text-blue-700  bg-blue-50  border-blue-200',
  suspended: 'text-amber-700 bg-amber-50 border-amber-200',
};

interface MembersListProps {
  members: Member[];
  onSelect: (id: string) => void;
}

export function MembersList({ members, onSelect }: MembersListProps) {
  const [search, setSearch] = useState('');
  const [studio, setStudio] = useState<StudioId | 'all'>('all');

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const matchesStudio = studio === 'all' || m.studios.includes(studio);
    return matchesSearch && matchesStudio;
  });

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--field-supporting)]" width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--ac-surface2)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-colors w-52"
          />
        </div>
        <div className="flex items-center gap-1">
          {(['all','ag','gov','helix'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStudio(s)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                studio === s
                  ? 'bg-[var(--primary)] text-white border-transparent'
                  : 'bg-white text-[var(--field-supporting)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
            >
              {STUDIO_LABELS[s]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[var(--field-supporting)]">
          {filtered.length} member{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--ac-surface2)]">
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--field-supporting)] w-[40%]">Member</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--field-supporting)]">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--field-supporting)]">Studios</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[var(--field-supporting)]">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`border-b border-[var(--border)] last:border-0 cursor-pointer transition-colors hover:bg-[var(--ac-surface2)] ${i % 2 === 1 ? 'bg-[var(--ac-surface2)]/40' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {m.initials}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--field-text)]">{m.name}</div>
                      <div className="text-[var(--field-supporting)] text-[11px]">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium capitalize ${STATUS_STYLE[m.status]}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    {m.studios.length === 0
                      ? <span className="text-[var(--field-supporting)] italic">None</span>
                      : m.studios.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-[var(--ac-surface2)] border border-[var(--border)] rounded text-[10px] text-[var(--field-supporting)]">
                          {STUDIO_LABELS[s]}
                        </span>
                      ))
                    }
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--field-supporting)]">
                  {new Date(m.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-[var(--field-supporting)]">
            No members match your search.
          </div>
        )}
      </div>
    </div>
  );
}
