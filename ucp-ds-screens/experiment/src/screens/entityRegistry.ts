/**
 * Entity type registry — the experiment behind `pm-thomas-entity-workspace.tsx`.
 *
 * This file exists to answer one question: what happens to the roster when a
 * tenant publishes not three entity types but forty.
 *
 * ── Where these come from ─────────────────────────────────────────────────
 * Nothing here is invented. Data Studio → Models is the source of truth for
 * entity types: a model (`crm_core`) holds entities (`account`), each with a
 * field count, a governance status, permissions and a physical table, authored
 * through AI Assist and then PUBLISHED. So the shape below is the shape the
 * platform already has — this registry is the read-only projection of it that a
 * record surface needs, not a second definition of it.
 *
 * `model` is kept as the grouping because it is the schema's own grouping, and
 * it already carries governance. OPEN QUESTION for Michael: whether Model is
 * allowed to surface here at all, or whether it stays a Data Studio concept and
 * the record surface groups by the model's Category instead.
 *
 * ── Why a registry rather than a union type ───────────────────────────────
 * The moment types are tenant-defined, any `type: "person" | "employee"` in the
 * UI is a lie with a compile step. RecordHeader already made this call in its
 * agnosticism pass — "this file never enumerates entity types" — and a roster
 * that enumerates them contradicts the component it renders.
 */

export interface EntityTypeDef {
  id:        string
  /** Plural, as it appears in navigation. The tenant's word, not ours. */
  label:     string
  singular:  string
  iconName:  string
  /** Data Studio model this entity belongs to — the schema's own grouping. */
  model:     string
  /** Straight from the entity card in Data Studio. */
  governance: "governed" | "in review" | "draft"
  fields:    number
  records:   number
  /**
   * Scope the viewer needs. Undefined = readable by anyone with record access.
   * Same mechanism as the record-level gate: decided by the session against the
   * type, never a flag meaning "hidden".
   */
  requiredScope?: string
}

export const MODEL_LABEL: Record<string, string> = {
  crm_core:        "CRM Core",
  people_ops:      "People Ops",
  dealership_ops:  "Dealership Ops",
  finance_core:    "Finance Core",
  compliance:      "Compliance",
}

/**
 * Twelve published types across five models. Deliberately more than fits in a
 * tab strip, and deliberately uneven: some carry thousands of records, some
 * carry none yet, one is still in draft, and two are governed by a scope this
 * viewer does not hold. A registry that is uniform proves nothing.
 */
export const ENTITY_TYPES: EntityTypeDef[] = [
  { id: "customer",    label: "Customers",     singular: "Customer",     iconName: "UserRound",     model: "crm_core",       governance: "governed",  fields: 34, records: 1284 },
  { id: "company",     label: "Companies",     singular: "Company",      iconName: "Building2",     model: "crm_core",       governance: "governed",  fields: 28, records: 312 },
  { id: "deal",        label: "Deals",         singular: "Deal",         iconName: "Handshake",     model: "crm_core",       governance: "governed",  fields: 22, records: 96 },
  { id: "employee",    label: "Employees",     singular: "Employee",     iconName: "IdCard",        model: "people_ops",     governance: "governed",  fields: 41, records: 1600 },
  { id: "team",        label: "Teams",         singular: "Team",         iconName: "Users",         model: "people_ops",     governance: "governed",  fields: 12, records: 88 },
  { id: "vehicle",     label: "Vehicles",      singular: "Vehicle",      iconName: "Car",           model: "dealership_ops", governance: "governed",  fields: 47, records: 3810 },
  { id: "dealership",  label: "Dealerships",   singular: "Dealership",   iconName: "Store",         model: "dealership_ops", governance: "governed",  fields: 31, records: 24 },
  { id: "test-drive",  label: "Test drives",   singular: "Test drive",   iconName: "Route",         model: "dealership_ops", governance: "in review", fields: 15, records: 210 },
  { id: "trade-in",    label: "Trade-ins",     singular: "Trade-in",     iconName: "Repeat",        model: "dealership_ops", governance: "draft",     fields: 9,  records: 0   },
  { id: "invoice",     label: "Invoices",      singular: "Invoice",      iconName: "Receipt",       model: "finance_core",   governance: "governed",  fields: 26, records: 4402, requiredScope: "finance.read" },
  { id: "payout",      label: "Payouts",       singular: "Payout",       iconName: "Banknote",      model: "finance_core",   governance: "governed",  fields: 18, records: 970,  requiredScope: "finance.read" },
  { id: "policy",      label: "Policies",      singular: "Policy",       iconName: "ShieldCheck",   model: "compliance",     governance: "governed",  fields: 14, records: 57  },
]

