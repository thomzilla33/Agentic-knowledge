import type { Member, PaRole, PaGroup, PermDef, MemberPermState } from '../types';

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

// ── Groups ───────────────────────────────────────────────────────────────────

export const PA_GROUPS: PaGroup[] = [
  { id: 'g001', name: 'Engineering',   description: 'Platform engineers and developers',          memberIds: ['p001','p002','p007'], color: '#6366f1' },
  { id: 'g002', name: 'Data & AI',     description: 'Data stewards and AI practitioners',         memberIds: ['p003','p005'],        color: '#8b5cf6' },
  { id: 'g003', name: 'Compliance',    description: 'Auditors and compliance officers',           memberIds: ['p004'],              color: '#f59e0b' },
  { id: 'g004', name: 'Product',       description: 'Product managers and designers',             memberIds: ['p001','p006','p008'], color: '#10b981' },
];

// ── Permission definitions ────────────────────────────────────────────────────

export const PERM_DEFS: PermDef[] = [
  // Agentic Studio
  { id: 'ag.agents.view',      code: 'ag.agents.view',      name: 'View Agents',         description: 'Read agent configurations, status, and metadata',         studioId: 'ag'  },
  { id: 'ag.agents.create',    code: 'ag.agents.create',    name: 'Create Agents',       description: 'Deploy new agents to the platform',                       studioId: 'ag'  },
  { id: 'ag.agents.edit',      code: 'ag.agents.edit',      name: 'Edit Agents',         description: 'Modify existing agent configurations and settings',        studioId: 'ag'  },
  { id: 'ag.agents.delete',    code: 'ag.agents.delete',    name: 'Delete Agents',       description: 'Permanently remove agents from the platform',              studioId: 'ag'  },
  { id: 'ag.workflows.view',   code: 'ag.workflows.view',   name: 'View Workflows',      description: 'Read workflow definitions and execution history',           studioId: 'ag'  },
  { id: 'ag.workflows.manage', code: 'ag.workflows.manage', name: 'Manage Workflows',    description: 'Create, edit, and delete workflow definitions',             studioId: 'ag'  },
  { id: 'ag.analytics.view',   code: 'ag.analytics.view',   name: 'View Analytics',      description: 'Access agent performance metrics and usage reports',        studioId: 'ag'  },
  { id: 'ag.sandbox.use',      code: 'ag.sandbox.use',      name: 'Use Sandbox',         description: 'Test and iterate agents in isolated sandbox environment',   studioId: 'ag'  },
  // Governance Studio
  { id: 'gov.domains.view',    code: 'gov.domains.view',    name: 'View Domains',        description: 'Browse knowledge domains and their configurations',         studioId: 'gov' },
  { id: 'gov.domains.manage',  code: 'gov.domains.manage',  name: 'Manage Domains',      description: 'Create and configure knowledge domains',                   studioId: 'gov' },
  { id: 'gov.policies.view',   code: 'gov.policies.view',   name: 'View Policies',       description: 'Read governance policies and compliance rules',             studioId: 'gov' },
  { id: 'gov.policies.manage', code: 'gov.policies.manage', name: 'Manage Policies',     description: 'Author and publish governance policies',                   studioId: 'gov' },
  { id: 'gov.promote.approve', code: 'gov.promote.approve', name: 'Approve Promotions',  description: 'Sign off on promotion packets from Sandbox to Truth plane', studioId: 'gov' },
  { id: 'gov.audit.view',      code: 'gov.audit.view',      name: 'View Audit Logs',     description: 'Access governance decision history and change log',         studioId: 'gov' },
  // Helix Data Studio
  { id: 'hx.models.view',      code: 'hx.models.view',      name: 'View Models',         description: 'Browse data models, entities, and schema definitions',      studioId: 'helix' },
  { id: 'hx.models.create',    code: 'hx.models.create',    name: 'Create Models',       description: 'Author new data models and entity schemas',                studioId: 'helix' },
  { id: 'hx.models.publish',   code: 'hx.models.publish',   name: 'Publish Models',      description: 'Promote models from Draft to Published state',             studioId: 'helix' },
  { id: 'hx.pipelines.view',   code: 'hx.pipelines.view',   name: 'View Pipelines',      description: 'Read data pipeline configurations and run history',         studioId: 'helix' },
  { id: 'hx.pipelines.run',    code: 'hx.pipelines.run',    name: 'Run Pipelines',       description: 'Trigger data pipeline executions',                         studioId: 'helix' },
  { id: 'hx.connections.view', code: 'hx.connections.view', name: 'View Connections',    description: 'Browse data source connection configurations',              studioId: 'helix' },
];

