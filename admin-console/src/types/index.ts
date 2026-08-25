// ── Scope tree ──────────────────────────────────────────────────────────────

export type ScopeKind = 'operator' | 'corporate' | 'region' | 'location';
export type ScopeStatus = 'active' | 'suspended';

export type Scope = {
  id: string;
  name: string;
  kind: ScopeKind;
  parentId: string | null;
  status: ScopeStatus;
};

export type ScopeClosure = {
  ancestorId: string;
  descendantId: string;
  depth: number;
};

// ── Products & entitlements ──────────────────────────────────────────────────

export type Product =
  | 'helix-data-studio'
  | 'helix-governance-studio'
  | 'agentic-studio'
  | 'work-surfaces'
  | 'htl';

export type Entitlement = {
  scopeId: string;
  product: Product;
  active: boolean;
};

// ── Settings registry ────────────────────────────────────────────────────────

export type CascadeMode = 'LOCKED' | 'OVERRIDABLE' | 'ADD_ONLY' | 'NOT_CASCADABLE';
export type ValueKind = 'text' | 'number' | 'enum' | 'toggle' | 'list' | 'readonly';

export type SettingDef = {
  id: string;
  sectionId: SectionId;
  label: string;
  description: string;
  valueKind: ValueKind;
  options?: string[];
  defaultValue: unknown;
  cascade: CascadeMode;
  requiresProduct?: Product;
  editableAtKinds: ScopeKind[];
  floorRule?: 'HARDEN_ONLY';
  // For HARDEN_ONLY: returns true if candidate is stricter than current
  isStricter?: (candidate: unknown, current: unknown) => boolean;
};

// ── Setting values ───────────────────────────────────────────────────────────

export type SettingValue = {
  settingId: string;
  scopeId: string;
  value: unknown;
  setBy: string;
  setAt: string;
  packageVersion: string;
};

// ── Principals & policies ────────────────────────────────────────────────────

export type ScopeSelector = 'self' | 'self+descendants' | 'tree';
export type AccessLevel = 'read' | 'write';

export type PolicyGrant = {
  sectionId: SectionId;
  scopeSelector: ScopeSelector;
  access: AccessLevel;
};

export type Policy = {
  id: string;
  name: string;
  grants: PolicyGrant[];
};

export type Principal = {
  id: string;
  name: string;
  email: string;
  homeScopeId: string;
  policyIds: string[];
};

// ── Audit ────────────────────────────────────────────────────────────────────

export type AuditEvent = {
  id: string;
  settingId: string;
  scopeId: string;
  actorId: string;
  at: string;
  priorValue: unknown;
  newValue: unknown;
  affectedScopeIds: string[];
  onBehalfOfScopeId?: string;
};

// ── Sections ─────────────────────────────────────────────────────────────────

export type SectionGroup = 'personal' | 'tenant' | 'platform';

export type SectionId =
  | 'my-settings'
  | 'people-access'
  | 'organization'
  | 'identity-security'
  | 'studios-entitlements'
  | 'billing-subscription'
  | 'governance-defaults'
  | 'data-privacy'
  | 'integrations-credentials'
  | 'notifications'
  | 'audit-compliance';

export type SectionDef = {
  id: SectionId;
  label: string;
  group: SectionGroup;
  // corporate/operator only (Billing)
  corporateOnly?: boolean;
};

// ── Origins ──────────────────────────────────────────────────────────────────

export type OriginStudio =
  | 'agentic-studio'
  | 'helix-governance-studio'
  | 'helix-data-studio'
  | 'work-surfaces'
  | 'htl';

// ── Fixture container ────────────────────────────────────────────────────────

export type FixtureId = 'single-company' | 'multi-location' | 'vertical-paas';

export type Fixture = {
  id: FixtureId;
  label: string;
  scopes: Scope[];
  closure: ScopeClosure[];
  entitlements: Entitlement[];
  settingValues: SettingValue[];
};

// ── Resolved value ───────────────────────────────────────────────────────────

export type ResolvedValue = {
  value: unknown;
  source: 'local' | 'inherited' | 'default';
  sourceScopeId?: string;
  locked: boolean;
  mode: CascadeMode;
  packageVersion?: string;
  setBy?: string;
  setAt?: string;
};

// ── Impact preview ───────────────────────────────────────────────────────────

export type ImpactEntry = {
  scopeId: string;
  scopeName: string;
  outcome: 'will-update' | 'keeps-override' | 'locked-upstream';
};

export type ImpactResult = {
  entries: ImpactEntry[];
  version: string; // snapshot token for staleness check
};

// ── People & Access ──────────────────────────────────────────────────────────

export type MemberStatus = 'active' | 'invited' | 'suspended';
export type StudioId = 'ag' | 'gov' | 'helix';
export type PermState = 'granted' | 'inherited' | 'denied' | 'none';

export interface Member {
  id: string;
  name: string;
  email: string;
  initials: string;
  status: MemberStatus;
  studios: StudioId[];
  joinedAt: string;
}

export interface PaRole {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  memberIds: string[];
}

export interface PaGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  color: string;
}

export interface PermDef {
  id: string;
  code: string;
  name: string;
  description: string;
  studioId: StudioId;
}

export interface MemberPermState {
  permId: string;
  state: PermState;
  sourceRole?: string;
}

// ── API error ────────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'STALE_WRITE'
  | 'PERMISSION_DENIED'
  | 'API_FAILURE'
  | 'NOT_FOUND'
  | 'FLOOR_VIOLATION';

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  context?: Record<string, unknown>;
};
