/**
 * UCP — Unified Contact Profile: shared types + mock data.
 *
 * Same role `adminShared.ts` plays for the Admin Console screens: one place
 * for the record shapes and the fixtures, so the list screen and the profile
 * screen can't drift apart on what a contact is.
 *
 * Three AIMS OS concepts are modelled here rather than invented:
 *   - Knowledge planes (Truth 100% / Sandbox ~80% / Sources ~60%) — the same
 *     three planes a TruthPack is built from. The Snapshot tab is this record's
 *     facts organised by plane, so "how sure are we" is readable at a glance.
 *   - Source Drives — drives, folders or documents attached from the company
 *     catalog. This is what the profile's Drives tab lists (it replaces the
 *     generic "Documents" tab a CRM would have).
 *   - The Entity Header content model (Figma 19815-101547) — visual, title,
 *     source, state badge, signal and classification tags, secondary metadata.
 *     Every field below maps to a named slot in that spec; nothing is a
 *     convenience field invented for this screen.
 */

import type { EntityMetaItem, EntityTag } from "@/components/experimental/entity-header"
import type { NextBestAction } from "@/components/experimental/next-best-action-card"

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
  /** Lifecycle, and what the list filters on. */
  status:          UcpStatus
  /**
   * The Entity Header's state badge — exactly one, and the most blocking status
   * wins. Defaults to `status`; set it only when something more blocking is
   * true of the record, in which case the lifecycle value moves to a tag.
   */
  stateBadge?:     { label: string; variant: TagVariantLite }
  /**
   * The system this record was pulled from. One item, never two — a job title,
   * a location or a category is not a source. Omitted when the entity was
   * created in the platform itself; the slot is removed, never refilled.
   */
  source:          { label: string; iconName: string }
  /** Signals first (by severity), then classification. Max 6 including overflow. */
  tags:            EntityTag[]
  /** Max 6, aim for four. Every item carries a tooltip naming its field. */
  meta:            EntityMetaItem[]
  lastInteraction: string
  /** AIMS OS is agent-first — every record has one assigned concierge. */
  agent:           { id: string; name: string }
  /**
   * The engine's proposal, rendered as its own card BELOW the header — never
   * inside it. null when there is nothing to do: no action, no card.
   */
  nba:             NextBestAction | null
  /** The agent's read on this record, shown as the Overview AI widget. */
  aiSummary:       { headline: string; detail: string; confidence: number }
  governance:      StudyState
  risk:            StudyState
  connections:     StudyState
}

/**
 * The display label for each type. `person` reads as "Customer": these records
 * are contacts at customer and prospect accounts, and "Person" said what the
 * row was rather than what the record is. The internal discriminator stays
 * `person` so the type union does not churn.
 */
