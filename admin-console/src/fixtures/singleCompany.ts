import type { Fixture, Scope, ScopeClosure, Entitlement, SettingValue } from '../types';

const scopes: Scope[] = [
  { id: 'sc-corp', name: 'Meridian Manufacturing', kind: 'corporate', parentId: null, status: 'active' },
];

// Closure: every node is its own ancestor/descendant at depth 0
const closure: ScopeClosure[] = [
  { ancestorId: 'sc-corp', descendantId: 'sc-corp', depth: 0 },
];

const entitlements: Entitlement[] = [
  { scopeId: 'sc-corp', product: 'helix-data-studio',         active: true },
  { scopeId: 'sc-corp', product: 'helix-governance-studio',   active: true },
  { scopeId: 'sc-corp', product: 'agentic-studio',            active: true },
  { scopeId: 'sc-corp', product: 'work-surfaces',             active: true },
  { scopeId: 'sc-corp', product: 'htl',                       active: false },
];

const settingValues: SettingValue[] = [
  {
    settingId: 'org-display-name',
    scopeId: 'sc-corp',
    value: 'Meridian Manufacturing',
    setBy: 'principal-tenant-admin',
    setAt: '2025-11-01T09:00:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'org-timezone',
    scopeId: 'sc-corp',
    value: 'America/New_York',
    setBy: 'principal-tenant-admin',
    setAt: '2025-11-01T09:05:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'people-mfa-required',
    scopeId: 'sc-corp',
    value: true,
    setBy: 'principal-tenant-admin',
    setAt: '2025-11-15T14:20:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'people-allowed-domains',
    scopeId: 'sc-corp',
    value: ['meridian.com'],
    setBy: 'principal-tenant-admin',
    setAt: '2025-11-15T14:25:00Z',
    packageVersion: '1.0.0',
  },
  {
    settingId: 'gov-default-content-tier',
    scopeId: 'sc-corp',
    value: 'canon-plane',
    setBy: 'principal-tenant-admin',
    setAt: '2025-12-01T10:00:00Z',
    packageVersion: '1.0.0',
  },
];

export const singleCompanyFixture: Fixture = {
  id: 'single-company',
  label: 'Single Company',
  scopes,
  closure,
  entitlements,
  settingValues,
};
