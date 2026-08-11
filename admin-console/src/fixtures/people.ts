import type { Member, PaRole } from '../types';

export const MEMBERS: Member[] = [
  { id: 'p001', name: 'Sofia Reyes',  email: 'sofia.reyes@contoso.com',  initials: 'SR', status: 'active',    studios: ['ag','gov','helix'], joinedAt: '2024-01-10' },
  { id: 'p002', name: 'Marcus Webb',  email: 'marcus.webb@contoso.com',  initials: 'MW', status: 'active',    studios: ['ag'],               joinedAt: '2024-02-14' },
  { id: 'p003', name: 'Ana Torres',   email: 'ana.torres@contoso.com',   initials: 'AT', status: 'active',    studios: ['gov','helix'],       joinedAt: '2024-03-05' },
  { id: 'p004', name: 'James Okafor', email: 'james.okafor@contoso.com', initials: 'JO', status: 'active',    studios: ['gov'],               joinedAt: '2024-04-18' },
  { id: 'p005', name: 'Priya Nair',   email: 'priya.nair@contoso.com',   initials: 'PN', status: 'active',    studios: ['helix'],             joinedAt: '2024-05-22' },
  { id: 'p006', name: 'Lena Schmidt', email: 'lena.schmidt@contoso.com', initials: 'LS', status: 'invited',   studios: [],                   joinedAt: '2024-06-01' },
  { id: 'p007', name: 'David Kim',    email: 'david.kim@contoso.com',    initials: 'DK', status: 'active',    studios: ['ag','gov'],          joinedAt: '2024-07-15' },
  { id: 'p008', name: 'Maya Patel',   email: 'maya.patel@contoso.com',   initials: 'MP', status: 'suspended', studios: ['helix'],             joinedAt: '2024-08-09' },
];

export const PA_ROLES: PaRole[] = [
  { id: 'super-admin',  name: 'Super Admin',  description: 'Full platform access',                  isBuiltIn: true,  memberIds: ['p001'] },
  { id: 'tenant-admin', name: 'Tenant Admin', description: 'Full tenant-level access',              isBuiltIn: true,  memberIds: ['p001','p007'] },
  { id: 'developer',    name: 'Developer',    description: 'Can build and deploy agents',           isBuiltIn: true,  memberIds: ['p002','p007'] },
  { id: 'auditor',      name: 'Auditor',      description: 'Read-only access to audit logs',        isBuiltIn: true,  memberIds: ['p004'] },
  { id: 'data-steward', name: 'Data Steward', description: 'Manage data models and governance',     isBuiltIn: false, memberIds: ['p003','p005'] },
  { id: 'viewer',       name: 'Viewer',        description: 'Read-only access to all studios',      isBuiltIn: false, memberIds: ['p006'] },
];

export const MEMBER_ROLES_INIT: Record<string, string[]> = {
  p001: ['super-admin','tenant-admin'],
  p002: ['developer'],
  p003: ['data-steward'],
  p004: ['auditor'],
  p005: ['data-steward'],
  p006: ['viewer'],
  p007: ['tenant-admin','developer'],
  p008: [],
};
