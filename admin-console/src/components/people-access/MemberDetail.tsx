import type { Member, PaRole } from '../../types';
import { Button } from '../primitives/Button';

const STATUS_STYLE: Record<string, string> = {
  active:    'text-green-700 bg-green-50 border-green-200',
  invited:   'text-blue-700  bg-blue-50  border-blue-200',
  suspended: 'text-amber-700 bg-amber-50 border-amber-200',
};

const STUDIO_LABELS: Record<string, string> = {
  ag:    'Agentic Studio',
  gov:   'Governance Studio',
  helix: 'Helix DS',
};

interface MemberDetailProps {
  member: Member;
  roles: PaRole[];
  memberRoles: string[];
  onBack: () => void;
  onAssignRole: () => void;
  onRemoveRole: (roleId: string) => void;
}

export function MemberDetail({ member, roles, memberRoles, onBack, onAssignRole, onRemoveRole }: MemberDetailProps) {
  const assignedRoles = roles.filter(r => memberRoles.includes(r.id));

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 focus-ring rounded"
        >
          ← Members
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-[var(--border)] rounded-lg p-5 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white text-sm font-semibold flex items-center justify-center shrink-0">
            {member.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-[var(--field-text)]">{member.name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium capitalize ${STATUS_STYLE[member.status]}`}>
                {member.status}
              </span>
            </div>
            <p className="text-xs text-[var(--field-supporting)] mt-0.5">{member.email}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-[var(--field-supporting)] mb-1">Studios</div>
            <div className="flex flex-wrap gap-1">
              {member.studios.length === 0
                ? <span className="text-[var(--field-supporting)] italic">None</span>
                : member.studios.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-[var(--ac-surface2)] border border-[var(--border)] rounded text-[var(--field-text)]">
                    {STUDIO_LABELS[s]}
                  </span>
                ))
              }
            </div>
          </div>
          <div>
            <div className="text-[var(--field-supporting)] mb-1">Joined</div>
            <div className="text-[var(--field-text)]">
              {new Date(member.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Roles section */}
      <div className="bg-white border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--ac-surface2)]">
          <h3 className="text-xs font-semibold text-[var(--field-text)]">
            Roles <span className="ml-1 font-normal text-[var(--field-supporting)]">({assignedRoles.length})</span>
          </h3>
          <Button variant="secondary" size="sm" onClick={onAssignRole}>
            + Assign role
          </Button>
        </div>

        {assignedRoles.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--field-supporting)]">
            No roles assigned. Click "Assign role" to add one.
          </div>
        ) : (
          <div>
            {assignedRoles.map(role => (
              <div key={role.id} className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] last:border-0">
                <div>
                  <div className="text-xs font-medium text-[var(--field-text)]">{role.name}</div>
                  <div className="text-[11px] text-[var(--field-supporting)] mt-0.5">{role.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {role.isBuiltIn && (
                    <span className="px-1.5 py-0.5 text-[10px] text-[var(--field-supporting)] bg-[var(--ac-surface2)] border border-[var(--border)] rounded">
                      Built-in
                    </span>
                  )}
                  <button
                    onClick={() => onRemoveRole(role.id)}
                    title="Remove role"
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
