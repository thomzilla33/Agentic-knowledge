/**
 * UCP — Unified Contact Profile: shared types + mock data.
 *
 * Same role `adminShared.ts` plays for the Admin Console screens: one place
 * for the record shapes and the fixtures, so the list screen and the profile
 * screen can't drift apart on what a contact is.
 *
 * Two AIMS OS concepts are modelled here rather than invented:
 *   - Knowledge planes (Truth 100% / Sandbox ~80% / Sources ~60%) — the same
 *     three planes a TruthPack is built from. The Snapshot tab is this record's
 *     facts organised by plane, so "how sure are we" is readable at a glance.
 *   - Source Drives — drives, folders or documents attached from the company
 *     catalog. This is what the profile's Drives tab lists (it replaces the
 *     generic "Documents" tab a CRM would have).
 */

import type {
  ClientRecord,
  CustomerRecord,
  EmployeeRecord,
  NextBestAction,
} from "@/components/ui/record-header"

// ── Entity ────────────────────────────────────────────────────────────────────

export type UcpEntityType = "person" | "employee" | "company"
export type UcpStatus     = "Active" | "Inactive" | "Archived"

/** A study either returned data, returned nothing, or failed. */
export type StudyState = "loaded" | "empty" | "error"

export type TagVariantLite = "success" | "error" | "alert" | "informative" | "neutral"

export interface UcpContact {
  id:              string
  type:            UcpEntityType
  name:            string
  /** One line of "who is this" — role · department, or industry · size · HQ. */
  subtitle:        string
  email:           string
  phone:           string
  company:         string
  owner:           string
  status:          UcpStatus
  lastInteraction: string
  /** AIMS OS is agent-first — every record has one assigned concierge. */
  agent:           { id: string; name: string }
  /** Drives the RecordHeader Signal. Not every record has something urgent. */
  signal:          NextBestAction
  /** The agent's read on this record, shown as the Overview AI widget. */
  aiSummary:       { headline: string; detail: string; confidence: number }
  governance:      StudyState
  risk:            StudyState
  connections:     StudyState
}

/** person → client · employee → employee · company → customer.
 *  Picked by which fields the record actually has, per the RecordHeader rule. */
export const RECORD_VARIANT: Record<UcpEntityType, "client" | "employee" | "customer"> = {
  person:   "client",
  employee: "employee",
  company:  "customer",
}

export const TYPE_LABEL: Record<UcpEntityType, string> = {
  person:   "Person",
  employee: "Employee",
  company:  "Company",
}

export const TYPE_ICON: Record<UcpEntityType, string> = {
  person:   "UserRound",
  employee: "IdCard",
  company:  "Building2",
}

export const TYPE_TAG: Record<UcpEntityType, "informative" | "purple" | "lightBlue"> = {
  person:   "informative",
  employee: "purple",
  company:  "lightBlue",
}

export const STATUS_TAG: Record<UcpStatus, TagVariantLite> = {
  Active:   "success",
  Inactive: "neutral",
  Archived: "error",
}

// ── Knowledge planes ──────────────────────────────────────────────────────────

export type KnowledgePlane = "truth" | "sandbox" | "sources"

export const PLANE_META: Record<KnowledgePlane, {
  label:      string
  confidence: string
  tag:        TagVariantLite
  blurb:      string
}> = {
  truth:   { label: "Truth",   confidence: "100%", tag: "success",     blurb: "Verified facts. Agents treat these as absolute truth." },
  sandbox: { label: "Sandbox", confidence: "~80%", tag: "alert",       blurb: "Unverified claims and drafts. Likely true, not guaranteed." },
  sources: { label: "Sources", confidence: "~60%", tag: "informative", blurb: "Raw documents and reference material, used for lookup and citation." },
}

export const PLANE_ORDER: KnowledgePlane[] = ["truth", "sandbox", "sources"]

export interface UcpFact {
  id:         string
  label:      string
  value:      string
  plane:      KnowledgePlane
  source:     string
  verifiedAt: string
}

// ── Activity ──────────────────────────────────────────────────────────────────

export type ActivityChannel = "call" | "email" | "meeting" | "agent" | "system"

export const CHANNEL_META: Record<ActivityChannel, { label: string; icon: string }> = {
  call:    { label: "Calls",    icon: "Phone"    },
  email:   { label: "Email",    icon: "Mail"     },
  meeting: { label: "Meetings", icon: "Users"    },
  agent:   { label: "Agent",    icon: "Bot"      },
  system:  { label: "System",   icon: "Settings" },
}

