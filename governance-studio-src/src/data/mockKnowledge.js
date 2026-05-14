// ── TRUTH PACKS ────────────────────────────────────────────────────────────────
// Knowledge module mock data
// Each Truth Pack is a governed distribution unit of verified facts

// ────────────────────────────────────────────────────────────────────────────
// ACCESS LEVELS — set at attestation time. Used by the Knowledge Pack picker
// to enforce permission boundaries: items below the user's clearance appear
// disabled with a "Request access" affordance instead of being hidden.
// ────────────────────────────────────────────────────────────────────────────
/**
 * @typedef {'public' | 'workspace' | 'restricted' | 'pii'} AccessLevel
 */
export const ACCESS_LEVELS = {
  public: {
    label:            'Public',
    description:      'Available to everyone with workspace access',
    badgeColor:       null,           // no badge in picker by default
    requiresApproval: false,
  },
  workspace: {
    label:            'Workspace',
    description:      'Internal — anyone in this workspace can use it',
    badgeColor:       '#60a5fa',      // blue
    requiresApproval: false,
  },
  restricted: {
    label:            'Restricted',
    description:      'Request access from the owner before using in packs',
    badgeColor:       '#fbbf24',      // amber
    requiresApproval: true,
  },
  pii: {
    label:            'PII',
    description:      'Personal or regulated data — compliance review required',
    badgeColor:       '#f87171',      // red
    requiresApproval: true,
  },
}

export const truthPacks = [
  {
    id: 'KP-001',
    name: 'Enterprise Contract Standards',
    description:
      'Core contract terms, SLA commitments, and payment conditions governing all enterprise agreements. Used by deal-desk agents and contract reviewers.',
    status: 'active',
    accessType: 'mixed',
    owner: 'Sarah Chen',
    ownerInitials: 'SC',
    ownerGradient: 'linear-gradient(135deg,#3b82f6,#60a5fa)',
    department: 'Legal',
    scope: 'Enterprise',
    factsCount: 24,
    usersCount: 18,
    agentsCount: 3,
    networksCount: 2,
    lastUpdated: '2026-04-12',
    linkedTruthPlane: 'Enterprise Compliance',
    linkedTruthPlaneId: 'tp1',
    usage: 'high',
    isStale: false,
    tags: ['contracts', 'SLA', 'payments'],
    factIds: ['TF-0001', 'TF-0002', 'TF-0003', 'TF-0004', 'TF-0005'],
    recentActivity: [
      { action: 'Fact updated', by: 'Sarah Chen', at: '2026-04-12' },
      { action: 'Access granted to Deal Desk Agent', by: 'Sarah Chen', at: '2026-04-10' },
      { action: 'Pack published', by: 'Sarah Chen', at: '2026-03-20' },
    ],
    accessDetails: {
      users: ['Emma Rodriguez', 'David Kim', 'Lisa Anderson', '+15 more'],
      agents: ['Deal Desk Agent', 'Contract Reviewer', 'Renewal Bot'],
      networks: ['Sales Agentic Network', 'Legal Review Network'],
    },
  },
  {
    id: 'KP-002',
    name: 'GDPR Compliance Pack',
    description:
      'EU data residency requirements, consent obligations, and cross-border transfer restrictions enforced across all AI pipelines and data flows.',
    status: 'active',
    accessType: 'agentic-networks',
    owner: 'James Park',
    ownerInitials: 'JP',
    ownerGradient: 'linear-gradient(135deg,#6366f1,#a78bfa)',
    department: 'Compliance',
    scope: 'Global',
    factsCount: 11,
    usersCount: 6,
    agentsCount: 8,
    networksCount: 4,
    lastUpdated: '2026-04-10',
    linkedTruthPlane: 'Regulatory & Compliance',
    linkedTruthPlaneId: 'tp2',
    usage: 'high',
    isStale: false,
    tags: ['GDPR', 'data-residency', 'EU'],
    factIds: ['TF-0006', 'TF-0004'],
    // D4 — example of a 'both' intent pack: restricts the workflow to
    // GDPR-relevant facts AND extends with non-truth-plane policy notes.
    linkedWorkflowIds: ['n2'],
    intent: 'both',
    attachedAt: '2026-04-02',
    attachedBy: 'James Park',
    recentActivity: [
      { action: 'New fact added: EU AI Act restriction', by: 'James Park', at: '2026-04-10' },
      { action: 'Pack reviewed & re-certified', by: 'James Park', at: '2026-04-01' },
    ],
    accessDetails: {
      users: ['James Park', 'Emma Rodriguez', '+4 more'],
      agents: ['Data Governance Agent', 'Privacy Scanner', '+6 more'],
      networks: ['EU Compliance Network', 'AI Safety Network', 'Data Ops Network', 'Audit Network'],
    },
  },
  {
    id: 'KP-003',
    name: 'Sales Playbook Facts',
    description:
      'Pricing tiers, discount authority thresholds, ICP definitions, and deal qualification criteria used by the sales copilot.',
    status: 'active',
    accessType: 'agents',
    owner: 'Alex Rivera',
    ownerInitials: 'AR',
    ownerGradient: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    department: 'Sales',
    scope: 'SMB + Enterprise',
    factsCount: 18,
    usersCount: 12,
    agentsCount: 5,
    networksCount: 1,
    lastUpdated: '2026-04-08',
    linkedTruthPlane: 'Sales Intelligence',
    linkedTruthPlaneId: 'tp3',
    // Workflows in Agentic Studio that have this pack as their knowledge
    // constraint. Mirrors the production wiring where the workflow's
    // execution is scoped to facts in this pack.
    linkedWorkflowIds: ['n1'],
    intent: 'restrict',   // this pack acts as a guardrail for n1
    attachedAt: '2026-04-09',
    attachedBy: 'Alex Rivera',
    usage: 'medium',
    isStale: false,
    tags: ['pricing', 'sales', 'ICP'],
    // Sales-themed truth facts that match this pack's purpose.
    // Each is enriched with provenance in factEnrichments below.
    factIds: ['TF-0010', 'TF-0011', 'TF-0012'],
    recentActivity: [
      { action: 'Discount threshold updated', by: 'Alex Rivera', at: '2026-04-08' },
      { action: 'Q1 2026 facts synchronized', by: 'Alex Rivera', at: '2026-03-31' },
    ],
    accessDetails: {
      users: ['Alex Rivera', 'Michael Torres', '+10 more'],
      agents: ['Sales Copilot', 'Deal Qualifier', 'Pricing Bot', 'Renewal Agent', 'Pipeline Agent'],
      networks: ['Sales Agentic Network'],
    },
  },
  {
    id: 'KP-004',
    name: 'Vendor SLA Registry',
    description:
      'Response time guarantees, escalation paths, and penalty clauses across all active vendor agreements. Currently in draft pending final review.',
    status: 'draft',
    accessType: 'users',
    owner: 'Emma Rodriguez',
    ownerInitials: 'ER',
    ownerGradient: 'linear-gradient(135deg,#10b981,#059669)',
    department: 'Procurement',
    scope: 'Vendor Management',
    factsCount: 7,
    usersCount: 4,
    agentsCount: 0,
    networksCount: 0,
    lastUpdated: '2026-04-05',
    linkedTruthPlane: 'Vendor Governance',
    linkedTruthPlaneId: 'tp4',
    usage: 'low',
    isStale: false,
    tags: ['vendors', 'SLA', 'procurement'],
    factIds: ['TF-0005'],
    // D4 — example of an 'add' intent pack: enriches the Invoice & Collections
    // workflow (n4) with vendor-side SLA context that isn't otherwise visible.
    linkedWorkflowIds: ['n4'],
    intent: 'add',
    attachedAt: '2026-04-05',
    attachedBy: 'Emma Rodriguez',
    recentActivity: [
      { action: 'Draft created from Vendor Governance plane', by: 'Emma Rodriguez', at: '2026-04-05' },
    ],
    accessDetails: {
      users: ['Emma Rodriguez', 'David Kim', 'Lisa Anderson', 'James Park'],
      agents: [],
      networks: [],
    },
  },
  {
    id: 'KP-005',
    name: 'AI Governance Baseline',
    description:
      'Foundational rules for AI model use, output validation requirements, hallucination thresholds, and mandatory human-in-the-loop triggers.',
    status: 'active',
    accessType: 'agentic-networks',
    owner: 'David Kim',
    ownerInitials: 'DK',
    ownerGradient: 'linear-gradient(135deg,#ec4899,#a855f7)',
    department: 'Technology',
    scope: 'All AI Systems',
    factsCount: 32,
    usersCount: 9,
    agentsCount: 14,
    networksCount: 7,
    lastUpdated: '2026-03-28',
    linkedTruthPlane: 'AI Systems Governance',
    linkedTruthPlaneId: 'tp5',
    usage: 'high',
    isStale: true,
    tags: ['AI', 'governance', 'baseline', 'safety'],
    factIds: ['TF-0001', 'TF-0002', 'TF-0003', 'TF-0004', 'TF-0005', 'TF-0006'],
    recentActivity: [
      { action: 'Pack flagged as stale — no update in 18 days', by: 'System', at: '2026-04-14' },
      { action: 'Network access expanded', by: 'David Kim', at: '2026-03-28' },
    ],
    accessDetails: {
      users: ['David Kim', 'Sarah Chen', '+7 more'],
      agents: ['Safety Monitor', 'Output Validator', '+12 more'],
      networks: ['AI Safety Network', 'Audit Network', '+5 more'],
    },
  },
  {
    id: 'KP-006',
    name: 'Finance Policy Digest',
    description:
      'Invoice terms, approval thresholds, budget authority limits, and reimbursement rules. Archived after policy consolidation in Q1 2026.',
    status: 'archived',
    accessType: 'mixed',
    owner: 'Michael Torres',
    ownerInitials: 'MT',
    ownerGradient: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
    department: 'Finance',
    scope: 'Internal',
    factsCount: 15,
    usersCount: 21,
    agentsCount: 2,
    networksCount: 0,
    lastUpdated: '2026-01-15',
    linkedTruthPlane: null,
    linkedTruthPlaneId: null,
    usage: 'low',
    isStale: true,
    tags: ['finance', 'invoicing', 'budget'],
    factIds: ['TF-0002', 'TF-0004'],
    recentActivity: [
      { action: 'Pack archived — superseded by Finance v2', by: 'Michael Torres', at: '2026-01-15' },
    ],
    accessDetails: {
      users: ['Michael Torres', '+20 more'],
      agents: ['Invoice Bot', 'Budget Agent'],
      networks: [],
    },
  },
  {
    id: 'KP-007',
    name: 'Partner Onboarding Terms',
    description:
      'Eligibility criteria, certification requirements, tier definitions, and exclusivity terms for new channel partner onboarding.',
    status: 'draft',
    accessType: 'users',
    owner: 'Lisa Anderson',
    ownerInitials: 'LA',
    ownerGradient: 'linear-gradient(135deg,#14b8a6,#06b6d4)',
    department: 'Partnerships',
    scope: 'Channel Partners',
    factsCount: 0,
    usersCount: 0,
    agentsCount: 0,
    networksCount: 0,
    lastUpdated: '2026-04-14',
    linkedTruthPlane: null,
    linkedTruthPlaneId: null,
    usage: 'low',
    isStale: false,
    tags: ['partners', 'onboarding', 'eligibility'],
    factIds: [],
    recentActivity: [
      { action: 'Draft created', by: 'Lisa Anderson', at: '2026-04-14' },
    ],
    accessDetails: {
      users: [],
      agents: [],
      networks: [],
    },
  },
]