// Permissions each role grants (inherited)
const ROLE_PERMS: Record<string, string[]> = {
  'super-admin':  PERM_DEFS.map(p => p.id),
  'tenant-admin': PERM_DEFS.map(p => p.id),
  'developer':    ['ag.agents.view','ag.agents.create','ag.agents.edit','ag.workflows.view','ag.workflows.manage','ag.analytics.view','ag.sandbox.use'],
  'auditor':      ['gov.audit.view','gov.domains.view','gov.policies.view','hx.models.view','hx.pipelines.view'],
  'data-steward': ['gov.domains.view','gov.domains.manage','gov.policies.view','gov.policies.manage','gov.promote.approve','gov.audit.view','hx.models.view','hx.models.create','hx.models.publish','hx.pipelines.view','hx.pipelines.run','hx.connections.view'],
  'viewer':       ['ag.agents.view','ag.analytics.view','gov.domains.view','gov.policies.view','hx.models.view','hx.pipelines.view'],
};

export function getMemberPerms(_memberId: string, memberRoleIds: string[]): MemberPermState[] {
  return PERM_DEFS.map(def => {
    const grantingRole = memberRoleIds.find(rid => (ROLE_PERMS[rid] ?? []).includes(def.id));
    if (grantingRole) {
      const roleName = PA_ROLES.find(r => r.id === grantingRole)?.name ?? grantingRole;
      return { permId: def.id, state: 'inherited' as const, sourceRole: roleName };
    }
    return { permId: def.id, state: 'none' as const };
  });
}

// ── Activity log ──────────────────────────────────────────────────────────────

export type ActivityEvent = { msg: string; time: string; type: 'auth' | 'edit' | 'group' | 'role' | 'check' };

export const MEMBER_ACTIVITY: Record<string, ActivityEvent[]> = {
  p001: [
    { msg: 'Signed in from Chrome on macOS',          time: '2 hours ago',          type: 'auth'  },
    { msg: 'Updated Agentic Studio agent config',      time: 'Yesterday at 2:34 PM', type: 'edit'  },
    { msg: 'Added to Engineering group by Admin',      time: 'Aug 20 at 9:15 AM',   type: 'group' },
    { msg: 'Role updated: Viewer → Tenant Admin',      time: 'Aug 18 at 4:10 PM',   type: 'role'  },
    { msg: 'Approved promotion packet GV-2200',        time: 'Aug 15 at 11:30 AM',  type: 'check' },
  ],
  p002: [
    { msg: 'Signed in from Firefox on Windows',        time: '5 hours ago',          type: 'auth'  },
    { msg: 'Deployed new agent: Invoice Processor',    time: 'Yesterday at 10:00 AM', type: 'edit' },
    { msg: 'Created workflow: PO Approval Flow',       time: 'Aug 19 at 3:22 PM',   type: 'edit'  },
  ],
  p003: [
    { msg: 'Signed in from Safari on macOS',           time: '1 day ago',            type: 'auth'  },
    { msg: 'Published data model: Customer Entity',    time: 'Aug 21 at 11:05 AM',  type: 'edit'  },
    { msg: 'Approved governance policy GP-0042',       time: 'Aug 20 at 2:48 PM',   type: 'check' },
  ],
};
const DEFAULT_ACTIVITY: ActivityEvent[] = [
  { msg: 'Signed in from Chrome on macOS', time: '3 days ago', type: 'auth' },
];
export function getMemberActivity(memberId: string): ActivityEvent[] {
  return MEMBER_ACTIVITY[memberId] ?? DEFAULT_ACTIVITY;
}
