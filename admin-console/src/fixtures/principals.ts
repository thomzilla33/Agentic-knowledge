import type { Principal, Policy } from '../types';

// ── Policies ──────────────────────────────────────────────────────────────────

export const POLICIES: Policy[] = [
  {
    id: 'pol-tenant-admin-full',
    name: 'Tenant Admin — Full Access',
    grants: [
      { sectionId: 'people-access',           scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'organization',             scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'identity-security',        scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'studios-entitlements',     scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'billing-subscription',     scopeSelector: 'self',             access: 'write' },
      { sectionId: 'governance-defaults',      scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'data-privacy',             scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'integrations-credentials', scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'notifications',            scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'audit-compliance',         scopeSelector: 'self+descendants', access: 'write' },
    ],
  },
  {
    id: 'pol-read-only-auditor',
    name: 'Read-Only Auditor',
    grants: [
      { sectionId: 'audit-compliance',         scopeSelector: 'tree', access: 'read' },
      { sectionId: 'governance-defaults',      scopeSelector: 'tree', access: 'read' },
      { sectionId: 'data-privacy',             scopeSelector: 'tree', access: 'read' },
    ],
  },
  {
    id: 'pol-location-admin-loc3',
    name: 'Location Admin — Location 3 Only',
    grants: [
      // Grants are evaluated against the principal's accessible scopes; loc3 only
      { sectionId: 'people-access',            scopeSelector: 'self', access: 'write' },
      { sectionId: 'notifications',            scopeSelector: 'self', access: 'write' },
      { sectionId: 'governance-defaults',      scopeSelector: 'self', access: 'write' },
      { sectionId: 'integrations-credentials', scopeSelector: 'self', access: 'write' },
    ],
  },
  {
    id: 'pol-operator-admin',
    name: 'Operator Admin — Full Tree',
    grants: [
      { sectionId: 'people-access',            scopeSelector: 'tree', access: 'write' },
      { sectionId: 'organization',             scopeSelector: 'tree', access: 'write' },
      { sectionId: 'identity-security',        scopeSelector: 'tree', access: 'write' },
      { sectionId: 'studios-entitlements',     scopeSelector: 'tree', access: 'write' },
      { sectionId: 'billing-subscription',     scopeSelector: 'self', access: 'write' },
      { sectionId: 'governance-defaults',      scopeSelector: 'tree', access: 'write' },
      { sectionId: 'data-privacy',             scopeSelector: 'tree', access: 'write' },
      { sectionId: 'integrations-credentials', scopeSelector: 'tree', access: 'write' },
      { sectionId: 'notifications',            scopeSelector: 'tree', access: 'write' },
      { sectionId: 'audit-compliance',         scopeSelector: 'tree', access: 'write' },
    ],
  },
  {
    id: 'pol-notifications-write',
    name: 'Notifications Manager',
    grants: [
      { sectionId: 'notifications',            scopeSelector: 'self+descendants', access: 'write' },
      { sectionId: 'governance-defaults',      scopeSelector: 'self+descendants', access: 'read' },
    ],
  },
];

export const POLICY_MAP = Object.fromEntries(POLICIES.map(p => [p.id, p])) as Record<string, Policy>;

// ── Principals ────────────────────────────────────────────────────────────────

// homeScopeId is a placeholder key — fixtures resolve it to real scope IDs at load time
export const PRINCIPALS: Principal[] = [
  {
    id: 'principal-tenant-admin',
    name: 'Sofia Reyes',
    email: 'sofia.reyes@meridian.com',
    homeScopeId: 'CORPORATE_SCOPE',   // resolved by fixture
    policyIds: ['pol-tenant-admin-full'],
  },
  {
    id: 'principal-no-grants',
    name: 'Marcus Webb',
    email: 'marcus.webb@meridian.com',
    homeScopeId: 'CORPORATE_SCOPE',
    policyIds: [],                     // zero admin grants — My Settings only
  },
  {
    id: 'principal-location-admin',
    name: 'Ana Torres',
    email: 'ana.torres@meridian.com',
    homeScopeId: 'LOCATION_3_SCOPE',  // resolved by fixture — location admin
    policyIds: ['pol-location-admin-loc3'],
  },
  {
    id: 'principal-auditor',
    name: 'James Okafor',
    email: 'j.okafor@meridian.com',
    homeScopeId: 'CORPORATE_SCOPE',
    policyIds: ['pol-read-only-auditor'],
  },
  {
    id: 'principal-operator-admin',
    name: 'Priya Nair',
    email: 'p.nair@industryos.com',
    homeScopeId: 'OPERATOR_SCOPE',    // resolved by fixture — for PaaS fixture
    policyIds: ['pol-operator-admin'],
  },
  {
    id: 'principal-notif-manager',
    name: 'Lena Schmidt',
    email: 'l.schmidt@meridian.com',
    homeScopeId: 'CORPORATE_SCOPE',
    policyIds: ['pol-notifications-write'],
  },
];
