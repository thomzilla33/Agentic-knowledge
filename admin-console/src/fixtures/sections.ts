import type { SectionDef } from '../types';

export const SECTIONS: SectionDef[] = [
  { id: 'my-settings',            label: 'My Settings',               group: 'personal' },
  { id: 'people-access',          label: 'People & Access',           group: 'tenant' },
  { id: 'organization',           label: 'Organization',              group: 'tenant' },
  { id: 'identity-security',      label: 'Identity & Security',       group: 'tenant' },
  { id: 'studios-entitlements',   label: 'Studios & Entitlements',    group: 'tenant' },
  { id: 'billing-subscription',   label: 'Billing & Subscription',    group: 'tenant', corporateOnly: true },
  { id: 'governance-defaults',    label: 'Governance Defaults',       group: 'platform' },
  { id: 'data-privacy',           label: 'Data & Privacy',            group: 'platform' },
  { id: 'integrations-credentials', label: 'Integrations & Credentials', group: 'platform' },
  { id: 'notifications',          label: 'Notifications',             group: 'platform' },
  { id: 'audit-compliance',       label: 'Audit & Compliance',        group: 'platform' },
];

export const SECTION_MAP = Object.fromEntries(SECTIONS.map(s => [s.id, s])) as Record<string, SectionDef>;