export const TYPE_LABEL: Record<UcpEntityType, string> = {
  person:   "Customer",
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

/**
 * All three types here are entities with a real-world visual identity — a face
 * or a brand — so all three use an avatar. That is also why each carries a
 * classification tag: an avatar cannot communicate what kind of thing this is,
 * where a highlight icon would.
 */
export function entityState(c: UcpContact): { label: string; variant: TagVariantLite } {
  return c.stateBadge ?? { label: c.status, variant: STATUS_TAG[c.status] }
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
    source: { label: "Salesforce", iconName: "Cloud" },
    tags: [
      { label: "Renewal at risk", role: "signal", tone: "alert", severity: 3, tooltip: "Health dropped to 61 · renews Sep 5" },
      { label: "Customer",        role: "classification" },
      { label: "Enterprise",      role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "11 facts",     tooltip: "Verified facts · 5 on the Truth plane, 6 across Sandbox and Sources." },
      { iconName: "Inbox",       label: "3 open",       tooltip: "Open items · 3 support escalations, oldest opened Jul 14." },
      { iconName: "HardDrive",   label: "6 drives",     tooltip: "Source Drives · 6 attached, 1 failing to sync since Aug 26." },
      { iconName: "Bot",         label: "Tier 1",       tooltip: "Assigned agent · Meridian Concierge, tier 1. Handling this account since Mar 3." },
    ],
    agent: { id: "AGT-01", name: "Meridian Concierge" },
    nba: {
      title: "Run the renewal outreach workflow",
      timestamp: "2h ago",
      rationale: "Usage grew 18% but three escalations are open and no proposal has been sent. The master agreement renews in 12 days.",
    },
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
    source: { label: "Salesforce", iconName: "Cloud" },
    tags: [
      { label: "Awaiting review", role: "signal", tone: "neutral", severity: 1, tooltip: "Governance addendum sent Aug 28 · no response due yet" },
      { label: "Person",          role: "classification" },
      { label: "Evaluator",       role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "10 facts", tooltip: "Verified facts · 5 on the Truth plane, 5 across Sandbox and Sources." },
      { iconName: "Inbox",       label: "1 open",   tooltip: "Open items · governance addendum awaiting her review." },
      { iconName: "Calendar",    label: "Since Jun", tooltip: "First interaction · June 9, 2026, via the account expansion." },
      { iconName: "Bot",         label: "Tier 1",   tooltip: "Assigned agent · Deal Concierge, tier 1. Handling this contact since Jun 9." },
    ],
    agent: { id: "AGT-02", name: "Deal Concierge" },
    nba: null,
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
    source: { label: "Workday", iconName: "Building" },
    tags: [
      { label: "Review overdue", role: "signal", tone: "alert", severity: 3, tooltip: "Mid-year review with Lisa Park since Aug 20 · 12 days open" },
      { label: "Employee",       role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "9 facts",   tooltip: "Verified facts · 5 on the Truth plane, 4 across Sandbox and Sources." },
      { iconName: "Inbox",       label: "1 open",    tooltip: "Open items · mid-year performance review awaiting approval." },
      { iconName: "KeyRound",    label: "Standard",  tooltip: "Access role · Standard, Operations scope. Unchanged since Aug 14." },
      { iconName: "Calendar",    label: "4y 8m",     tooltip: "Tenure · started Jan 12, 2022." },
      { iconName: "Bot",         label: "Tier 2",    tooltip: "Assigned agent · People Concierge, tier 2." },
    ],
    agent: { id: "AGT-03", name: "People Concierge" },
    nba: {
      title: "Escalate the overdue performance review",
      timestamp: "6h ago",
      rationale: "The mid-year review has sat with Lisa Park for 12 days and blocks his promotion cycle, which closes at the end of the month.",
    },
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
    source: { label: "Epic", iconName: "Cross" },
    tags: [
      { label: "Sync pending", role: "signal", tone: "alert", severity: 2, tooltip: "2 of 5 new clinic sites have not completed network sync" },
      { label: "Customer",     role: "classification" },
      { label: "Enterprise",   role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "11 facts",  tooltip: "Verified facts · 5 on the Truth plane, 6 across Sandbox and Sources." },
      { iconName: "MapPin",      label: "5 sites",   tooltip: "Locations · 5 clinics added under the Aug 30 expansion." },
      { iconName: "HardDrive",   label: "6 drives",  tooltip: "Source Drives · 6 attached, all syncing." },
      { iconName: "Bot",         label: "Tier 1",    tooltip: "Assigned agent · Northwind Concierge, tier 1." },
    ],
    agent: { id: "AGT-04", name: "Northwind Concierge" },
    nba: {
      title: "Finish network sync for two clinic sites",
      timestamp: "1d ago",
      rationale: "Two of the five clinics added on Aug 30 are still unsynced, so their staff cannot reach the platform and the expansion is not fully live.",
    },
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
    source: { label: "Salesforce", iconName: "Cloud" },
    tags: [
      { label: "Awaiting us", role: "signal", tone: "error", severity: 4, tooltip: "Migration timeline asked twice · still unanswered since Aug 18" },
      { label: "Person",      role: "classification" },
      { label: "Buyer",       role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "10 facts",  tooltip: "Verified facts · 5 on the Truth plane, 5 across Sandbox and Sources." },
      { iconName: "Inbox",       label: "1 open",    tooltip: "Open items · migration timeline request, unanswered for 15 days." },
      { iconName: "Briefcase",   label: "$480K",     tooltip: "Deal value · Enterprise Renewal 2026, closes Sep 5." },
      { iconName: "Bot",         label: "Tier 1",    tooltip: "Assigned agent · Deal Concierge, tier 1." },
    ],
    agent: { id: "AGT-02", name: "Deal Concierge" },
    nba: {
      title: "Send the migration timeline she asked for",
      timestamp: "30m ago",
      rationale: "She has raised it on the last two calls without a written answer, and she owns the budget line on a renewal that closes in 12 days.",
      variant: "accept",
    },
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
    source: { label: "Workday", iconName: "Building" },
    tags: [
      { label: "3 approvals due", role: "signal", tone: "alert", severity: 3, tooltip: "Oldest has been queued for 12 days" },
      { label: "Employee",        role: "classification" },
      { label: "Manager",         role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "9 facts",  tooltip: "Verified facts · 5 on the Truth plane, 4 across Sandbox and Sources." },
      { iconName: "Inbox",       label: "3 open",   tooltip: "Open items · 3 reviews queued for her approval." },
      { iconName: "Users",       label: "9 reports", tooltip: "Direct reports · 9 across Operations." },
      { iconName: "KeyRound",    label: "Manager",  tooltip: "Access role · Manager, Operations scope." },
    ],
    agent: { id: "AGT-03", name: "People Concierge" },
    nba: {
      title: "Clear the three reviews in her queue",
      timestamp: "4h ago",
      rationale: "Three reviews are waiting on her approval and the oldest has been open 12 days, which is holding up two promotion cycles.",
    },
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
    source: { label: "Salesforce", iconName: "Cloud" },
    tags: [
      { label: "Person",    role: "classification" },
      { label: "Technical", role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "10 facts", tooltip: "Verified facts · 5 on the Truth plane, 5 across Sandbox and Sources." },
      { iconName: "CheckCheck",  label: "Cleared",  tooltip: "Reviews · signed off SSO and data residency in July. Nothing open." },
      { iconName: "Bot",         label: "Tier 1",   tooltip: "Assigned agent · Deal Concierge, tier 1." },
    ],
    agent: { id: "AGT-02", name: "Deal Concierge" },
    nba: null,
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
    stateBadge: { label: "Dormant", variant: "alert" },
    source: { label: "HubSpot", iconName: "Magnet" },
    tags: [
      { label: "80d no contact", role: "signal", tone: "error", severity: 4, tooltip: "Last interaction Jun 14, when the pilot closed" },
      { label: "Inactive",       role: "signal", tone: "neutral", severity: 1, tooltip: "Lifecycle · moved to inactive Jul 1" },
      { label: "Customer",       role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "11 facts", tooltip: "Verified facts · 5 on the Truth plane, 6 across Sandbox and Sources." },
      { iconName: "CircleCheck", label: "Pilot ok", tooltip: "Pilot outcome · completed Jun 14 with all success criteria met." },
      { iconName: "Bot",         label: "Tier 3",   tooltip: "Assigned agent · Kestrel Concierge, tier 3 since the account went dormant." },
    ],
    agent: { id: "AGT-05", name: "Kestrel Concierge" },
    nba: {
      title: "Open a re-engagement on the closed pilot",
      timestamp: "3d ago",
      rationale: "The pilot met every success criterion and then contact stopped without a churn signal, which usually means a sponsor change rather than a loss.",
    },
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
    source: { label: "Workday", iconName: "Building" },
    tags: [
      { label: "Employee", role: "classification" },
      { label: "Manager",  role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "9 facts",  tooltip: "Verified facts · 5 on the Truth plane, 4 across Sandbox and Sources." },
      { iconName: "CheckCheck",  label: "Cleared",  tooltip: "Approval queue · cleared Aug 27, nothing pending." },
      { iconName: "FileCheck2",  label: "12 of 12", tooltip: "Policies signed · all 12, latest Data Handling v2.1." },
      { iconName: "KeyRound",    label: "Exec",     tooltip: "Access role · Executive, Operations scope." },
    ],
    agent: { id: "AGT-03", name: "People Concierge" },
    nba: null,
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
    stateBadge: { label: "Superseded", variant: "neutral" },
    source: { label: "Salesforce", iconName: "Cloud" },
    tags: [
      { label: "Inactive", role: "signal", tone: "neutral", severity: 1, tooltip: "Lifecycle · marked inactive Apr 3" },
      { label: "Person",   role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "10 facts",  tooltip: "Verified facts · 5 on the Truth plane, 5 across Sandbox and Sources." },
      { iconName: "FileText",    label: "2024 MSA",  tooltip: "Contract history · approved the original Meridian agreement in 2024." },
      { iconName: "UserRound",   label: "S. Torres", tooltip: "Superseded by · Sandra Torres, finance approvals since April." },
    ],
    agent: { id: "AGT-02", name: "Deal Concierge" },
    nba: null,
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
    stateBadge: { label: "Under review", variant: "informative" },
    source: { label: "NetSuite", iconName: "Boxes" },
    tags: [
      { label: "2 checks open", role: "signal", tone: "alert", severity: 2, tooltip: "Network segmentation evidence and sub-processor list · target Sep 12" },
      { label: "Customer",      role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "11 facts", tooltip: "Verified facts · 5 on the Truth plane, 6 across Sandbox and Sources." },
      { iconName: "ClipboardList", label: "4 of 6", tooltip: "Security review · 4 of 6 checks cleared, target Sep 12." },
      { iconName: "HardDrive",   label: "6 drives", tooltip: "Source Drives · 6 attached, 1 failing to sync." },
      { iconName: "Bot",         label: "Tier 2",   tooltip: "Assigned agent · Halden Concierge, tier 2." },
    ],
    agent: { id: "AGT-06", name: "Halden Concierge" },
    nba: {
      title: "Send the two open security-review items",
      timestamp: "1d ago",
      rationale: "Four of six checks have cleared and the remaining two sit with Halden, who have answered every prior request within two business days.",
    },
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
    source: { label: "NetSuite", iconName: "Boxes" },
    tags: [
      { label: "Owns 2 blockers", role: "signal", tone: "alert", severity: 3, tooltip: "Network segmentation evidence and sub-processor list · target Sep 12" },
      { label: "Person",         role: "classification" },
      { label: "Technical",      role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "10 facts", tooltip: "Verified facts · 5 on the Truth plane, 5 across Sandbox and Sources." },
      { iconName: "Inbox",       label: "2 open",   tooltip: "Open items · both remaining security-review checks." },
      { iconName: "Clock",       label: "2d reply", tooltip: "Responsiveness · has answered every prior request within two business days." },
      { iconName: "Bot",         label: "Tier 2",   tooltip: "Assigned agent · Halden Concierge, tier 2." },
    ],
    agent: { id: "AGT-06", name: "Halden Concierge" },
    nba: {
      title: "Send Tomás the remaining checklist items",
      timestamp: "1d ago",
      rationale: "He owns both open checks and replies within two business days, so a checklist is likely enough to close the review before Sep 12.",
      variant: "accept",
    },
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
    source: { label: "Workday", iconName: "Building" },
    tags: [
      { label: "Employee", role: "classification" },
      { label: "Revenue",  role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "9 facts",  tooltip: "Verified facts · 5 on the Truth plane, 4 across Sandbox and Sources." },
      { iconName: "Briefcase",   label: "2 accts",  tooltip: "Owned accounts · Halden Manufacturing and Kestrel Logistics." },
      { iconName: "KeyRound",    label: "Standard", tooltip: "Access role · Standard, Revenue scope." },
      { iconName: "Calendar",    label: "4y 8m",    tooltip: "Tenure · started Jan 12, 2022." },
    ],
    agent: { id: "AGT-03", name: "People Concierge" },
    nba: null,
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
    source: { label: "Epic", iconName: "Cross" },
    tags: [
      { label: "Sponsor",  role: "classification" },
      { label: "Person",   role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "10 facts", tooltip: "Verified facts · 5 on the Truth plane, 5 across Sandbox and Sources." },
      { iconName: "MapPin",      label: "5 sites",  tooltip: "Sponsored expansion · 5 clinic sites signed Aug 30." },
      { iconName: "Bot",         label: "Tier 1",   tooltip: "Assigned agent · Northwind Concierge, tier 1." },
    ],
    agent: { id: "AGT-04", name: "Northwind Concierge" },
    nba: null,
    aiSummary: {
      headline: "Executive sponsor of the expansion.",
      detail: "Grace drove the five-clinic expansion internally and signed without a discount request. Two clinics still need network sync — an onboarding task her team can close.",
      confidence: 87,
    },
    governance: "loaded", risk: "empty", connections: "loaded",
  },
  {
    id: "ORG-0067", type: "company", name: "Riverbend Auto Group",
    subtitle: "Automotive Retail · 640 employees · Tampa, FL",
    email: "ops@riverbendauto.com", phone: "+1 (813) 555-0164", company: "Riverbend Auto Group",
    owner: "Daniel Ruiz", status: "Active", lastInteraction: "Sep 1, 2026",
    source: { label: "CDK Global", iconName: "Car" },
    tags: [
      { label: "Service backlog", role: "signal", tone: "alert", severity: 2, tooltip: "41 repair orders open past their promised date across 4 stores" },
      { label: "Customer",        role: "classification" },
      { label: "Multi-site",     role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "11 facts",  tooltip: "Verified facts · 5 on the Truth plane, 6 across Sandbox and Sources." },
      { iconName: "Store",       label: "4 stores",  tooltip: "Locations · 4 dealerships under one master agreement." },
      { iconName: "Wrench",      label: "41 open",   tooltip: "Open repair orders · 41 past their promised date, oldest 9 days." },
      { iconName: "Bot",         label: "Tier 1",    tooltip: "Assigned agent · Riverbend Concierge, tier 1." },
    ],
    agent: { id: "AGT-07", name: "Riverbend Concierge" },
    nba: {
      title: "Rebalance the service load across four stores",
      timestamp: "5h ago",
      rationale: "Tampa North holds 26 of the 41 late repair orders while Brandon runs at 60% bay capacity, so the backlog is routing, not headcount.",
    },
    aiSummary: {
      headline: "Healthy group, one store carrying the backlog.",
      detail: "Riverbend runs four dealerships on one master agreement. Tampa North holds 26 of the 41 late repair orders while Brandon sits at 60% bay capacity — the backlog is a routing problem, not a staffing one, and it is the only thing hurting CSI scores this quarter.",
      confidence: 79,
    },
    governance: "loaded", risk: "loaded", connections: "loaded",
  },
  {
    id: "PER-0158", type: "person", name: "Marcus Delgado",
    subtitle: "Fixed Operations Director · Riverbend Auto Group",
    email: "marcus.delgado@riverbendauto.com", phone: "+1 (813) 555-0171", company: "Riverbend Auto Group",
    owner: "Daniel Ruiz", status: "Active", lastInteraction: "Sep 1, 2026",
    source: { label: "CDK Global", iconName: "Car" },
    tags: [
      { label: "Owns the backlog", role: "signal", tone: "alert", severity: 3, tooltip: "Accountable for service throughput across all four stores" },
      { label: "Customer",         role: "classification" },
      { label: "Operator",        role: "classification" },
    ],
    meta: [
      { iconName: "ShieldCheck", label: "10 facts", tooltip: "Verified facts · 5 on the Truth plane, 5 across Sandbox and Sources." },
      { iconName: "Wrench",      label: "41 open",  tooltip: "Open repair orders · every one of them rolls up to him." },
      { iconName: "Clock",       label: "Same day", tooltip: "Responsiveness · replies same day, and prefers a phone call to email." },
      { iconName: "Bot",         label: "Tier 1",   tooltip: "Assigned agent · Riverbend Concierge, tier 1." },
    ],
    agent: { id: "AGT-07", name: "Riverbend Concierge" },
    nba: {
      title: "Walk Marcus through the routing proposal",
      timestamp: "5h ago",
      rationale: "He owns service throughput for all four stores and replies same day, so the rebalance needs his sign-off before it reaches store managers.",
      variant: "accept",
    },
    aiSummary: {
      headline: "Accountable for the one metric that is slipping.",
      detail: "Marcus owns service throughput across all four Riverbend stores, which makes him the decision point on the backlog. He replies same day and prefers a call to email — the routing proposal should reach him by phone, not in writing.",
      confidence: 81,
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
