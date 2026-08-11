import type { PaRole, Member } from '../../types';
import { Button } from '../primitives/Button';

const STATUS_STYLE: Record<string, string> = {
  active:    'text-green-700 bg-green-50 border-green-200',
  invited:   'text-blue-700  bg-blue-50  border-blue-200',
  suspended: 'text-amber-700 bg-amber-50 border-amber-200',
};

interface RoleDetailProps {
  role: PaRole;
  members: Member[];
  onBack: () => void;
  onAssignMember: () => void;
  onRemoveMember: (memberId: string) => void;
}

export function RoleDetail({ role, members, onBack, onAssignMember, onRemoveMember }: RoleDetailProps) {
  const roleMembers = members.filter(m => role.memberIds.includes(m.id));

  return (
    <div>
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 focus-ring rounded"
        >
          ← Roles
        </button>
      </div>

      {/* Role card */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-5 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="5" width="14" height="10" rx="2" stroke="var(--primary)" strokeWidth="1.5"/>
              <path d="M6 5V4a3 3 0 016 0v1" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="9" cy="10" r="1.5" fill="var(--primary)"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-[var(--field-text)]">{role.name}</h2>
              {role.isBuiltIn && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--field-supporting)] bg-[var(--ac-surface2)] border border-[var(--border)] rounded">
                  Built-in
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--field-supporting)] mt-0.5">{role.description}</p>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--ac-surface2)]">
          <h3 className="text-xs font-semibold text-[var(--field-text)]">
            Members <span className="ml-1 font-normal text-[var(--field-supporting)]">({roleMembers.length})</span>
          </h3>
          <Button variant="secondary" size="sm" onClick={onAssignMember}>
            + Assign member
          </Button>
        </div>

        {roleMembers.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--field-supporting)]">
            No members in this role. Click "Assign member" to add one.
          </div>
        ) : (
          <div>
            {roleMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[var(--field-text)]">{m.name}</div>
                    <div className="text-[11px] text-[var(--field-supporting)]">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium capitalize ${STATUS_STYLE[m.status]}`}>
                    {m.status}
                  </span>
                  <button
                    onClick={() => onRemoveMember(m.id)}
                    title="Remove from role"
                    className="w-6 h-6 rounded flex items-center justify-center text-[var(--field-supporting)] border border-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