export interface UcpActivity {
  id:        string
  channel:   ActivityChannel
  title:     string
  meta:      string
  timestamp: string
  state:     { label: string; variant: TagVariantLite }
  /** Written by the record's assigned agent — rendered as EntityList's aiInsight. */
  aiSummary?: string
}

// ── Source Drives ─────────────────────────────────────────────────────────────

export interface UcpDrive {
  id:       string
  name:     string
  kind:     "Drive" | "Folder" | "Document"
  provider: string
  items:    string
  owner:    string
  lastSync: string
  scope:    string
  state:    { label: string; variant: TagVariantLite }
}

// ── Connections ───────────────────────────────────────────────────────────────

export interface UcpConnection {
  id:       string
  name:     string
  relation: string
  icon:     string
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export const CONTACTS: UcpContact[] = [
  {
    id: "ORG-0023", type: "company", name: "Meridian Corp",
    subtitle: "Financial Services · 2,400 employees · New York",
    email: "accounts@meridian.com", phone: "+1 (212) 555-0142", company: "Meridian Corp",
    owner: "Priya Nair", status: "Active", lastInteraction: "Aug 22, 2026",
    agent: { id: "AGT-01", name: "Meridian Concierge" },
    signal: { severity: "alert", label: "Renewal in 12 days — account health dropped to 61", dueContext: "Renews Sep 5", actionLabel: "Schedule renewal call" },
    aiSummary: {
      headline: "Renewal at risk — usage is up, sentiment is down.",
      detail: "Seat usage grew 18% this quarter but three support escalations opened since July, all routing through the same integration. Sandra Torres has asked twice about the migration timeline without a written answer. The renewal call is the place to close that gap.",
      confidence: 82,
    },
    governance: "loaded", risk: "loaded", connections: "loaded",
  },
  {
    id: "PER-0091", type: "person", name: "Sarah Chen",
    subtitle: "Head of Compliance · Legal · Meridian Corp",
    email: "sarah.chen@meridian.com", phone: "+1 (212) 555-0188", company: "Meridian Corp",
    owner: "Priya Nair", status: "Active", lastInteraction: "Aug 28, 2026",
    agent: { id: "AGT-02", name: "Deal Concierge" },
    signal: { severity: "informative", label: "Reviewing the governance addendum — no response due yet", dueContext: "Sent Aug 28" },
    aiSummary: {
      headline: "Technical evaluator, not the economic buyer.",
      detail: "Sarah has driven every compliance question on the Meridian expansion and cleared the data-residency review herself. She has never discussed price. Route commercial terms to Sandra Torres and keep Sarah on audit evidence.",
      confidence: 76,
    },
    governance: "loaded", risk: "empty", connections: "loaded",
  },
  {
    id: "EMP-00412", type: "employee", name: "James Ortega",
    subtitle: "Senior Operations Lead · Operations · Phoenix, AZ",
    email: "james.ortega@acme.com", phone: "+1 (602) 555-0100", company: "Acme Corp",
    owner: "Lisa Park", status: "Active", lastInteraction: "Sep 1, 2026",
    agent: { id: "AGT-03", name: "People Concierge" },
    signal: { severity: "alert", label: "1 performance review pending your approval", dueContext: "Due in 3 days" },
    aiSummary: {
      headline: "Consistent operator, overdue on one approval.",
      detail: "James has closed every quarterly governance check on time for six quarters. The one open item is his mid-year review, waiting on Lisa Park since Aug 20. Nothing else on this record needs attention.",
      confidence: 91,
    },
    governance: "loaded", risk: "loaded", connections: "error",
  },
  {
    id: "ORG-0031", type: "company", name: "Northwind Health",
    subtitle: "Healthcare · 5,100 employees · Phoenix, AZ",
    email: "partnerships@northwindhealth.org", phone: "+1 (602) 555-0177", company: "Northwind Health",
    owner: "Daniel Ruiz", status: "Active", lastInteraction: "Aug 30, 2026",
    agent: { id: "AGT-04", name: "Northwind Concierge" },
    signal: { severity: "success", label: "Expansion signed — 5 clinics added to the network", dueContext: "Confirmed Aug 30" },
    aiSummary: {
      headline: "Healthy account, expanding on its own initiative.",
      detail: "Northwind added five clinic sites without a discount request. Two of the five have not completed network sync, which is an onboarding task rather than a commercial risk.",
      confidence: 88,
    },
    governance: "loaded", risk: "loaded", connections: "loaded",
  },
  {
    id: "PER-0104", type: "person", name: "Sandra Torres",
    subtitle: "VP of Operations · Meridian Corp",
    email: "sandra.torres@meridian.com", phone: "+1 (212) 555-0155", company: "Meridian Corp",
    owner: "Priya Nair", status: "Active", lastInteraction: "Sep 2, 2026",
    agent: { id: "AGT-02", name: "Deal Concierge" },
    signal: { severity: "alert", label: "Asked for the migration timeline twice — still unanswered", dueContext: "Last asked Sep 2", actionLabel: "Send timeline" },
    aiSummary: {
      headline: "Economic buyer on the Meridian renewal.",
      detail: "Sandra owns the budget line and has raised the migration timeline in the last two calls without getting a written answer. That single open question is the strongest predictor of how the renewal lands.",
      confidence: 84,
    },
    governance: "empty", risk: "loaded", connections: "loaded",
  },
  {
    id: "EMP-00518", type: "employee", name: "Lisa Park",
    subtitle: "Director of Operations · Operations · Phoenix, AZ",
    email: "lisa.park@acme.com", phone: "+1 (602) 555-0121", company: "Acme Corp",
    owner: "Marcus Webb", status: "Active", lastInteraction: "Sep 1, 2026",
    agent: { id: "AGT-03", name: "People Concierge" },
    signal: { severity: "alert", label: "3 reviews waiting on her approval", dueContext: "Oldest is 12 days old" },
    aiSummary: {
      headline: "Approval queue is the bottleneck, not her workload.",
      detail: "Lisa manages nine reports and has three reviews queued, the oldest open 12 days. Her own governance and policy items are all current.",
      confidence: 79,
    },
    governance: "loaded", risk: "empty", connections: "loaded",
  },
  {
    id: "PER-0112", type: "person", name: "David Park",
    subtitle: "IT Director · Meridian Corp",
    email: "david.park@meridian.com", phone: "+1 (212) 555-0163", company: "Meridian Corp",
    owner: "Daniel Ruiz", status: "Active", lastInteraction: "Aug 19, 2026",
    agent: { id: "AGT-02", name: "Deal Concierge" },
    signal: { severity: "neutral", label: "No open items on this record", dueContext: "Last reviewed Aug 19", dismissible: true },
    aiSummary: {
      headline: "Technical gatekeeper, currently unblocked.",
      detail: "David signed off on the SSO and data-residency reviews in July. No open questions since. He is the right contact if the migration timeline turns into an implementation plan.",
      confidence: 71,
    },
    governance: "loaded", risk: "empty", connections: "loaded",
  },
  {
    id: "ORG-0044", type: "company", name: "Kestrel Logistics",
    subtitle: "Transportation · 890 employees · Dallas, TX",
    email: "hello@kestrellogistics.com", phone: "+1 (214) 555-0190", company: "Kestrel Logistics",
    owner: "Daniel Ruiz", status: "Inactive", lastInteraction: "Jun 14, 2026",
    agent: { id: "AGT-05", name: "Kestrel Concierge" },
    signal: { severity: "error", label: "No contact in 80 days — account went dormant after the pilot", dueContext: "Pilot ended Jun 14", actionLabel: "Open re-engagement" },
    aiSummary: {
      headline: "Dormant since the pilot closed, no stated reason.",
      detail: "The pilot completed with all success criteria met, then contact stopped. No churn signal was ever recorded, which usually means a sponsor change rather than a lost deal.",
      confidence: 64,
    },
    governance: "empty", risk: "loaded", connections: "empty",
  },
  {
    id: "EMP-00623", type: "employee", name: "Marcus Webb",
    subtitle: "VP of Operations · Operations · Remote",
    email: "marcus.webb@acme.com", phone: "+1 (602) 555-0134", company: "Acme Corp",
    owner: "Elena Fischer", status: "Active", lastInteraction: "Aug 27, 2026",
    agent: { id: "AGT-03", name: "People Concierge" },
    signal: { severity: "neutral", label: "No pending approvals", dueContext: "Queue cleared Aug 27", dismissible: true },
    aiSummary: {
      headline: "Clear queue, current on every policy.",
      detail: "Marcus cleared his approval queue on Aug 27 and has all twelve policies signed. Nothing on this record needs a decision this week.",
      confidence: 86,
    },
    governance: "loaded", risk: "loaded", connections: "loaded",
  },
  {
    id: "PER-0128", type: "person", name: "Amy Chen",
    subtitle: "CFO · Meridian Corp",
    email: "amy.chen@meridian.com", phone: "+1 (212) 555-0171", company: "Meridian Corp",
    owner: "Priya Nair", status: "Inactive", lastInteraction: "Apr 3, 2026",
    agent: { id: "AGT-02", name: "Deal Concierge" },
    signal: { severity: "neutral", label: "Marked inactive — no longer the finance contact", dueContext: "Updated Apr 3" },
    aiSummary: {
      headline: "Superseded as the finance contact.",
      detail: "Amy approved the original Meridian contract in 2024. Finance approvals have routed through Sandra Torres since April. Keep the record for contract history.",
      confidence: 69,
    },
    governance: "empty", risk: "empty", connections: "loaded",
  },
  {
    id: "ORG-0052", type: "company", name: "Halden Manufacturing",
    subtitle: "Industrial · 1,600 employees · Cleveland, OH",
    email: "ops@halden-mfg.com", phone: "+1 (216) 555-0118", company: "Halden Manufacturing",
    owner: "Elena Fischer", status: "Active", lastInteraction: "Aug 25, 2026",
    agent: { id: "AGT-06", name: "Halden Concierge" },
    signal: { severity: "informative", label: "Security review in progress — 4 of 6 checks cleared", dueContext: "Target Sep 12" },
    aiSummary: {
      headline: "Mid-review, on schedule.",
      detail: "Four of six security checks have cleared. The two open items are network segmentation evidence and the sub-processor list, both assigned to Halden's side.",
      confidence: 74,
    },
    governance: "loaded", risk: "loaded", connections: "empty",
  },
  {
    id: "PER-0133", type: "person", name: "Tomás Ferreira",
    subtitle: "Head of Data Platform · Halden Manufacturing",
    email: "tomas.ferreira@halden-mfg.com", phone: "+1 (216) 555-0126", company: "Halden Manufacturing",
    owner: "Elena Fischer", status: "Active", lastInteraction: "Aug 25, 2026",
    agent: { id: "AGT-06", name: "Halden Concierge" },
    signal: { severity: "informative", label: "Owns the two open security-review items", dueContext: "Target Sep 12", actionLabel: "Send checklist" },
    aiSummary: {
      headline: "Single owner of both blockers.",
      detail: "Tomás owns network segmentation evidence and the sub-processor list. He has answered every prior request within two business days, so a checklist is likely enough.",
      confidence: 80,
    },
    governance: "loaded", risk: "empty", connections: "loaded",
  },
  {
    id: "EMP-00701", type: "employee", name: "Elena Fischer",
    subtitle: "Account Director · Revenue · Chicago, IL",
    email: "elena.fischer@acme.com", phone: "+1 (312) 555-0149", company: "Acme Corp",
    owner: "Marcus Webb", status: "Active", lastInteraction: "Sep 2, 2026",
    agent: { id: "AGT-03", name: "People Concierge" },
    signal: { severity: "neutral", label: "No open items on this record", dueContext: "Last reviewed Sep 2", dismissible: true },
    aiSummary: {
      headline: "Owns two accounts mid-review, no personnel items open.",
      detail: "Elena carries Halden and Kestrel. Both have open account-side work, but nothing on her own employee record requires a decision.",
      confidence: 83,
    },
    governance: "loaded", risk: "empty", connections: "loaded",
  },
  {
    id: "PER-0147", type: "person", name: "Grace Okafor",
    subtitle: "Chief Nursing Officer · Northwind Health",
    email: "grace.okafor@northwindhealth.org", phone: "+1 (602) 555-0182", company: "Northwind Health",
    owner: "Daniel Ruiz", status: "Active", lastInteraction: "Aug 30, 2026",
    agent: { id: "AGT-04", name: "Northwind Concierge" },
    signal: { severity: "success", label: "Sponsored the 5-clinic expansion", dueContext: "Signed Aug 30" },
    aiSummary: {
      headline: "Executive sponsor of the expansion.",
      detail: "Grace drove the five-clinic expansion internally and signed without a discount request. Two clinics still need network sync — an onboarding task her team can close.",
      confidence: 87,
    },
    governance: "loaded", risk: "empty", connections: "loaded",
  },
]

// ── Per-record collections ────────────────────────────────────────────────────
// Built from the contact itself so every profile reads as that record's own
// data rather than one shared fixture repeated 14 times.

const COMPANY_SIZE = (c: UcpContact) => c.subtitle.split(" · ")[1] ?? "—"
const FIRST_FIELD  = (c: UcpContact) => c.subtitle.split(" · ")[0] ?? "—"

export function getFacts(c: UcpContact): UcpFact[] {
  if (c.type === "company") {
    return [
      { id: "f1", label: "Legal entity",        value: `${c.name}, Inc.`,           plane: "truth",   source: "Contract · countersigned",            verifiedAt: "Aug 4, 2026"  },
      { id: "f2", label: "Industry",            value: FIRST_FIELD(c),              plane: "truth",   source: "Account record · CRM sync",           verifiedAt: "Aug 4, 2026"  },
      { id: "f3", label: "Headcount",           value: COMPANY_SIZE(c),             plane: "truth",   source: "Account record · CRM sync",           verifiedAt: "Aug 4, 2026"  },
      { id: "f4", label: "Account owner",       value: c.owner,                     plane: "truth",   source: "Territory assignment",                verifiedAt: "Jul 1, 2026"  },
      { id: "f5", label: "Billing contact",     value: c.email,                     plane: "truth",   source: "Billing system",                      verifiedAt: "Aug 4, 2026"  },
      { id: "f6", label: "Budget cycle",        value: "Calendar year, locked in Q4", plane: "sandbox", source: "Call notes — Aug 22",               verifiedAt: "Aug 22, 2026" },
      { id: "f7", label: "Competing evaluation", value: "Evaluated one other vendor in 2024", plane: "sandbox", source: "Discovery notes",          verifiedAt: "Jun 9, 2026"  },
      { id: "f8", label: "Expansion appetite",  value: "Open to adding sites without a new RFP", plane: "sandbox", source: "Email thread — Aug 18", verifiedAt: "Aug 18, 2026" },
      { id: "f9", label: "Master agreement",    value: `MSA_${c.name.split(" ")[0]}_2026.pdf`, plane: "sources", source: "Shared Drive · Legal",     verifiedAt: "Aug 4, 2026"  },
      { id: "f10", label: "Security questionnaire", value: "SIG Lite, 214 responses", plane: "sources", source: "Shared Drive · Security",           verifiedAt: "Jul 28, 2026" },
      { id: "f11", label: "Org chart",          value: "Slide deck, 3 levels deep",  plane: "sources", source: "Shared Drive · Accounts",            verifiedAt: "May 12, 2026" },
    ]
  }
  if (c.type === "employee") {
    return [
      { id: "f1", label: "Full name",       value: c.name,                    plane: "truth",   source: "Workday · HRIS sync",        verifiedAt: "Sep 1, 2026"  },
      { id: "f2", label: "Role",            value: FIRST_FIELD(c),            plane: "truth",   source: "Workday · HRIS sync",        verifiedAt: "Sep 1, 2026"  },
      { id: "f3", label: "Work email",      value: c.email,                   plane: "truth",   source: "Identity provider · SSO",    verifiedAt: "Sep 1, 2026"  },
      { id: "f4", label: "Manager",         value: c.owner,                   plane: "truth",   source: "Workday · HRIS sync",        verifiedAt: "Sep 1, 2026"  },
      { id: "f5", label: "Access role",     value: "Standard · Operations",   plane: "truth",   source: "Identity provider · SSO",    verifiedAt: "Aug 14, 2026" },
      { id: "f6", label: "Career interest", value: "Mentioned interest in a platform role", plane: "sandbox", source: "1:1 notes — Aug 5", verifiedAt: "Aug 5, 2026"  },
      { id: "f7", label: "Working pattern", value: "Prefers async review over live meetings", plane: "sandbox", source: "Team retro — Jul 22", verifiedAt: "Jul 22, 2026" },
      { id: "f8", label: "Signed policies", value: "12 of 12, latest Data Handling v2.1", plane: "sources", source: "Governance Studio",  verifiedAt: "Aug 6, 2026"  },
      { id: "f9", label: "Review history",  value: "6 quarters, all completed on time",  plane: "sources", source: "Shared Drive · People", verifiedAt: "Jul 20, 2026" },
    ]
  }
  return [
    { id: "f1", label: "Full name",        value: c.name,                     plane: "truth",   source: "Account record · CRM sync",   verifiedAt: "Aug 28, 2026" },
    { id: "f2", label: "Title",            value: FIRST_FIELD(c),             plane: "truth",   source: "Account record · CRM sync",   verifiedAt: "Aug 28, 2026" },
    { id: "f3", label: "Company",          value: c.company,                  plane: "truth",   source: "Account record · CRM sync",   verifiedAt: "Aug 28, 2026" },
    { id: "f4", label: "Email",            value: c.email,                    plane: "truth",   source: "Verified reply — inbound",    verifiedAt: "Aug 28, 2026" },
    { id: "f5", label: "Direct line",      value: c.phone,                    plane: "truth",   source: "Email signature",             verifiedAt: "Aug 19, 2026" },
    { id: "f6", label: "Decision role",    value: "Evaluator, not budget owner", plane: "sandbox", source: "Call notes — Aug 28",      verifiedAt: "Aug 28, 2026" },
    { id: "f7", label: "Stated priority",  value: "Auditability ahead of speed", plane: "sandbox", source: "Call notes — Aug 12",      verifiedAt: "Aug 12, 2026" },
    { id: "f8", label: "Channel preference", value: "Responds fastest to email before 9am ET", plane: "sandbox", source: "Interaction history", verifiedAt: "Aug 28, 2026" },
    { id: "f9", label: "Governance addendum", value: "Addendum_v3_redlined.pdf", plane: "sources", source: "Shared Drive · Legal",     verifiedAt: "Aug 28, 2026" },
    { id: "f10", label: "Meeting transcripts", value: "4 calls, Jun–Aug 2026",  plane: "sources", source: "Communication Hub",        verifiedAt: "Aug 28, 2026" },
  ]
}

export function getActivity(c: UcpContact): UcpActivity[] {
  const who   = c.name.split(" ")[0]
  const agent = c.agent.name
  return [
    {
      id: "a1", channel: "agent", title: `${agent} refreshed the record snapshot`,
      meta: "4 facts promoted to Truth plane · 1 claim expired", timestamp: "Today, 08:12",
      state: { label: "Completed", variant: "success" },
      aiSummary: `Re-verified ${who}'s contact fields against the CRM sync and promoted four Sandbox claims after a matching source appeared. One claim about budget timing expired without corroboration and was dropped back to Sandbox.`,
    },
    {
      id: "a2", channel: "call", title: `Outbound call · ${c.phone}`,
      meta: `${c.owner} · 18:24 · Discovery follow-up`, timestamp: "Sep 2, 2026 · 14:05",
      state: { label: "Positive", variant: "success" },
      aiSummary: `${who} confirmed the evaluation is still funded and asked for a written migration timeline. No pricing objection was raised. The timeline is the one open commitment from this call.`,
    },
    {
      id: "a3", channel: "email", title: "Governance addendum sent for review",
      meta: `${c.owner} → ${c.email} · 1 attachment`, timestamp: "Aug 28, 2026 · 09:40",
      state: { label: "Opened", variant: "informative" },
    },
    {
      id: "a4", channel: "meeting", title: "Quarterly business review",
      meta: `${c.owner}, ${who} · 52 min · 6 attendees`, timestamp: "Aug 22, 2026 · 11:00",
      state: { label: "Completed", variant: "success" },
      aiSummary: `Usage and roadmap were covered in full. Two escalations from July were raised again without a resolution date, which is the thread most likely to carry into the next conversation.`,
    },
    {
      id: "a5", channel: "system", title: "Record merged from duplicate",
      meta: `${c.id} absorbed a duplicate created by the inbound form`, timestamp: "Aug 19, 2026 · 16:20",
      state: { label: "Completed", variant: "success" },
    },
    {
      id: "a6", channel: "email", title: "Migration timeline requested",
      meta: `${c.email} → ${c.owner}`, timestamp: "Aug 18, 2026 · 07:55",
      state: { label: "Awaiting reply", variant: "alert" },
    },
    {
      id: "a7", channel: "agent", title: `${agent} drafted a follow-up`,
      meta: "Draft held for review · not sent", timestamp: "Aug 18, 2026 · 08:02",
      state: { label: "Needs review", variant: "alert" },
      aiSummary: `A reply to the timeline request was drafted but held, because the delivery date it referenced was not confirmed anywhere in the Truth plane.`,
    },
    {
      id: "a8", channel: "call", title: `Inbound call · ${c.phone}`,
      meta: `${agent} · 6:41 · Routed to ${c.owner}`, timestamp: "Aug 12, 2026 · 10:42",
      state: { label: "Resolved", variant: "success" },
      aiSummary: `${who} called about audit evidence and was routed after the agent confirmed identity. The requested evidence pack was sent the same day.`,
    },
    {
      id: "a9", channel: "meeting", title: "Security review working session",
      meta: `${who} · 45 min · 4 attendees`, timestamp: "Jul 28, 2026 · 15:30",
      state: { label: "Completed", variant: "success" },
    },
    {
      id: "a10", channel: "system", title: "Source Drive attached",
      meta: "Legal · shared folder connected to this record", timestamp: "Jul 28, 2026 · 15:58",
      state: { label: "Completed", variant: "success" },
    },
    {
      id: "a11", channel: "email", title: "Evidence pack delivered",
      meta: `${c.owner} → ${c.email} · 3 attachments`, timestamp: "Jul 22, 2026 · 12:10",
      state: { label: "Opened", variant: "informative" },
    },
    {
      id: "a12", channel: "agent", title: `${agent} flagged a stale fact`,
      meta: "Budget cycle claim older than 90 days", timestamp: "Jul 20, 2026 · 06:00",
      state: { label: "Resolved", variant: "success" },
      aiSummary: `The budget-cycle claim passed its freshness window. It was re-confirmed on the Aug 22 review call and returned to the Sandbox plane with a new timestamp.`,
    },
    {
      id: "a13", channel: "call", title: `Outbound call · ${c.phone}`,
      meta: `${c.owner} · 9:03 · No answer, voicemail left`, timestamp: "Jul 14, 2026 · 09:15",
      state: { label: "No answer", variant: "neutral" },
    },
    {
      id: "a14", channel: "system", title: "Record created",
      meta: `${c.id} · ingested from the account sync`, timestamp: "Jun 9, 2026 · 08:00",
      state: { label: "Completed", variant: "success" },
    },
  ]
}

export function getDrives(c: UcpContact): UcpDrive[] {
  const slug = c.company.split(" ")[0]
  return [
    {
      id: "d1", name: `${slug} — Legal`, kind: "Folder", provider: "Google Drive",
      items: "24 documents", owner: "Legal Ops", lastSync: "Today, 06:00",
      scope: "Shared with 3 networks", state: { label: "Synced", variant: "success" },
    },
    {
      id: "d2", name: `${slug} — Security & Compliance`, kind: "Folder", provider: "SharePoint",
      items: "61 documents", owner: "Security", lastSync: "Today, 06:00",
      scope: "Shared with 2 networks", state: { label: "Synced", variant: "success" },
    },
    {
      id: "d3", name: `MSA_${slug}_2026.pdf`, kind: "Document", provider: "Google Drive",
      items: "1 document", owner: "Legal Ops", lastSync: "Aug 4, 2026",
      scope: "Attached to this record only", state: { label: "Synced", variant: "success" },
    },
    {
      id: "d4", name: `${slug} — Meeting transcripts`, kind: "Folder", provider: "Communication Hub",
      items: "18 transcripts", owner: c.owner, lastSync: "Sep 2, 2026",
      scope: "Attached to this record only", state: { label: "Synced", variant: "success" },
    },
    {
      id: "d5", name: "Revenue — Account plans", kind: "Drive", provider: "Box",
      items: "412 documents", owner: "Revenue Ops", lastSync: "Aug 30, 2026",
      scope: "Shared with 6 networks", state: { label: "Partial access", variant: "alert" },
    },
    {
      id: "d6", name: `${slug} — Archive 2024`, kind: "Folder", provider: "SharePoint",
      items: "137 documents", owner: "Legal Ops", lastSync: "Failed Aug 26, 2026",
      scope: "Shared with 1 network", state: { label: "Sync failed", variant: "error" },
    },
  ]
}

export function getConnections(c: UcpContact): UcpConnection[] {
  if (c.type === "company") {
    return [
      { id: "c1", name: "Sandra Torres",   relation: "VP of Operations · primary contact", icon: "UserRound" },
      { id: "c2", name: "Sarah Chen",      relation: "Head of Compliance · evaluator",     icon: "UserRound" },
      { id: "c3", name: "Enterprise Renewal 2026", relation: "Deal · $480K · closes Sep 5", icon: "Briefcase" },
      { id: "c4", name: "Phoenix Medical Center",  relation: "Location · 127 staff",        icon: "MapPin"    },
    ]
  }
  if (c.type === "employee") {
    return [
      { id: "c1", name: c.owner,        relation: "Manager",              icon: "UserRound" },
      { id: "c2", name: "Operations",   relation: "Team · 9 members",     icon: "Users"     },
      { id: "c3", name: c.company,      relation: "Organization",         icon: "Building2" },
    ]
  }
  return [
    { id: "c1", name: c.company, relation: "Organization · employer",             icon: "Building2" },
    { id: "c2", name: c.owner,   relation: "Account owner",                       icon: "UserRound" },
    { id: "c3", name: "Enterprise Renewal 2026", relation: "Deal · participant",  icon: "Briefcase" },
  ]
}

/** Governance study — one row per metric, same shape for every record type. */
export function getGovernance(c: UcpContact): { label: string; value: string; icon: string; variant: "success" | "alert" | "informative" | "neutral" }[] {
  return c.type === "employee"
    ? [
        { label: "Policies signed",  value: "12 of 12",     icon: "FileCheck2",    variant: "success"     },
        { label: "Open reviews",     value: "1",            icon: "ClipboardList", variant: "alert"       },
        { label: "Training current", value: "Yes",          icon: "GraduationCap", variant: "success"     },
        { label: "Last audit",       value: "Aug 10, 2026", icon: "CalendarCheck", variant: "informative" },
      ]
    : [
        { label: "Compliance score", value: "94 / 100",     icon: "ShieldCheck",   variant: "success"     },
        { label: "Open reviews",     value: c.status === "Active" ? "1" : "0", icon: "ClipboardList", variant: c.status === "Active" ? "alert" : "neutral" },
        { label: "DPA signed",       value: "Yes · v3",     icon: "FileCheck2",    variant: "success"     },
        { label: "Last audit",       value: "Aug 10, 2026", icon: "CalendarCheck", variant: "informative" },
      ]
}

export function getRisk(_c: UcpContact): { label: string; value: string; icon: string; variant: "success" | "alert" | "informative" | "neutral" }[] {
  return [
    { label: "Risk score",  value: "18 / 100",     icon: "TrendingDown",   variant: "success"     },
    { label: "Open flags",  value: "0",            icon: "Flag",           variant: "neutral"     },
    { label: "Last scan",   value: "Aug 27, 2026", icon: "ScanLine",       variant: "informative" },
    { label: "Trend",       value: "24 → 18",      icon: "ArrowDownRight", variant: "success"     },
  ]
}

// ── RecordHeader payloads ─────────────────────────────────────────────────────

export function buildRecord(c: UcpContact): EmployeeRecord | CustomerRecord | ClientRecord {
  if (c.type === "company") {
    const record: CustomerRecord = {
      accountName:    c.name,
      segment:        "Enterprise",
      owner:          c.owner,
      tier:           "Tier 1",
      industry:       FIRST_FIELD(c),
      renewalDate:    "Sep 5, 2026",
      mrr:            "$480K ARR",
      lastContact:    c.lastInteraction,
      openTickets:    3,
      adoptionLevel:  "High",
      primaryContact: "Sandra Torres",
    }
    return record
  }
  if (c.type === "employee") {
    const record: EmployeeRecord = {
      name:       c.name,
      role:       FIRST_FIELD(c),
      department: c.subtitle.split(" · ")[1] ?? "—",
      manager:    c.owner,
      location:   c.subtitle.split(" · ")[2] ?? "—",
      email:      c.email,
      phone:      c.phone,
      startDate:  "Jan 12, 2022",
      team:       c.subtitle.split(" · ")[1] ?? "—",
      accessRole: "Standard",
    }
    return record
  }
  const record: ClientRecord = {
    name:              c.name,
    company:           c.company,
    dealStage:         "Evaluation",
    dealValue:         "$480K",
    owner:             c.owner,
    email:             c.email,
    phone:             c.phone,
    leadSource:        "Account expansion",
    lastInteraction:   c.lastInteraction,
    expectedCloseDate: "Sep 5, 2026",
  }
  return record
}

// ── Concierge chat ────────────────────────────────────────────────────────────

export interface ConciergeTurn {
  id:      string
  from:    "agent" | "user"
  text:    string
  /** Which facts the answer leaned on — the plane is what makes it auditable. */
  sources?: { label: string; plane: KnowledgePlane }[]
}

export function getConciergeOpening(c: UcpContact): ConciergeTurn[] {
  return [
    {
      id: "t1", from: "agent",
      text: `I'm the concierge for ${c.name}. I answer from this record's Truth, Sandbox and Sources planes, and I show you which one each answer came from.`,
    },
    {
      id: "t2", from: "agent",
      text: c.aiSummary.detail,
      sources: [
        { label: "Interaction history",    plane: "truth"   },
        { label: "Call notes — Aug 22",    plane: "sandbox" },
        { label: "Shared Drive · Legal",   plane: "sources" },
      ],
    },
  ]
}

export const CONCIERGE_PROMPTS = [
  "What changed on this record this week?",
  "What do we still owe them?",
  "Which facts are unverified?",
]