// ────────────────────────────────────────────────────────────────────────────
// WORKFLOW ↔ PACK LOOKUP
// In production this resolves through the workflow service; here it scans
// truthPacks for any pack whose linkedWorkflowIds include the given id.
// Returns an array (a workflow can have multiple constraints attached).
// ────────────────────────────────────────────────────────────────────────────
export function getPacksForWorkflow(workflowId) {
  if (!workflowId) return []
  return truthPacks.filter(p => Array.isArray(p.linkedWorkflowIds) && p.linkedWorkflowIds.includes(workflowId))
}

// ────────────────────────────────────────────────────────────────────────────
// PICKABLE CONTENT FROM THE 3 GOVERNANCE PLANES
// Used by the Knowledge Pack composition step. Each plane returns items that
// can be selected (multi-select) into the pack.
// ────────────────────────────────────────────────────────────────────────────

// ── Truth Plane: governed, approved facts ──
// accessLevel set at attestation time. See ACCESS_LEVELS above.
export const availableTruthFacts = [
  { id: 'TF-0001', plane: 'truth', planeName: 'Enterprise Compliance',   title: 'Enterprise SLA — 99.9% uptime guarantee',           type: 'policy',     status: 'verified', updated: '2026-04-12', confidence: 96, owner: 'Sarah Chen',     tags: ['SLA','enterprise'],         accessLevel: 'public'     },
  { id: 'TF-0002', plane: 'truth', planeName: 'Enterprise Compliance',   title: 'Standard payment terms — Net 30',                   type: 'policy',     status: 'verified', updated: '2026-04-08', confidence: 98, owner: 'Sarah Chen',     tags: ['payments'],                 accessLevel: 'workspace'  },
  { id: 'TF-0003', plane: 'truth', planeName: 'Enterprise Compliance',   title: 'Refund window — 14 days from delivery',             type: 'policy',     status: 'verified', updated: '2026-03-30', confidence: 95, owner: 'Sarah Chen',     tags: ['refunds'],                  accessLevel: 'public'     },
  { id: 'TF-0004', plane: 'truth', planeName: 'Enterprise Compliance',   title: 'Volume discount tiers — 10/20/30%',                 type: 'pricing',    status: 'verified', updated: '2026-04-15', confidence: 94, owner: 'Sarah Chen',     tags: ['pricing','discounts'],      accessLevel: 'restricted' },
  { id: 'TF-0005', plane: 'truth', planeName: 'Enterprise Compliance',   title: 'Termination clause — 60-day notice required',       type: 'legal',      status: 'verified', updated: '2026-03-22', confidence: 97, owner: 'Sarah Chen',     tags: ['legal'],                    accessLevel: 'restricted' },
  { id: 'TF-0006', plane: 'truth', planeName: 'Regulatory & Compliance', title: 'GDPR — Right to erasure (Article 17)',              type: 'regulation', status: 'verified', updated: '2026-04-10', confidence: 99, owner: 'James Park',     tags: ['GDPR','privacy'],           accessLevel: 'pii'        },
  { id: 'TF-0007', plane: 'truth', planeName: 'Regulatory & Compliance', title: 'GDPR — Data residency in EU',                       type: 'regulation', status: 'verified', updated: '2026-04-10', confidence: 99, owner: 'James Park',     tags: ['GDPR','residency'],         accessLevel: 'workspace'  },
  { id: 'TF-0008', plane: 'truth', planeName: 'Regulatory & Compliance', title: 'Cross-border transfer — adequacy decision needed',  type: 'regulation', status: 'verified', updated: '2026-04-02', confidence: 98, owner: 'James Park',     tags: ['GDPR','transfers'],         accessLevel: 'workspace'  },
  { id: 'TF-0009', plane: 'truth', planeName: 'Regulatory & Compliance', title: 'Consent — explicit opt-in for marketing',           type: 'regulation', status: 'verified', updated: '2026-03-28', confidence: 96, owner: 'James Park',     tags: ['consent'],                  accessLevel: 'public'     },
  { id: 'TF-0010', plane: 'truth', planeName: 'Sales Knowledge',         title: 'ICP — Mid-market SaaS, 50–500 employees',           type: 'guideline',  status: 'verified', updated: '2026-04-09', confidence: 89, owner: 'Alex Rivera',    tags: ['ICP','sales'],              accessLevel: 'public'     },
  { id: 'TF-0011', plane: 'truth', planeName: 'Sales Knowledge',         title: 'BANT qualification minimum — 3 of 4 criteria',      type: 'guideline',  status: 'verified', updated: '2026-04-01', confidence: 85, owner: 'Alex Rivera',    tags: ['qualification'],            accessLevel: 'public'     },
  { id: 'TF-0012', plane: 'truth', planeName: 'Sales Knowledge',         title: 'Discount authority — VP Sales for >25%',            type: 'policy',     status: 'verified', updated: '2026-03-18', confidence: 94, owner: 'Alex Rivera',    tags: ['discounts','authority'],    accessLevel: 'restricted' },
  { id: 'TF-0013', plane: 'truth', planeName: 'Customer Service',        title: 'First response SLA — 1 hour for Premium',           type: 'policy',     status: 'verified', updated: '2026-04-14', confidence: 98, owner: 'Maria Garcia',   tags: ['support','SLA'],            accessLevel: 'public'     },
  { id: 'TF-0014', plane: 'truth', planeName: 'Customer Service',        title: 'Escalation path — Tier 1 → Tier 2 → Manager',       type: 'process',    status: 'verified', updated: '2026-04-05', confidence: 96, owner: 'Maria Garcia',   tags: ['escalation'],               accessLevel: 'public'     },
  { id: 'TF-0015', plane: 'truth', planeName: 'Customer Service',        title: 'Refund authority — Tier 2 up to $500',              type: 'policy',     status: 'verified', updated: '2026-03-25', confidence: 95, owner: 'Maria Garcia',   tags: ['refunds','authority'],      accessLevel: 'workspace'  },
  { id: 'TF-0016', plane: 'truth', planeName: 'Customer Service',        title: 'Service hours — 24/7 for Enterprise tier',          type: 'policy',     status: 'verified', updated: '2026-04-06', confidence: 99, owner: 'Maria Garcia',   tags: ['hours'],                    accessLevel: 'public'     },
  { id: 'TF-0017', plane: 'truth', planeName: 'Onboarding Standards',    title: 'Time-to-value target — 30 days from signup',        type: 'guideline',  status: 'verified', updated: '2026-04-11', confidence: 91, owner: 'David Kim',      tags: ['onboarding','TTV'],         accessLevel: 'public'     },
  { id: 'TF-0018', plane: 'truth', planeName: 'Onboarding Standards',    title: 'Welcome email — within 5 minutes of signup',        type: 'process',    status: 'verified', updated: '2026-04-04', confidence: 98, owner: 'David Kim',      tags: ['onboarding','email'],       accessLevel: 'public'     },
  { id: 'TF-0019', plane: 'truth', planeName: 'Onboarding Standards',    title: 'Check-in cadence — day 7, 14, 30',                  type: 'process',    status: 'verified', updated: '2026-03-29', confidence: 93, owner: 'David Kim',      tags: ['onboarding','cadence'],     accessLevel: 'public'     },
  { id: 'TF-0020', plane: 'truth', planeName: 'Onboarding Standards',    title: 'Activation milestones — 5 events to "activated"',   type: 'guideline',  status: 'verified', updated: '2026-04-13', confidence: 90, owner: 'David Kim',      tags: ['onboarding','activation'],  accessLevel: 'public'     },
  { id: 'TF-0021', plane: 'truth', planeName: 'Renewal Strategy',        title: 'Renewal window opens — 90 days before term end',    type: 'process',    status: 'verified', updated: '2026-04-07', confidence: 97, owner: 'Lisa Anderson',  tags: ['renewals'],                 accessLevel: 'public'     },
  { id: 'TF-0022', plane: 'truth', planeName: 'Renewal Strategy',        title: 'Auto-renewal default — opt-out required',           type: 'policy',     status: 'verified', updated: '2026-03-15', confidence: 99, owner: 'Lisa Anderson',  tags: ['renewals','auto'],          accessLevel: 'public'     },
  { id: 'TF-0023', plane: 'truth', planeName: 'Renewal Strategy',        title: 'Churn risk score — 0–100 from health signals',      type: 'guideline',  status: 'verified', updated: '2026-04-08', confidence: 88, owner: 'Lisa Anderson',  tags: ['renewals','churn'],         accessLevel: 'workspace'  },
  { id: 'TF-0024', plane: 'truth', planeName: 'Brand Voice',             title: 'Tone — friendly, concise, confident',               type: 'guideline',  status: 'verified', updated: '2026-03-12', confidence: 92, owner: 'Emma Wilson',    tags: ['brand','voice'],            accessLevel: 'public'     },
  { id: 'TF-0025', plane: 'truth', planeName: 'Brand Voice',             title: 'Avoid jargon — explain acronyms first use',         type: 'guideline',  status: 'verified', updated: '2026-03-12', confidence: 93, owner: 'Emma Wilson',    tags: ['brand','clarity'],          accessLevel: 'public'     },
]

