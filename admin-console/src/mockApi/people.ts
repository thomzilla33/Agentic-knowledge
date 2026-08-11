import { MEMBERS, PA_ROLES, MEMBER_ROLES_INIT } from '../fixtures/people';
import type { Member, PaRole } from '../types';

let members: Member[] = MEMBERS.map(m => ({ ...m, studios: [...m.studios] }));
let roles: PaRole[] = PA_ROLES.map(r => ({ ...r, memberIds: [...r.memberIds] }));
let memberRoles: Record<string, string[]> = Object.fromEntries(
  Object.entries(MEMBER_ROLES_INIT).map(([k, v]) => [k, [...v]])
);

export function getMembers(): Member[] { return members; }
export function getRoles(): PaRole[] { return roles; }
export function getMemberRoles(): Record<string, string[]> { return memberRoles; }

export function assignMemberToRole(roleId: string, memberId: string): void {
  roles = roles.map(r =>
    r.id === roleId && !r.memberIds.includes(memberId)
      ? { ...r, memberIds: [...r.memberIds, memberId] }
      : r
  );
  const existing = memberRoles[memberId] ?? [];
  memberRoles = {
    ...memberRoles,
    [memberId]: existing.includes(roleId) ? existing : [...existing, roleId],
  };
}

export function removeMemberFromRole(roleId: string, memberId: string): void {
  roles = roles.map(r =>
    r.id === roleId ? { ...r, memberIds: r.memberIds.filter(id => id !== memberId) } : r
  );
  memberRoles = {
    ...memberRoles,
    [memberId]: (memberRoles[memberId] ?? []).filter(id => id !== roleId),
  };
}
