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
 * A saved view: a filter over the workspace, given a name.
 *
 * This is the load-bearing idea. "Customers" was a tab because there were three
 * types and tabs were cheap; at twelve it stops being navigation and becomes an
 * arbitrary eight-of-twelve. A view answers "where am I?" honestly — I am in MY
 * view — and it is bounded by a person's attention rather than by the tenant's
 * schema.
 *
 * `types: []` means every readable type: a genuinely cross-type view, which a
 * tab strip cannot express at all.
 */
export interface SavedView {
  id:      string
  label:   string
  types:   string[]
  /** Set when the platform generated it from a type rather than a person saving it. */
  derived?: boolean
  hint?:   string
}

/**
 * What a viewer lands on. The first three are pinned by this person; the rest
 * are generated one-per-readable-type, so a tenant that has published only
 * three types sees exactly what the tab strip showed before — no migration, no
 * regression, and the change only becomes visible once it is needed.
 */
export const SAVED_VIEWS: SavedView[] = [
  { id: "my-open",     label: "My open work",     types: [],                        hint: "Everything assigned to me, any type" },
  { id: "riverbend",   label: "Riverbend",        types: ["vehicle", "dealership", "customer"], hint: "One account, across three types" },
  { id: "needs-nba",   label: "Needs a decision", types: [],                        hint: "Records with a Next Best Action" },
  ...ENTITY_TYPES.filter(isReadable).map(t => ({
    id: `type-${t.id}`, label: t.label, types: [t.id], derived: true,
  })),
]