// ── Sandbox Plane: claims under validation (not yet promoted to truth) ──
// accessLevel set at attestation time. See ACCESS_LEVELS above.
export const availableSandboxClaims = [
  { id: 'SC-0001', plane: 'sandbox', planeName: 'Q1 Sales Playbook Validation',     title: 'New consultative-sell motion lifts win rate by ~12%',     status: 'in-validation', evidence: 8,  confidence: 72, updated: '2026-04-14', owner: 'Alex Rivera',   tags: ['sales','win-rate'],   accessLevel: 'workspace'  },
  { id: 'SC-0002', plane: 'sandbox', planeName: 'Q1 Sales Playbook Validation',     title: 'Discovery questions doubled in length improve close',     status: 'in-validation', evidence: 5,  confidence: 64, updated: '2026-04-12', owner: 'Alex Rivera',   tags: ['sales','discovery'],  accessLevel: 'public'     },
  { id: 'SC-0003', plane: 'sandbox', planeName: 'Q1 Sales Playbook Validation',     title: 'Mid-market deals close 22% faster with CSM intro',        status: 'verifying',     evidence: 11, confidence: 79, updated: '2026-04-10', owner: 'Alex Rivera',   tags: ['sales','velocity'],   accessLevel: 'workspace'  },
  { id: 'SC-0004', plane: 'sandbox', planeName: 'Product Messaging Iteration',      title: 'Outcome-led headlines outperform feature-led 3:1',        status: 'verifying',     evidence: 14, confidence: 84, updated: '2026-04-09', owner: 'Emma Wilson',   tags: ['marketing'],          accessLevel: 'public'     },
  { id: 'SC-0005', plane: 'sandbox', planeName: 'Product Messaging Iteration',      title: 'Pricing comparator on landing reduces bounce 18%',        status: 'in-validation', evidence: 6,  confidence: 68, updated: '2026-04-08', owner: 'Emma Wilson',   tags: ['marketing','pricing'],accessLevel: 'restricted' },
  { id: 'SC-0006', plane: 'sandbox', planeName: 'Customer Onboarding Optimization', title: 'Day-3 video walkthrough lifts activation 28%',            status: 'verified',      evidence: 22, confidence: 91, updated: '2026-04-13', owner: 'David Kim',     tags: ['onboarding','video'], accessLevel: 'public'     },
  { id: 'SC-0007', plane: 'sandbox', planeName: 'Customer Onboarding Optimization', title: 'In-app guided checklist reduces TTV from 30d → 18d',      status: 'verified',      evidence: 31, confidence: 93, updated: '2026-04-11', owner: 'David Kim',     tags: ['onboarding','TTV'],   accessLevel: 'public'     },
  { id: 'SC-0008', plane: 'sandbox', planeName: 'Customer Onboarding Optimization', title: 'CSM kickoff call before week 2 reduces churn 14%',        status: 'verifying',     evidence: 17, confidence: 82, updated: '2026-04-07', owner: 'David Kim',     tags: ['onboarding','CSM'],   accessLevel: 'workspace'  },
  { id: 'SC-0009', plane: 'sandbox', planeName: 'Competitive Intelligence Q4',      title: 'Competitor X loses on data residency in EU deals',        status: 'verified',      evidence: 19, confidence: 89, updated: '2026-04-06', owner: 'Liam O\'Brien', tags: ['competitive','EU'],   accessLevel: 'restricted' },
  { id: 'SC-0010', plane: 'sandbox', planeName: 'Competitive Intelligence Q4',      title: 'Competitor Y has 30-day rolling pricing flexibility',     status: 'in-validation', evidence: 4,  confidence: 61, updated: '2026-04-04', owner: 'Liam O\'Brien', tags: ['competitive'],        accessLevel: 'restricted' },
  { id: 'SC-0011', plane: 'sandbox', planeName: 'Compliance Policy Update',         title: 'Draft — Updated retention policy for EU users (90 days)', status: 'in-validation', evidence: 3,  confidence: 58, updated: '2026-04-05', owner: 'James Park',    tags: ['compliance','EU'],    accessLevel: 'pii'        },
  { id: 'SC-0012', plane: 'sandbox', planeName: 'Compliance Policy Update',         title: 'Draft — Cookie consent flow simplified to 1 click',       status: 'verifying',     evidence: 9,  confidence: 76, updated: '2026-04-03', owner: 'James Park',    tags: ['compliance','UX'],    accessLevel: 'public'     },
  { id: 'SC-0013', plane: 'sandbox', planeName: 'Renewal Optimization Study',       title: 'Renewal CTA at day 60 outperforms day 90 by 19%',         status: 'verifying',     evidence: 12, confidence: 81, updated: '2026-04-02', owner: 'Lisa Anderson', tags: ['renewals'],           accessLevel: 'public'     },
  { id: 'SC-0014', plane: 'sandbox', planeName: 'Renewal Optimization Study',       title: 'NBA-driven renewal sequence increases close 24%',         status: 'verified',      evidence: 26, confidence: 92, updated: '2026-04-01', owner: 'Lisa Anderson', tags: ['renewals','NBA'],     accessLevel: 'workspace'  },
  { id: 'SC-0015', plane: 'sandbox', planeName: 'Support Tone Experiment',          title: 'First-person plural ("we\'ll fix") improves CSAT 7%',     status: 'verifying',     evidence: 10, confidence: 73, updated: '2026-03-31', owner: 'Maria Garcia',  tags: ['support','tone'],     accessLevel: 'public'     },
]