/** The scopes the signed-in viewer holds — same set the record surface uses. */
export const VIEWER_SCOPES: readonly string[] = ["contacts.read", "hr.read", "drives.read"]

export function isReadable(t: EntityTypeDef): boolean {
  return !t.requiredScope || VIEWER_SCOPES.includes(t.requiredScope)
}

/**
 * Order the viewer has actually touched these types, most recent first. Types
 * absent from the list have never been opened.
 *
 * Research-driven. No documented platform groups entity types by their schema
 * namespace for end users: Dataverse orders its result tabs by relevance of the
 * results rather than by any fixed taxonomy, Salesforce puts a flat searchable
 * "All Items" above its per-app grouping, and HubSpot does not group at all.
 * Grouping by model was inventing a pattern. Usage and a searchable name are the
 * two axes with support.
 *
 * Menu BREADTH also turned out to matter more than label quality: broad,
 * well-labelled menus dropped fallback-to-search to under 10%, narrow ones
 * pushed it to about 40%. So the catalog is one flat list, not five collapsed
 * groups — and the model stays on the row as metadata, where it is still
 * findable by search without becoming the structure.
 */
export const RECENTLY_USED: string[] = ["customer", "vehicle", "dealership", "employee", "company"]

export function byUsage(a: EntityTypeDef, b: EntityTypeDef): number {
  const ia = RECENTLY_USED.indexOf(a.id)
  const ib = RECENTLY_USED.indexOf(b.id)
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  return b.records - a.records
}

/**
 * Saved views, scoped to ONE type.
 *
 * This is the correction. The earlier draft put cross-type views on the primary
 * tab strip; prior art does not support that. HubSpot's saved views ARE the
 * index-page tabs — configurable per object — but always within a type, never as
 * the top level. Carbon sanctions user-curated tabs "to focus a specific data
 * set or search results" and in the same breath says "Do not use as navigation"
 * and "Do not use when tabs contain frequently used or critical information".
 * Both halves land: views-as-tabs is right, views-as-the-way-you-change-type is
 * not.
 *
 * `type: null` means the view belongs to the Inbox instead — see INBOX_VIEWS.
 */
export interface SavedView {
  id:    string
  label: string
  type:  string | null
  hint?: string
}

/** Every type gets a default view, so a type is never a blank tab strip. */
export function viewsForType(typeId: string): SavedView[] {
  const base: SavedView = { id: `${typeId}-all`, label: "All", type: typeId }
  const extra: Record<string, SavedView[]> = {
    customer:   [{ id: "cust-mine", label: "Mine",          type: "customer",   hint: "Accounts I own" },
                 { id: "cust-nba",  label: "Needs a decision", type: "customer" }],
    vehicle:    [{ id: "veh-service", label: "In service",  type: "vehicle" },
                 { id: "veh-mine",    label: "My stores",   type: "vehicle" }],
    employee:   [{ id: "emp-mine",  label: "My team",       type: "employee" }],
    dealership: [{ id: "dlr-review", label: "Under review", type: "dealership" }],
  }
  return [base, ...(extra[typeId] ?? [])]
}

/**
 * The Inbox — the one place a mixed-type list is defensible.
 *
 * Prior art puts every heterogeneous surface behind SEARCH, deliberately
 * degraded: Dataverse caps the mixed grid at six columns, drops sort, and offers
 * only the three facets that exist on every type (Owner, Modified On, Created
 * On). A mixed surface is for FINDING, not for working — which is why the roster
 * went back to one type at a time.
 *
 * What prior art could not weigh is that this platform has a Next Best Action.
 * "What needs a decision" is cross-type by nature and is an inbox by nature, so
 * it gets the one role the evidence does concede to a mixed list — and it lives
 * under My Work in the sidebar, away from the roster, rather than pretending to
 * be the door to it.
 *
 * The columns it can show are declared, not discovered. See INBOX_COLUMNS.
 */
export const INBOX_VIEWS: SavedView[] = [
  { id: "inbox-nba",  label: "Needs a decision", type: null, hint: "Records where an agent has proposed something" },
  { id: "inbox-mine", label: "Assigned to me",   type: null, hint: "Everything I own, any type" },
]

/**
 * The fields every published type is guaranteed to carry, and therefore the only
 * ones a mixed list may show. Declared here rather than derived per query, so
 * that adding a type cannot silently empty a column — which is the failure mode
 * behind Dataverse's three-facet floor.
 */
export const INBOX_COLUMNS = ["Type", "Record", "Owner", "State", "Last activity"] as const
