import type { Fixture, Scope, ScopeClosure, Entitlement, SettingValue } from '../types';

// 1 operator + 4 subscribers + 3 locations under subscriber-1
const scopes: Scope[] = [
  { id: 'vp-op',    name: 'Industry Brain (Operator)', kind: 'operator',  parentId: null,    status: 'active' },
  { id: 'vp-sub1',  name: 'RetailCo',                 kind: 'corporate', parentId: 'vp-op', status: 'active' },
  { id: 'vp-sub2',  name: 'HealthNet',                kind: 'corporate', parentId: 'vp-op', status: 'active' },
  { id: 'vp-sub3',  name: 'FinServ Partners',         kind: 'corporate', parentId: 'vp-op', status: 'suspended' },
  { id: 'vp-sub4',  name: 'LogiCore',                 kind: 'corporate', parentId: 'vp-op', status: 'active' },
  // Sub1 has 3 locations
  { id: 'vp-loc1',  name: 'RetailCo — Chicago',       kind: 'location',  parentId: 'vp-sub1', status: 'active' },
  { id: 'vp-loc2',  name: 'RetailCo — Austin',        kind: 'location',  parentId: 'vp-sub1', status: 'active' },
  { id: 'vp-loc3',  name: 'RetailCo — Miami',         kind: 'location',  parentId: 'vp-sub1', status: 'active' },
];

function buildClosure(scopes: Scope[]): ScopeClosure[] {
  const entries: ScopeClosure[] = [];
  const parentMap = Object.fromEntries(scopes.map(s => [s.id, s.parentId]));
  for (const scope of scopes) {
    entries.push({ ancestorId: scope.id, descendantId: scope.id, depth: 0 });
    let cur = scope.id;
    let depth = 1;
    while (parentMap[cur] != null) {
      const parent = parentMap[cur] as string;
      entries.push({ ancestorId: parent, descendantId: scope.id, depth });
      cur = parent;
      depth++;
    }
  }
  return entries;
}

const closure: ScopeClosure[] = buildClosure(scopes);

const entitlements: Entitlement[] = [
  // Operator holds all products
  { scopeId: 'vp-op',   product: 'helix-data-studio',       active: true },
  { scopeId: 'vp-op',   product: 'helix-governance-studio', active: true },
  { scopeId: 'vp-op',   product: 'agentic-studio',          active: true },
  { scopeId: 'vp-op',   product: 'work-surfaces',           active: true },
  { scopeId: 'vp-op',   product: 'htl',                     active: true },
];

const settingValues: SettingValue[] = [
  // Operator-level locked values
  {
    settingId: 'privacy-data-residency',
    scopeId: 'vp-op',
    value: 'us-east',
    setBy: 'principal-operator-admin',
    setAt: '2025-09-01T08:00:00Z',
    packageVersion: '2.0.0',
  },
  {
    settingId: 'people-max-session-duration',
    scopeId: 'vp-op',
    value: 12,
    setBy: 'principal-operator-admin',
    setAt: '2025-09-01T08:10:00Z',
    packageVersion: '2.0.0',
  },
  {
    settingId: 'audit-retention-days',
    scopeId: 'vp-op',
    value: 1095,
    setBy: 'principal-operator-admin',
    setAt: '2025-09-01T08:15:00Z',
    packageVersion: '2.0.0',
  },
  {
    settingId: 'gov-require-approval',
    scopeId: 'vp-op',
    value: true,
    setBy: 'principal-operator-admin',
    setAt: '2025-09-01T09:00:00Z',
    packageVersion: '2.0.0',
  },
  // Sub1 has its own display name and timezone
  {
    settingId: 'org-display-name',
    scopeId: 'vp-sub1',
    value: 'RetailCo',
    setBy: 'principal-tenant-admin',
    setAt: '2025-09-15T10:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'org-timezone',
    scopeId: 'vp-sub1',
    value: 'America/Chicago',
    setBy: 'principal-tenant-admin',
    setAt: '2025-09-15T10:05:00Z',
    packageVersion: '1.0.0',
  },
  // NOT_CASCADABLE credential at operator — must NOT propagate to subscribers
  {
    settingId: 'integrations-snowflake-dsn',
    scopeId: 'vp-op',
    value: 'snowflake://operator-internal.snowflakecomputing.com',
    setBy: 'principal-operator-admin',
    setAt: '2025-09-20T09:00:00Z',
    packageVersion: '2.0.0',
  },
];

export const verticalPaaSFixture: Fixture = {
  id: 'vertical-paas',
  label: 'Vertical PaaS',
  scopes,
  closure,
  entitlements,
  settingValues,
};