// ── Sources Plane: raw documents and references ──
// accessLevel set at attestation time. See ACCESS_LEVELS above.
export const availableSourceDocs = [
  { id: 'SRC-0001', plane: 'sources', planeName: 'Legal & Contracts Drive',  title: 'Master Services Agreement — v3.2.pdf',     type: 'pdf',  size: '842 KB', updated: '2026-04-12', owner: 'Sarah Chen',     tags: ['contracts','MSA'],   accessLevel: 'restricted' },
  { id: 'SRC-0002', plane: 'sources', planeName: 'Legal & Contracts Drive',  title: 'Data Processing Addendum — EU.pdf',        type: 'pdf',  size: '512 KB', updated: '2026-04-08', owner: 'Sarah Chen',     tags: ['DPA','EU'],          accessLevel: 'pii'        },
  { id: 'SRC-0003', plane: 'sources', planeName: 'Legal & Contracts Drive',  title: 'Standard NDA — mutual.docx',                type: 'docx', size: '145 KB', updated: '2026-03-20', owner: 'Sarah Chen',     tags: ['NDA'],               accessLevel: 'restricted' },
  { id: 'SRC-0004', plane: 'sources', planeName: 'Sales Enablement Drive',   title: 'Q4 Sales Playbook — full deck.pptx',       type: 'pptx', size: '4.2 MB', updated: '2026-04-13', owner: 'Alex Rivera',    tags: ['sales','playbook'],  accessLevel: 'workspace'  },
  { id: 'SRC-0005', plane: 'sources', planeName: 'Sales Enablement Drive',   title: 'Battle cards — top 5 competitors.pdf',     type: 'pdf',  size: '1.1 MB', updated: '2026-04-09', owner: 'Liam O\'Brien', tags: ['competitive'],       accessLevel: 'restricted' },
  { id: 'SRC-0006', plane: 'sources', planeName: 'Sales Enablement Drive',   title: 'Discovery script — enterprise tier.md',    type: 'md',   size: '24 KB',  updated: '2026-04-04', owner: 'Alex Rivera',    tags: ['sales','script'],    accessLevel: 'public'     },
  { id: 'SRC-0007', plane: 'sources', planeName: 'Compliance Drive',         title: 'GDPR audit report — Q1 2026.pdf',          type: 'pdf',  size: '2.8 MB', updated: '2026-04-10', owner: 'James Park',     tags: ['GDPR','audit'],      accessLevel: 'pii'        },
  { id: 'SRC-0008', plane: 'sources', planeName: 'Compliance Drive',         title: 'SOC2 Type II report — 2026.pdf',           type: 'pdf',  size: '3.5 MB', updated: '2026-03-15', owner: 'James Park',     tags: ['SOC2','audit'],      accessLevel: 'public'     },
  { id: 'SRC-0009', plane: 'sources', planeName: 'Compliance Drive',         title: 'ISO 27001 controls matrix.xlsx',            type: 'xlsx', size: '680 KB', updated: '2026-04-06', owner: 'James Park',     tags: ['ISO','security'],    accessLevel: 'workspace'  },
  { id: 'SRC-0010', plane: 'sources', planeName: 'Customer Success Drive',   title: 'Onboarding template — enterprise.docx',    type: 'docx', size: '210 KB', updated: '2026-04-11', owner: 'David Kim',      tags: ['onboarding'],        accessLevel: 'public'     },
  { id: 'SRC-0011', plane: 'sources', planeName: 'Customer Success Drive',   title: 'Health score formula — v2.md',              type: 'md',   size: '18 KB',  updated: '2026-04-05', owner: 'Lisa Anderson',  tags: ['health','renewals'], accessLevel: 'workspace'  },
  { id: 'SRC-0012', plane: 'sources', planeName: 'Customer Success Drive',   title: 'Quarterly business review template.pptx',  type: 'pptx', size: '1.8 MB', updated: '2026-03-28', owner: 'David Kim',      tags: ['QBR'],               accessLevel: 'public'     },
  { id: 'SRC-0013', plane: 'sources', planeName: 'Brand & Marketing Drive',  title: 'Brand voice guidelines — 2026.pdf',        type: 'pdf',  size: '892 KB', updated: '2026-03-12', owner: 'Emma Wilson',    tags: ['brand'],             accessLevel: 'public'     },
  { id: 'SRC-0014', plane: 'sources', planeName: 'Brand & Marketing Drive',  title: 'Email templates — full library.zip',       type: 'zip',  size: '12 MB',  updated: '2026-04-07', owner: 'Emma Wilson',    tags: ['email','templates'], accessLevel: 'public'     },
  { id: 'SRC-0015', plane: 'sources', planeName: 'Brand & Marketing Drive',  title: 'Style guide — visual identity.pdf',        type: 'pdf',  size: '5.4 MB', updated: '2026-03-22', owner: 'Emma Wilson',    tags: ['brand','design'],    accessLevel: 'public'     },
]

// ────────────────────────────────────────────────────────────────────────────
// PACK TEMPLATES
// Pre-defined Knowledge Pack scaffolds for the entry modal.
// ────────────────────────────────────────────────────────────────────────────

export const packTemplates = [
  {
    id: 'tpl-sales-discovery',
    name: 'Sales Discovery',
    description: 'ICP, qualification, discovery scripts, and battle cards for SDRs and AEs running outbound and inbound discovery.',
    iconBg: 'linear-gradient(135deg,#155DFC,#00C2C2)',
    department: 'Sales',
    seedTruth:   ['TF-0010','TF-0011','TF-0012'],
    seedSandbox: ['SC-0001','SC-0002'],
    seedSources: ['SRC-0004','SRC-0005','SRC-0006'],
    toggles:     { truth: true, sandbox: false, sources: true },
  },
  {
    id: 'tpl-support-resolution',
    name: 'Support Resolution',
    description: 'SLA commitments, escalation paths, refund authority, and tone guidance for tier-1 and tier-2 support agents.',
    iconBg: 'linear-gradient(135deg,#4ade80,#22d3ee)',
    department: 'Customer Service',
    seedTruth:   ['TF-0013','TF-0014','TF-0015','TF-0016','TF-0024','TF-0025'],
    seedSandbox: ['SC-0015'],
    seedSources: [],
    toggles:     { truth: true, sandbox: false, sources: false },
  },
  {
    id: 'tpl-gdpr-compliance',
    name: 'GDPR Compliance',
    description: 'EU data residency, consent obligations, retention policy, and audit references for compliance-aware AI pipelines.',
    iconBg: 'linear-gradient(135deg,#a78bfa,#ec4899)',
    department: 'Compliance',
    seedTruth:   ['TF-0006','TF-0007','TF-0008','TF-0009'],
    seedSandbox: ['SC-0011','SC-0012'],
    seedSources: ['SRC-0007','SRC-0002'],
    toggles:     { truth: true, sandbox: false, sources: true },
  },
  {
    id: 'tpl-customer-onboarding',
    name: 'Customer Onboarding',
    description: 'Time-to-value targets, activation milestones, check-in cadence, and onboarding scripts for new enterprise accounts.',
    iconBg: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    department: 'Customer Success',
    seedTruth:   ['TF-0017','TF-0018','TF-0019','TF-0020'],
    seedSandbox: ['SC-0006','SC-0007','SC-0008'],
    seedSources: ['SRC-0010','SRC-0011'],
    toggles:     { truth: true, sandbox: true, sources: true },
  },
  {
    id: 'tpl-empty',
    name: 'Empty Pack',
    description: 'Start with a blank slate and compose the pack from scratch. No items pre-selected.',
    iconBg: 'linear-gradient(135deg,#475569,#1e293b)',
    department: '—',
    seedTruth:   [],
    seedSandbox: [],
    seedSources: [],
    toggles:     { truth: true, sandbox: false, sources: true },
  },
]

