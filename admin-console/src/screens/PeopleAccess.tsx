import { useState, useCallback } from 'react';
import type { Member, PaRole } from '../types';
import {
  getMembers, getRoles, getMemberRoles,
  assignMemberToRole, removeMemberFromRole,
} from '../mockApi/people';
import { MembersList } from '../components/people-access/MembersList';
import { RolesList } from '../components/people-access/RolesList';
import { MemberDetail } from '../components/people-access/MemberDetail';
import { RoleDetail } from '../components/people-access/RoleDetail';
import { AssignPicker } from '../components/people-access/AssignPicker';

type Tab = 'members' | 'roles';

type View =
  | { kind: 'members-list' }
  | { kind: 'member-detail'; memberId: string }
  | { kind: 'roles-list' }
  | { kind: 'role-detail'; roleId: string };

interface PickerState {
  mode: 'assign-member' | 'assign-role';
  contextId: string;
}

function useData() {
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev(r => r + 1), []);
  return { members: getMembers(), roles: getRoles(), memberRoles: getMemberRoles(), bump, rev };
}

export function PeopleAccessScreen() {
  const { members, roles, memberRoles, bump } = useData();
  const [view, setView] = useState<View>({ kind: 'members-list' });
  const [picker, setPicker] = useState<PickerState | null>(null);

  const activeTab: Tab = view.kind.startsWith('role') ? 'roles' : 'members';

  function selectTab(tab: Tab) {
    setView(tab === 'members' ? { kind: 'members-list' } : { kind: 'roles-list' });
  }

  // ── Member actions ──────────────────────────────────────────────────────────

  function handleSelectMember(id: string) {
    setView({ kind: 'member-detail', memberId: id });
  }

  function handleRemoveRoleFromMember(memberId: string, roleId: string) {
    removeMemberFromRole(roleId, memberId);
    bump();
  }

  function handleAssignRoleToMember(memberId: string, roleIds: string[]) {
    roleIds.forEach(rid => assignMemberToRole(rid, memberId));
    bump();
    setPicker(null);
  }

  // ── Role actions ────────────────────────────────────────────────────────────

  function handleSelectRole(id: string) {
    setView({ kind: 'role-detail', roleId: id });
  }

  function handleRemoveMemberFromRole(roleId: string, memberId: string) {
    removeMemberFromRole(roleId, memberId);
    bump();
  }

  function handleAssignMemberToRole(roleId: string, memberIds: string[]) {
    memberIds.forEach(mid => assignMemberToRole(roleId, mid));
    bump();
    setPicker(null);
  }

  // ── Picker items ────────────────────────────────────────────────────────────

  function pickerItems() {
    if (!picker) return [];
    if (picker.mode === 'assign-role') {
      // roles not yet assigned to this member
      const assigned = memberRoles[picker.contextId] ?? [];
      return roles
        .filter(r => !assigned.includes(r.id))
        .map(r => ({ id: r.id, primary: r.name, secondary: r.description, initials: r.name.slice(0, 2).toUpperCase() }));
    } else {
      // members not yet in this role
      const role = roles.find(r => r.id === picker.contextId);
      const inRole = role?.memberIds ?? [];
      return members
        .filter(m => !inRole.includes(m.id))
        .map(m => ({ id: m.id, primary: m.name, secondary: m.email, initials: m.initials }));
    }
  }

  function handlePickerConfirm(ids: string[]) {
    if (!picker) return;
    if (picker.mode === 'assign-role') {
      handleAssignRoleToMember(picker.contextId, ids);
    } else {
      handleAssignMemberToRole(picker.contextId, ids);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const currentMember: Member | undefined =
    view.kind === 'member-detail' ? members.find(m => m.id === view.memberId) : undefined;

  const currentRole: PaRole | undefined =
    view.kind === 'role-detail' ? roles.find(r => r.id === view.roleId) : undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-5">
        {(['members', 'roles'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => selectTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
              activeTab === tab
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--field-supporting)] hover:text-[var(--field-text)] hover:bg-[var(--ac-surface2)]'
            }`}
          >
            {tab === 'members' ? 'Members' : 'Roles'}
          </button>
        ))}
      </div>

      {/* Content */}
      {view.kind === 'members-list' && (
        <MembersList members={members} onSelect={handleSelectMember} />
      )}

      {view.kind === 'member-detail' && currentMember && (
        <MemberDetail
          member={currentMember}
          roles={roles}
          memberRoles={memberRoles[currentMember.id] ?? []}
          onBack={() => setView({ kind: 'members-list' })}
          onAssignRole={() => setPicker({ mode: 'assign-role', contextId: currentMember.id })}
          onRemoveRole={roleId => handleRemoveRoleFromMember(currentMember.id, roleId)}
        />
      )}

      {view.kind === 'roles-list' && (
        <RolesList roles={roles} members={members} onSelect={handleSelectRole} />
      )}

      {view.kind === 'role-detail' && currentRole && (
        <RoleDetail
          role={currentRole}
          members={members}
          onBack={() => setView({ kind: 'roles-list' })}
          onAssignMember={() => setPicker({ mode: 'assign-member', contextId: currentRole.id })}
          onRemoveMember={memberId => handleRemoveMemberFromRole(currentRole.id, memberId)}
        />
      )}

      {/* Assign picker modal */}
      {picker && (
        <AssignPicker
          title={picker.mode === 'assign-role' ? 'Assign role' : 'Assign member'}
          items={pickerItems()}
          onConfirm={handlePickerConfirm}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
