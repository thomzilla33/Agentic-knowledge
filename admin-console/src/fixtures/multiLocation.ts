import type { Fixture, Scope, ScopeClosure, Entitlement, SettingValue } from '../types';

// 1 corporate + 2 regions + 10 locations
const scopes: Scope[] = [
  { id: 'ml-corp',   name: 'Meridian Corp',     kind: 'corporate', parentId: null,      status: 'active' },
  { id: 'ml-reg1',  name: 'East Region',        kind: 'region',    parentId: 'ml-corp', status: 'active' },
  { id: 'ml-reg2',  name: 'West Region',        kind: 'region',    parentId: 'ml-corp', status: 'active' },
  { id: 'ml-loc1',  name: 'Boston HQ',          kind: 'location',  parentId: 'ml-reg1', status: 'active' },
  { id: 'ml-loc2',  name: 'New York Office',    kind: 'location',  parentId: 'ml-reg1', status: 'active' },
  { id: 'ml-loc3',  name: 'Philadelphia Lab',   kind: 'location',  parentId: 'ml-reg1', status: 'active' },
  { id: 'ml-loc4',  name: 'Atlanta Branch',     kind: 'location',  parentId: 'ml-reg1', status: 'suspended' },
  { id: 'ml-loc5',  name: 'Miami Office',       kind: 'location',  parentId: 'ml-reg1', status: 'active' },
  { id: 'ml-loc6',  name: 'Seattle HQ',         kind: 'location',  parentId: 'ml-reg2', status: 'active' },
  { id: 'ml-loc7',  name: 'San Francisco',      kind: 'location',  parentId: 'ml-reg2', status: 'active' },
  { id: 'ml-loc8',  name: 'Los Angeles',        kind: 'location',  parentId: 'ml-reg2', status: 'active' },
  { id: 'ml-loc9',  name: 'Portland Office',    kind: 'location',  parentId: 'ml-reg2', status: 'active' },
  { id: 'ml-loc10', name: 'Denver Remote Hub',  kind: 'location',  parentId: 'ml-reg2', status: 'active' },
];

// Build closure table from the tree above
function buildClosure(scopes: Scope[]): ScopeClosure[] {
  const entries: ScopeClosure[] = [];
  const parentMap = Object.fromEntries(scopes.map(s => [s.id, s.parentId]));

  for (const scope of scopes) {
    // Self
    entries.push({ ancestorId: scope.id, descendantId: scope.id, depth: 0 });
    // Walk up to root
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
  { scopeId: 'ml-corp', product: 'helix-data-studio',         active: true },
  { scopeId: 'ml-corp', product: 'helix-governance-studio',   active: true },
  { scopeId: 'ml-corp', product: 'agentic-studio',            active: true },
  { scopeId: 'ml-corp', product: 'work-surfaces',             active: true },
  { scopeId: 'ml-corp', product: 'htl',                       active: false },
];

const settingValues: SettingValue[] = [
  // Corporate-level values
  {
    settingId: 'org-display-name',
    scopeId: 'ml-corp',
    value: 'Meridian Corp',
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-01T08:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'people-mfa-required',
    scopeId: 'ml-corp',
    value: false,
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-01T08:30:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'people-allowed-domains',
    scopeId: 'ml-corp',
    value: ['meridian.com'],
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-01T09:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'gov-require-approval',
    scopeId: 'ml-corp',
    value: true,
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-05T11:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'gov-default-content-tier',
    scopeId: 'ml-corp',
    value: 'sandbox-plane',
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-05T11:05:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'audit-retention-days',
    scopeId: 'ml-corp',
    value: 730,
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-10T10:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'privacy-data-residency',
    scopeId: 'ml-corp',
    value: 'us-east',
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-10T10:30:00Z',
    packageVersion: '1.0.0',
  },
  // Region-level values
  {
    settingId: 'org-timezone',
    scopeId: 'ml-reg1',
    value: 'America/New_York',
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-12T09:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'org-timezone',
    scopeId: 'ml-reg2',
    value: 'America/Los_Angeles',
    setBy: 'principal-tenant-admin',
    setAt: '2025-10-12T09:05:00Z',
    packageVersion: '1.0.0',
  },
  // Location overrides — 3 of 10 locations have local overrides on gov-default-content-tier
  // (for edge case 16: impact preview separates "7 will take new value" from "3 keep override")
  {
    settingId: 'gov-default-content-tier',
    scopeId: 'ml-loc1',
    value: 'canon-plane',
    setBy: 'principal-location-admin',
    setAt: '2025-11-01T14:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'gov-default-content-tier',
    scopeId: 'ml-loc3',
    value: 'truth-plane',
    setBy: 'principal-location-admin',
    setAt: '2025-11-02T10:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'gov-default-content-tier',
    scopeId: 'ml-loc6',
    value: 'ad-hoc-vault',
    setBy: 'principal-tenant-admin',
    setAt: '2025-11-03T09:00:00Z',
    packageVersion: '1.0.0',
  },
  // MFA override at loc3 (for edge case 13 / HARDEN_ONLY demonstration)
  {
    settingId: 'people-mfa-required',
    scopeId: 'ml-loc3',
    value: true,
    setBy: 'principal-location-admin',
    setAt: '2025-11-15T11:00:00Z',
    packageVersion: '1.0.0',
  },
  // ADD_ONLY list override at a location
  {
    settingId: 'people-allowed-domains',
    scopeId: 'ml-loc3',
    value: ['meridian-philly.com'],
    setBy: 'principal-location-admin',
    setAt: '2025-11-15T11:30:00Z',
    packageVersion: '1.0.0',
  },
  // NOT_CASCADABLE credentials — only at the scopes that set them
  {
    settingId: 'integrations-snowflake-dsn',
    scopeId: 'ml-loc3',
    value: 'snowflake://philly.meridian.snowflakecomputing.com',
    setBy: 'principal-location-admin',
    setAt: '2025-12-01T09:00:00Z',
    packageVersion: '1.0.0',
  },
];

export const multiLocationFixture: Fixture = {
  id: 'multi-location',
  label: 'Multi-Location',
  scopes,
  closure,
  entitlements,
  settingValues,
};