// ────────────────────────────────────────────────────────────────────────────
// ACCESS DIMENSIONS — for the Access step picker
// ────────────────────────────────────────────────────────────────────────────

export const accessDepartments = [
  'Sales','Customer Success','Support','Marketing','Engineering','Product','Legal','Compliance','Finance','HR','Operations',
]

export const accessRoles = [
  'Admin','Workspace Owner','Editor','Reviewer','Viewer','Knowledge Curator','Compliance Officer','CSM','AE','SDR','Support Agent','Engineer',
]

export const accessGroups = [
  'Enterprise GTM','SMB GTM','Customer Health','Renewal Squad','Incident Response','Risk & Audit','Brand Council',
]

export const accessUsers = [
  { id: 'u-001', name: 'Sarah Chen',     initials: 'SC', dept: 'Legal'              },
  { id: 'u-002', name: 'Michael Torres', initials: 'MT', dept: 'Sales'              },
  { id: 'u-003', name: 'Emily Rodriguez',initials: 'ER', dept: 'Compliance'         },
  { id: 'u-004', name: 'David Park',     initials: 'DP', dept: 'Operations'         },
  { id: 'u-005', name: 'Alex Rivera',    initials: 'AR', dept: 'Sales'              },
  { id: 'u-006', name: 'James Park',     initials: 'JP', dept: 'Compliance'         },
  { id: 'u-007', name: 'Maria Garcia',   initials: 'MG', dept: 'Support'            },
  { id: 'u-008', name: 'David Kim',      initials: 'DK', dept: 'Customer Success'   },
  { id: 'u-009', name: 'Emma Wilson',    initials: 'EW', dept: 'Marketing'          },
  { id: 'u-010', name: 'Lisa Anderson',  initials: 'LA', dept: 'Customer Success'   },
]

// ────────────────────────────────────────────────────────────────────────────
// TENANTS — for the Scope picker when scope === 'workspace'
// ────────────────────────────────────────────────────────────────────────────
export const availableTenants = [
  { id: 'tn-acme',     name: 'Acme Corp',           region: 'North America' },
  { id: 'tn-globex',   name: 'Globex Industries',   region: 'Europe' },
  { id: 'tn-initech',  name: 'Initech',             region: 'North America' },
  { id: 'tn-umbrella', name: 'Umbrella Group',      region: 'EMEA' },
  { id: 'tn-soylent',  name: 'Soylent Industries',  region: 'APAC' },
  { id: 'tn-cyberdyne',name: 'Cyberdyne Systems',   region: 'North America' },
]

// ────────────────────────────────────────────────────────────────────────────
// USER DRAFTS — for the "Continue working on" section in the entry page
// ────────────────────────────────────────────────────────────────────────────
export const userDrafts = [
  {
    id: 'draft-001',
    name: 'Sales Discovery v2',
    description: 'Refined version of the discovery pack with new ICP qualification facts.',
    completion: 60,
    savedAgo: '2 hours ago',
    department: 'Sales',
    itemsCount: 6,
  },
  {
    id: 'draft-002',
    name: 'GDPR Compliance Pack — DRAFT',
    description: 'EU data residency requirements pack — pending VP review of scope.',
    completion: 30,
    savedAgo: 'Yesterday',
    department: 'Compliance',
    itemsCount: 3,
  },
  {
    id: 'draft-003',
    name: 'Customer Health Signals',
    description: 'Composing churn risk signals from sandbox claims + truth facts.',
    completion: 80,
    savedAgo: '4 days ago',
    department: 'Customer Success',
    itemsCount: 11,
  },
  {
    id: 'draft-004',
    name: 'Renewal Playbook',
    description: 'Scripts and trigger criteria for at-risk renewals.',
    completion: 45,
    savedAgo: '5 days ago',
    department: 'Customer Success',
    itemsCount: 8,
  },
  {
    id: 'draft-005',
    name: 'Pricing Authority Matrix',
    description: 'Discount approval thresholds by role and deal size.',
    completion: 70,
    savedAgo: '1 week ago',
    department: 'Sales',
    itemsCount: 5,
  },
  {
    id: 'draft-006',
    name: 'Incident Response · P0/P1',
    description: 'Escalation paths and post-mortem template references.',
    completion: 25,
    savedAgo: '1 week ago',
    department: 'Operations',
    itemsCount: 4,
  },
  {
    id: 'draft-007',
    name: 'Vendor Risk Assessment',
    description: 'Subprocessor list and risk scoring rubric — pending Legal sign-off.',
    completion: 55,
    savedAgo: '2 weeks ago',
    department: 'Legal',
    itemsCount: 9,
  },
  {
    id: 'draft-008',
    name: 'Onboarding Day-1 Pack',
    description: 'Checklist and 30-60-90 plan for new enterprise customers.',
    completion: 90,
    savedAgo: '2 weeks ago',
    department: 'Customer Success',
    itemsCount: 14,
  },
]

