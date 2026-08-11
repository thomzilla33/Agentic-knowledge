import type { PaRole, Member } from '../../types';

interface RolesListProps {
  roles: PaRole[];
  members: Member[];
  onSelect: (id: string) => void;
}

export function RolesList({ roles, members, onSelect }: RolesListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {roles.map(role => {
        const roleMembers = members.filter(m => role.memberIds.includes(m.id));
        return (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className="text-left p-4 bg-white border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-semibold text-sm text-[var(--field-text)] group-hover:text-[var(--primary)] transition-colors">
                {role.name}
              </div>
              {role.isBuiltIn && (
                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium text-[var(--field-supporting)] bg-[var(--ac-surface2)] border border-[var(--border)] rounded">
                  Built-in
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--field-supporting)] mb-3 leading-relaxed">{role.description}</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {roleMembers.slice(0, 4).map(m => (
                  <div
                    key={m.id}
                    title={m.name}
                    className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[8px] font-semibold flex items-center justify-center ring-1 ring-white"
                  >
                    {m.initials}
                  </div>
                ))}
                {roleMembers.length > 4 && (
                  <div className="w-5 h-5 rounded-full bg-[var(--ac-surface2)] text-[var(--field-supporting)] text-[8px] font-semibold flex items-center justify-center ring-1 ring-white">
                    +{roleMembers.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs text-[var(--field-supporting)]">
                {roleMembers.length} member{roleMembers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