// ────────────────────────────────────────────────────────────────────────────
// FACT ENRICHMENTS
// ────────────────────────────────────────────────────────────────────────────
// Truth Plane rows in `availableTruthFacts` are lean (id, title, status,
// confidence, owner). For the Workflow → Knowledge inspection view we need
// "full context of where this information came from", so we attach a richer
// enrichment per fact id: the verbatim statement, the source documents that
// back it (with section anchors), the sandbox claim it was promoted from
// (if any), the attestation chain (who vouches for it), and the justification
// for why it lives inside a specific pack.
//
// Keyed by fact id. Use `getEnrichedFact(id)` to merge base + enrichment.
// ────────────────────────────────────────────────────────────────────────────
export const factEnrichments = {
  'TF-0001': {
    statement:
      'Enterprise tier customers are guaranteed 99.9% monthly uptime measured at the API gateway. Service credits apply when monthly uptime falls below 99.9% (one day of service credited), below 99% (two days), or below 95% (five days). Scheduled maintenance windows announced 14 days in advance do not count against the SLA.',
    citationCount: 82,
    sourceDocuments: [
      { id: 'SRC-0001', section: 'Section 5 — Service Levels',       role: 'Authoritative clause' },
      { id: 'SRC-0008', section: 'Page 41 — Availability metrics',    role: 'Independent verification' },
    ],
    promotedFromClaim: null,
    promotionDate: null,
    attestation: {
      attestor: 'Sarah Chen',
      attestorRole: 'Legal Counsel',
      attestedAt: '2026-04-12',
      nextReview: '2026-10-12',
      cadence: 'Semi-annual',
    },
    justification:
      'Customer-facing workflows must honor this SLA when generating credit calculations or escalating support tickets. Misreporting uptime is a contractual breach.',
  },
  'TF-0002': {
    statement:
      'Standard payment terms are Net 30 from invoice date. Late payments accrue interest at 1.5% per month (18% APR), compounded monthly. Custom terms (Net 60 or Net 90) require Finance approval per deal and supersede this default.',
    citationCount: 116,
    sourceDocuments: [
      { id: 'SRC-0001', section: 'Section 6.2 — Payment',  role: 'Default term' },
    ],
    promotedFromClaim: null,
    promotionDate: null,
    attestation: {
      attestor: 'Sarah Chen',
      attestorRole: 'Legal Counsel',
      attestedAt: '2026-04-08',
      nextReview: '2026-10-08',
      cadence: 'Semi-annual',
    },
    justification:
      'AR forecasting, dunning workflows, and revenue recognition all depend on this assumption. Any deal with non-default terms must surface it explicitly.',
  },
  'TF-0003': {
    statement:
      'Customers may request a full refund within 14 calendar days of service delivery. After 14 days, refunds are prorated against the remaining unused service period. Refund requests outside the standard window require Director-level approval.',
    citationCount: 31,
    sourceDocuments: [
      { id: 'SRC-0001', section: 'Section 8 — Refunds',  role: 'Authoritative policy' },
    ],
    promotedFromClaim: null,
    promotionDate: null,
    attestation: {
      attestor: 'Sarah Chen',
      attestorRole: 'Legal Counsel',
      attestedAt: '2026-03-30',
      nextReview: '2026-09-30',
      cadence: 'Semi-annual',
    },
    justification:
      'Customer Success agents must apply the window correctly when processing churn requests. Mishandling refunds is a top customer complaint trigger.',
  },
  'TF-0004': {
    statement:
      'Volume-based discounts apply by seat count: 10% for 50–99 seats, 20% for 100–249 seats, 30% for 250+ seats. Tiers stack with annual prepay (additional 10% off). Discounts above the volume tier ceiling require VP Sales approval and override standard authority limits.',
    citationCount: 94,
    sourceDocuments: [
      { id: 'SRC-0004', section: 'Slide 23–25 — Discount Authority Matrix', role: 'Authoritative table' },
      { id: 'SRC-0001', section: 'Section 7 — Pricing',                     role: 'Contract baseline' },
    ],
    promotedFromClaim: null,
    promotionDate: null,
    attestation: {
      attestor: 'Alex Rivera',
      attestorRole: 'VP Sales',
      attestedAt: '2026-04-15',
      nextReview: '2026-07-15',
      cadence: 'Quarterly — re-confirmed each pricing cycle',
    },
    justification:
      'Pricing copilots and quote-generation flows must respect the tier ceiling. Auto-quoting above it without escalation is a margin and authority violation.',
  },
  'TF-0005': {
    statement:
      'Either party may terminate the agreement with 60 calendar days written notice. No early-termination penalty applies after the initial 12-month commitment period. Terminations within the commitment period incur the prorated remainder of the annual fee.',
    citationCount: 47,
    sourceDocuments: [
      { id: 'SRC-0001', section: 'Section 12 — Termination', role: 'Authoritative clause' },
      { id: 'SRC-0003', section: 'NDA cross-reference',       role: 'Confidentiality survival' },
    ],
    promotedFromClaim: null,
    promotionDate: null,
    attestation: {
      attestor: 'Sarah Chen',
      attestorRole: 'Legal Counsel',
      attestedAt: '2026-03-22',
      nextReview: '2026-09-22',
      cadence: 'Semi-annual',
    },
    justification:
      'Account managers and CSMs use this when negotiating churn risk — wrong notice period misrepresents customer obligations and the company\'s exposure.',
  },
  'TF-0006': {
    statement:
      'Under GDPR Article 17, EU data subjects may request deletion of their personal data ("right to erasure"). We must complete deletion within 30 calendar days unless a specific exemption applies (legal obligation to retain, public interest, exercise of legal claims, or archiving in the public interest).',
    citationCount: 58,
    sourceDocuments: [
      { id: 'SRC-0002', section: 'DPA Section 4 — Subject Rights',  role: 'Contractual obligation' },
      { id: 'SRC-0007', section: 'Page 18 — Article 17 controls',    role: 'Audit verification' },
    ],
    promotedFromClaim: null,
    promotionDate: null,
    attestation: {
      attestor: 'James Park',
      attestorRole: 'Privacy Officer',
      attestedAt: '2026-04-10',
      nextReview: '2026-07-10',
      cadence: 'Quarterly',
    },
    justification:
      'EU-region workflows touching customer data must surface this gate. Non-compliance fines reach 4% of global annual revenue — the single highest financial-exposure rule in the truth plane.',
  },
  'TF-0010': {
    statement:
      'Our Ideal Customer Profile is mid-market SaaS companies between 50 and 500 employees, with annual recurring revenue between $5M and $50M, headquartered in North America or Western Europe, and using at least one of our integration partners (Salesforce, HubSpot, or Snowflake).',
    citationCount: 47,   // times referenced by agents in the last 30d
    sourceDocuments: [
      { id: 'SRC-0004', section: 'Slides 4–7',       role: 'Direct quote'  },
      { id: 'SRC-0005', section: 'Pages 2–3',        role: 'Cross-reference' },
      { id: 'SRC-0006', section: 'Section: ICP framing', role: 'Alignment' },
    ],
    promotedFromClaim: 'SC-0001',
    promotionDate: '2026-03-15',
    attestation: {
      attestor: 'Alex Rivera',
      attestorRole: 'VP Sales',
      attestedAt: '2026-03-20',
      nextReview: '2026-09-20',
      cadence: 'Quarterly',
    },
    justification:
      'Filters out leads outside our serviceable range before the renewal copilot enters offer generation — prevents wasted approval cycles on out-of-ICP accounts.',
  },
  'TF-0011': {
    statement:
      'A lead is sales-qualified when at least 3 of the 4 BANT criteria are confirmed during discovery: Budget (range confirmed), Authority (decision-maker identified or champion path mapped), Need (urgent business problem articulated), and Timeline (target close within 90 days).',
    citationCount: 38,
    sourceDocuments: [
      { id: 'SRC-0004', section: 'Slides 12–18',           role: 'Framework definition' },
      { id: 'SRC-0006', section: 'Discovery Q&A flow',     role: 'Scripted questions per criterion' },
    ],
    promotedFromClaim: null,   // Direct from sales policy, not via sandbox validation
    promotionDate: null,
    attestation: {
      attestor: 'Alex Rivera',
      attestorRole: 'VP Sales',
      attestedAt: '2026-04-01',
      nextReview: '2026-10-01',
      cadence: 'Quarterly',
    },
    justification:
      'Gates which renewal leads reach the offer step. Leads below 3-of-4 get routed back to SDR for re-qualification before consuming AE time.',
  },
  'TF-0012': {
    statement:
      'Sales reps may offer up to 25% discount on list price without escalation. Discounts above 25% require VP Sales sign-off. Discounts above 40% additionally require Finance approval and CFO signature via deal desk.',
    citationCount: 64,
    sourceDocuments: [
      { id: 'SRC-0004', section: 'Slide 23 — Discount Authority Matrix', role: 'Authoritative table' },
    ],
    promotedFromClaim: null,
    promotionDate: null,
    // F1.5 — demo case: this attestation's nextReview is in the past so the
    // workflow can demonstrate a governance gate failing closed when a fact
    // is overdue. The UI shows REVIEW OVERDUE in inspection, and the Test
    // viewer (phase 2) will block the production run on this gate.
    attestation: {
      attestor: 'Alex Rivera',
      attestorRole: 'VP Sales',
      attestedAt: '2026-01-18',
      nextReview: '2026-04-18',   // ← past relative to today; triggers expired state
      cadence: 'Quarterly — re-confirmed each pricing cycle',
    },
    justification:
      'Hard ceiling the renewal copilot must respect when generating offers. Auto-generated discounts above 25% are routed to VP Sales review before customer-facing send.',
  },
}

// F1.5 — Returns true when the fact's attestation review window has passed.
// Compares to today; tolerant of missing or unparseable dates (false).
export function isAttestationExpired(fact) {
  const nextReview = fact?.attestation?.nextReview
  if (!nextReview) return false
  const due = new Date(nextReview)
  if (Number.isNaN(due.getTime())) return false
  return due.getTime() < Date.now()
}

// Days overdue. Returns 0 when not expired or date is missing.
export function daysOverdue(fact) {
  const nextReview = fact?.attestation?.nextReview
  if (!nextReview) return 0
  const due = new Date(nextReview)
  if (Number.isNaN(due.getTime())) return 0
  const diff = Date.now() - due.getTime()
  if (diff <= 0) return 0
  return Math.floor(diff / 86_400_000)
}

// Merge base + enrichment for a single truth fact.
// Returns null when the id is unknown so callers can guard.
export function getEnrichedFact(factId) {
  const base = availableTruthFacts.find(f => f.id === factId)
  if (!base) return null
  return { ...base, ...(factEnrichments[factId] || {}) }
}

// Resolve a source document id to its full record (or null when unknown).
export function getSourceDoc(srcId) {
  return availableSourceDocs.find(d => d.id === srcId) || null
}

// Resolve a sandbox claim id to its full record (or null when unknown).
export function getSandboxClaim(claimId) {
  return availableSandboxClaims.find(c => c.id === claimId) || null
}

// Build a hydrated lineage for a pack: every fact in the pack, fully enriched,
// with its source documents and sandbox claim resolved. Skips unknown ids.
export function getPackLineage(packId) {
  const pack = truthPacks.find(p => p.id === packId)
  if (!pack) return null
  const items = (pack.factIds || [])
    .map(id => {
      const fact = getEnrichedFact(id)
      if (!fact) return null
      return {
        ...fact,
        sourceDocuments: (fact.sourceDocuments || []).map(ref => ({
          ...ref,
          doc: getSourceDoc(ref.id),
        })),
        sandboxClaim: fact.promotedFromClaim ? getSandboxClaim(fact.promotedFromClaim) : null,
      }
    })
    .filter(Boolean)
  return { pack, items }
}

// ────────────────────────────────────────────────────────────────────────────
// WORKFLOW DRY-RUN MOCKS
// ────────────────────────────────────────────────────────────────────────────
// Sample inputs + traces used by the Test viewer to demonstrate how a
// workflow executes with a knowledge pack as a constraint. The trace shape
// mirrors LangSmith-style observability: a tree of nested runs where each
// node records type, status, latency, input/output, facts cited from the
// pack, and any governance events triggered.
//
// Lead A — clean pass: 250 emp, $20M ARR, 15% discount → all 3 facts gate
// the flow successfully, no escalation, deal proceeds.
// ────────────────────────────────────────────────────────────────────────────
export const testWorkflowInputs = {
  leadA: {
    id: 'lead-A',
    title: 'Acme Corp · clean pass',
    summary: '250 emp · $20M ARR · enterprise tier · 15% discount requested',
    payload: {
      account: {
        name: 'Acme Corp',
        domain: 'acme.com',
        employees: 250,
        arr_usd: 20_000_000,
        region: 'North America',
        integrations: ['Salesforce', 'Snowflake'],
      },
      opportunity: {
        stage: 'Renewal',
        tier_requested: 'enterprise',
        discount_requested_pct: 15,
        target_close_days: 60,
      },
      qualification: {
        budget_confirmed: true,
        authority_via: 'champion (VP of Revenue)',
        need: 'churn risk — competitor evaluating',
        timeline_days: 60,
      },
    },
  },
}

// Map workflow id → trace mock. Only n1 (Customer Renewal Pipeline) has
// a hydrated trace. Other workflows show an empty state in the Test viewer.
//
// F1.5 — when any fact in the workflow's pack has an expired attestation,
// the trace flips: in production the run halts at the offending step (the
// gate fails closed), in sandbox the same step warns but continues.
// The caller passes `{ env, hasExpiredAttestation }` so this stays a pure
// lookup — no React state inside the data module.
export function getTraceForWorkflow(workflowId, opts = {}) {
  if (workflowId !== 'n1') return null
  const { env = 'production', hasExpiredAttestation = false } = opts
  if (hasExpiredAttestation) {
    return env === 'sandbox'
      ? testWorkflowTraceLeadA_ExpiredSandbox
      : testWorkflowTraceLeadA_ExpiredProduction
  }
  return testWorkflowTraceLeadA
}

// Trace for Lead A run against the Customer Renewal Pipeline workflow (n1)
// with the Sales Playbook Facts pack (KP-003) attached as a restrict
// constraint. Three truth facts gate the flow: TF-0010 (ICP), TF-0011
// (BANT), TF-0012 (discount authority).
export const testWorkflowTraceLeadA = {
  workflowId: 'n1',
  workflowName: 'Customer Renewal Pipeline',
  packId: 'KP-003',
  packName: 'Sales Playbook Facts',
  inputId: 'lead-A',
  startedAt: '2026-05-13T15:00:00.000Z',
  totalLatencyMs: 4412,
  status: 'success',
  factsUsed: ['TF-0010', 'TF-0011', 'TF-0012'],
  factsBlocked: [],   // none — all relevant truth facts are in the pack
  finalRecommendation: {
    action: 'send_offer',
    tier: 'enterprise',
    discount_pct: 15,
    rationale: 'Account passes ICP + BANT. Discount within standard authority ceiling. No escalation required.',
  },
  steps: [
    {
      id: 'trigger',
      type: 'Trigger',
      name: 'Webhook Trigger',
      status: 'success',
      latencyMs: 12,
      input: { source: 'Salesforce', event: 'opportunity.renewal' },
      output: { lead_id: 'lead-A', received_at: '2026-05-13T15:00:00.012Z' },
      factsCited: [],
      governanceEvents: [
        { result: 'info', message: 'Pack constraint applied: Sales Playbook Facts (KP-003 · RESTRICT)' },
      ],
    },
    {
      id: 'qualification',
      type: 'Agent',
      name: 'Lead Qualification',
      status: 'success',
      latencyMs: 1840,
      input: { account: 'Acme Corp', employees: 250, arr_usd: 20_000_000 },
      output: { qualified: true, score: 0.92, reasons: ['ICP match', 'BANT 4/4 confirmed'] },
      factsCited: ['TF-0010', 'TF-0011'],
      governanceEvents: [
        { result: 'pass', message: 'ICP check via TF-0010: 250 emp ∈ [50, 500] · $20M ARR ∈ [$5M, $50M] · NA region ✓ · Salesforce integration ✓' },
        { result: 'pass', message: 'BANT check via TF-0011: Budget ✓ · Authority (champion mapped) ✓ · Need ✓ · Timeline 60d ✓ → 4 of 4' },
      ],
      children: [
        {
          id: 'check-icp',
          type: 'Tool',
          name: 'check_icp',
          status: 'success',
          latencyMs: 420,
          input: { account: 'Acme Corp' },
          output: { passed: true, criteria_met: ['employees', 'arr', 'region', 'integration'] },
          factsCited: ['TF-0010'],
        },
        {
          id: 'check-bant',
          type: 'Tool',
          name: 'check_bant',
          status: 'success',
          latencyMs: 1180,
          input: { opportunity: 'Acme Q3 renewal', qualification: { /* ... */ } },
          output: { passed: true, score: '4/4', missing: [] },
          factsCited: ['TF-0011'],
        },
      ],
    },
    {
      id: 'analyst',
      type: 'Agent',
      name: 'Customer Analyst',
      status: 'success',
      latencyMs: 2240,
      input: { qualified_lead: 'lead-A', requested_discount_pct: 15 },
      output: {
        recommended_offer: { tier: 'enterprise', discount_pct: 15, annual_value_usd: 510_000 },
        escalation_required: false,
      },
      factsCited: ['TF-0012'],
      governanceEvents: [
        { result: 'pass', message: 'Discount check via TF-0012: requested 15% ≤ 25% standard ceiling → no escalation' },
      ],
    },
    {
      id: 'crm-sync',
      type: 'Tool',
      name: 'CRM Sync',
      status: 'success',
      latencyMs: 320,
      input: { offer: { tier: 'enterprise', discount_pct: 15 } },
      output: { salesforce_opportunity_id: '0061y00000ABC123', stage_updated_to: 'Proposal' },
      factsCited: [],
    },
    {
      id: 'output',
      type: 'Output',
      name: 'Recommendation',
      status: 'success',
      latencyMs: 0,
      input: { recommendation: 'send_offer' },
      output: {
        message: 'Send enterprise renewal offer to Acme Corp at 15% discount. No approval gate required.',
      },
      factsCited: [],
    },
  ],
}

// F1.5 — same input as Lead A, but executed against the pack with TF-0012's
// attestation expired. In PRODUCTION the discount-authority gate fails closed:
// the Customer Analyst step errors, no offer is sent, run total = halted.
export const testWorkflowTraceLeadA_ExpiredProduction = {
  workflowId: 'n1',
  workflowName: 'Customer Renewal Pipeline',
  packId: 'KP-003',
  packName: 'Sales Playbook Facts',
  inputId: 'lead-A',
  startedAt: '2026-05-14T15:00:00.000Z',
  totalLatencyMs: 2272,
  status: 'error',
  factsUsed: ['TF-0010', 'TF-0011'],   // TF-0012 never reached — gate failed
  factsBlocked: [],
  finalRecommendation: {
    action: 'halted',
    tier: 'enterprise',
    discount_pct: null,
    rationale: 'Run halted at the Customer Analyst step. TF-0012 (Discount authority) attestation expired 2026-04-18 (26 days overdue). Production policy fails closed; the workflow cannot generate an offer until the fact is re-attested by Alex Rivera (VP Sales).',
  },
  steps: [
    {
      id: 'trigger',
      type: 'Trigger',
      name: 'Webhook Trigger',
      status: 'success',
      latencyMs: 12,
      input: { source: 'Salesforce', event: 'opportunity.renewal' },
      output: { lead_id: 'lead-A', received_at: '2026-05-14T15:00:00.012Z' },
      factsCited: [],
      governanceEvents: [
        { result: 'info', message: 'Pack constraint applied: Sales Playbook Facts (KP-003 · RESTRICT)' },
        { result: 'warn', message: '1 fact in pack has expired attestation: TF-0012. Production policy: fail closed at first citation.' },
      ],
    },
    {
      id: 'qualification',
      type: 'Agent',
      name: 'Lead Qualification',
      status: 'success',
      latencyMs: 1840,
      input: { account: 'Acme Corp', employees: 250, arr_usd: 20_000_000 },
      output: { qualified: true, score: 0.92, reasons: ['ICP match', 'BANT 4/4 confirmed'] },
      factsCited: ['TF-0010', 'TF-0011'],
      governanceEvents: [
        { result: 'pass', message: 'ICP check via TF-0010: attestation current, gate passed' },
        { result: 'pass', message: 'BANT check via TF-0011: attestation current, gate passed' },
      ],
      children: [
        {
          id: 'check-icp',
          type: 'Tool',
          name: 'check_icp',
          status: 'success',
          latencyMs: 420,
          input: { account: 'Acme Corp' },
          output: { passed: true, criteria_met: ['employees', 'arr', 'region', 'integration'] },
          factsCited: ['TF-0010'],
        },
        {
          id: 'check-bant',
          type: 'Tool',
          name: 'check_bant',
          status: 'success',
          latencyMs: 1180,
          input: { opportunity: 'Acme Q3 renewal' },
          output: { passed: true, score: '4/4', missing: [] },
          factsCited: ['TF-0011'],
        },
      ],
    },
    {
      id: 'analyst',
      type: 'Agent',
      name: 'Customer Analyst',
      status: 'error',
      latencyMs: 420,
      input: { qualified_lead: 'lead-A', requested_discount_pct: 15 },
      output: {
        error: 'governance_gate_failed',
        gate: 'TF-0012',
        reason: 'Attestation expired 2026-04-18 — 26 days overdue. Production policy: fail closed.',
        next_action: 'Re-attest TF-0012 (Discount authority) or detach the pack to override.',
      },
      factsCited: ['TF-0012'],
      governanceEvents: [
        { result: 'fail', message: 'TF-0012 attestation expired 2026-04-18 (26 days overdue). Production policy fails closed. Run halted before any side effect.' },
      ],
    },
    {
      id: 'crm-sync',
      type: 'Tool',
      name: 'CRM Sync',
      status: 'pending',
      latencyMs: 0,
      input: {},
      output: { skipped_reason: 'upstream gate failed' },
      factsCited: [],
    },
    {
      id: 'output',
      type: 'Output',
      name: 'Recommendation',
      status: 'pending',
      latencyMs: 0,
      input: {},
      output: { skipped_reason: 'upstream gate failed' },
      factsCited: [],
    },
  ],
}

// F1.5 — same scenario in sandbox: the gate is advisory only, so the
// Customer Analyst step warns but continues. Final recommendation lands.
export const testWorkflowTraceLeadA_ExpiredSandbox = {
  ...testWorkflowTraceLeadA,
  startedAt: '2026-05-14T15:00:00.000Z',
  // Tweak: the analyst step gets a warn event instead of pass for TF-0012.
  steps: testWorkflowTraceLeadA.steps.map(step => {
    if (step.id !== 'analyst') return step
    return {
      ...step,
      status: 'warn',
      governanceEvents: [
        { result: 'warn', message: 'Discount check via TF-0012: attestation expired 26 days ago. Sandbox is advisory — the gate would have failed in production. Promote re-attestation before going live.' },
      ],
    }
  }),
}

// ────────────────────────────────────────────────────────────────────────────
// Comparison data for F1.4 — "What if no pack?"
// ────────────────────────────────────────────────────────────────────────────
// When the pack is NOT applied, the workflow reads the entire truth plane.
// For Lead A (clean pass) the final recommendation lands in the same place,
// but the *cost* is higher (more facts scanned, more latency, more noise)
// and the *governance posture* is weaker (no constraint = no escalation
// gate enforced via the pack).
//
// This data is presented as a delta panel, not a parallel trace tree —
// pedagogical comparison, not a second full run.
// ────────────────────────────────────────────────────────────────────────────
export const testWorkflowComparisonLeadA = {
  withPack: {
    factsAvailable: 3,             // pack universe
    factsCited:     3,             // all relevant, all in pack
    governanceEvents: 4,           // ICP, BANT, discount, pack-applied
    latencyMs:      4412,
    riskFlags:      0,
    recommendation: 'send_offer · 15% · no escalation',
  },
  withoutPack: {
    factsAvailable: 8400,          // entire truth plane (matches Copilot copy)
    factsCited:     12,            // model picked up 9 extra "context bleed" facts
    governanceEvents: 1,           // only direct policy hit; no pack-enforced gate
    latencyMs:      6804,          // ~55% slower due to scan
    riskFlags:      2,             // no discount ceiling enforcement + noise
    recommendation: 'send_offer · 15% · no escalation',
  },
  // Concrete facts the model cited without the pack constraint that are
  // outside the Sales Playbook scope. Demonstrates "context bleed" — the
  // pack's actual job is to keep the agent focused.
  contextBleedFacts: [
    { id: 'TF-0001', title: 'Enterprise SLA — 99.9% uptime guarantee', irrelevanceNote: 'Renewal offer doesn\'t set SLA terms' },
    { id: 'TF-0007', title: 'GDPR — Data residency in EU',             irrelevanceNote: 'Account is North America-based' },
    { id: 'TF-0008', title: 'Cross-border transfer — adequacy decision needed', irrelevanceNote: 'Not relevant to single-region renewal' },
    { id: 'TF-0017', title: 'Time-to-value target — 30 days from signup', irrelevanceNote: 'Account already active for 2 years' },
    { id: 'TF-0021', title: 'Renewal window opens — 90 days before term end', irrelevanceNote: 'Procedural, not a qualification rule' },
  ],
  // Governance gates that the pack enforces but the open-plane run does not.
  // Critical for understanding the *risk* delta, not just the noise delta.
  missingGovernanceGates: [
    {
      factId: 'TF-0012',
      label:  'Discount authority ceiling — VP Sales for >25%',
      consequenceIfMissing:
        'For this lead the 15% discount is within range, but without the pack the workflow has no enforced ceiling. A future request at 30% would auto-approve.',
    },
  ],
}

// ────────────────────────────────────────────────────────────────────────────
// WORKFLOW ENVIRONMENTS (F1.2 — Mike's pillar)
// ────────────────────────────────────────────────────────────────────────────
// Workflows mirror the Truth/Sandbox Plane model for facts: a workflow lives
// in either Sandbox (free access, advisory pack, no side effects) or
// Production (enforced pack, audit log, real side effects). Promotion from
// sandbox to production is the workflow analog of promoting a sandbox claim
// to a truth fact.
//
// Keyed by workflow id. Use `getWorkflowEnvironment(id)` to read current
// state. The actual toggle in the slide-out mutates a session-level state
// (Knowledge.jsx owns it) so the mock map below is only the default seed.
// ────────────────────────────────────────────────────────────────────────────
export const WORKFLOW_ENVIRONMENTS = {
  production: {
    id: 'production',
    label: 'Production',
    color: '#4ade80',
    bg:    'rgba(34,197,94,0.10)',
    border:'rgba(34,197,94,0.30)',
    description: 'Pack enforced · workflow only reads facts inside the pack. Side effects (CRM writes, email sends) are live. Every run is audited.',
  },
  sandbox: {
    id: 'sandbox',
    label: 'Sandbox',
    color: '#fbbf24',
    bg:    'rgba(245,158,11,0.10)',
    border:'rgba(245,158,11,0.30)',
    description: 'Pack advisory · workflow can read the full truth plane. No CRM writes, no email sends. Use this to validate changes before promoting.',
  },
}

// Default environment per workflow id. Real product would persist this in
// the workflow record itself; here we keep it in a sidecar map so the demo
// can flip workflows individually without touching the agentic-studio mock.
export const workflowEnvironmentDefaults = {
  n1: 'production',   // Customer Renewal Pipeline — live
  n2: 'production',   // Outbound Prospecting Engine
  n3: 'production',   // Churn Risk Intervention
  n4: 'production',   // Invoice & Collections Flow
  n5: 'sandbox',      // Lead Nurture Automation — still being validated
  n6: 'sandbox',      // a draft workflow
}

export function getWorkflowEnvironmentDefault(workflowId) {
  return workflowEnvironmentDefaults[workflowId] || 'production'
}
