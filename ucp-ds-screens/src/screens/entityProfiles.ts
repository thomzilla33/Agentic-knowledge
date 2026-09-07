/**
 * Per-type profile specs — what a Unified Profile looks like for each published
 * entity type.
 *
 * ── The question this answers ─────────────────────────────────────────────
 * CLAUDE.md says an entity detail page carries "[Entity-specific tabs] → vary by
 * entity type (e.g. Runs, Members, Triggers, Settings)". The UCP prototype has
 * four generic ones. With one type that was fine; with twelve it becomes the
 * question of WHO decides a vehicle's tabs.
 *
 * The answer that holds is: the MODEL does — the same place the fields come
 * from. Data Studio already owns the entity's columns, relationships,
 * permissions and API endpoints. A tab strip authored anywhere else would be a
 * second definition of the same entity, drifting from the first.
 *
 * ── The spine is universal, the extension is not ──────────────────────────
 * Four tabs are the same on every type, and not by convention — they are about
 * KNOWLEDGE, not about the thing:
 *
 *   Overview   the canvas       — what should I look at
 *   Snapshot   Truth/Sandbox/Sources — what do we know, and how sure
 *   Activity   the timeline     — what happened
 *   Drives     Source Drives    — what documents back it
 *
 * Every entity in a knowledge platform has all four, because every entity is
 * ingested, claimed about, interacted with and documented. A vehicle has facts
 * and a paper trail exactly like a customer does.
 *
 * What the model adds on top is the domain: a vehicle gets Service history, a
 * dealership gets Inventory and Staff. Those cannot be generic, and they are the
 * only part of the profile a new type has to bring with it.
 */

export interface ProfileField {
  label:    string
  iconName: string
  value:    string
  /** Source system for this field — provenance is per field, not per record. */
  system:   string
  /**
   * Scope that governs this field. Whether it reads as masked is derived from
   * the viewer's scopes rather than declared, so granting the scope unmasks
   * the header and the Overview widget in the same breath instead of only one.
   */
  scope?:   string
}

/**
 * The one place that answers "can this viewer read this value?". Header fields
 * and widget rows both go through it, which is what keeps them from disagreeing
 * about the same number.
 */
export function isMasked(scope: string | undefined, viewerScopes: readonly string[]): boolean {
  return !!scope && !viewerScopes.includes(scope)
}

export interface ProfileWidgetRow {
  label:   string
  value:   string
  icon:    string
  variant: "success" | "alert" | "informative" | "neutral"
  /**
   * Scope that governs this value, if any. A widget row is a governed value
   * like any other: the header masks List price behind finance.read, so the
   * Overview widget one screen below has to mask it too, or the header's
   * governance is decoration. Same value, one answer.
   */
  scope?:  string
}

export interface ProfileWidget {
  uid:   string
  title: string
  rows:  ProfileWidgetRow[]
}

export interface EntityProfileSpec {
  /** Beyond the universal four. Authored by the model, not by the screen. */
  extraTabs: { id: string; label: string }[]
  widgets:   ProfileWidget[]
}

/**
 * Keyed by registry type id. A type with no entry still gets a valid profile —
 * the four universal tabs and no domain widgets — which is what makes publishing
 * a type cost nothing: the profile exists the moment the type does, and the
 * domain detail arrives later without blocking it.
 */
export const PROFILE_SPECS: Record<string, EntityProfileSpec> = {
  customer: {
    extraTabs: [{ id: "deals", label: "Deals" }],
    widgets: [
      { uid: "risk", title: "Risk", rows: [
        { label: "Risk score",  value: "18 / 100",   icon: "TrendingDown", variant: "success" },
        { label: "Open flags",  value: "0",          icon: "Flag",         variant: "neutral" },
        { label: "Last scan",   value: "Aug 27, 2026", icon: "ScanLine",   variant: "informative" },
      ]},
      { uid: "engagement", title: "Engagement", rows: [
        { label: "Touchpoints, 90d", value: "14",        icon: "MessageSquare", variant: "informative" },
        { label: "Last contact",     value: "Sep 2, 2026", icon: "Clock",       variant: "success" },
        { label: "Response time",    value: "4h median",  icon: "Timer",        variant: "success" },
      ]},
    ],
  },
  employee: {
    extraTabs: [{ id: "reviews", label: "Reviews" }, { id: "access", label: "Access" }],
    widgets: [
      { uid: "governance", title: "Governance", rows: [
        { label: "Policies signed",  value: "12 of 12",   icon: "FileCheck",    variant: "success" },
        { label: "Open reviews",     value: "1",          icon: "ClipboardList", variant: "alert" },
        { label: "Training current", value: "Yes",        icon: "GraduationCap", variant: "success" },
      ]},
      { uid: "access", title: "Access", rows: [
        { label: "Systems", value: "7 granted",    icon: "KeyRound",  variant: "informative" },
        { label: "Scopes",  value: "hr.read +2",   icon: "ShieldCheck", variant: "neutral" },
        { label: "Last review", value: "Aug 10, 2026", icon: "Calendar", variant: "success" },
      ]},
    ],
  },
  company: {
    extraTabs: [{ id: "contacts", label: "Contacts" }, { id: "contracts", label: "Contracts" }],
    widgets: [
      { uid: "risk", title: "Risk", rows: [
        { label: "Risk score", value: "31 / 100",  icon: "TrendingUp", variant: "alert" },
        { label: "Open flags", value: "2",         icon: "Flag",       variant: "alert" },
        { label: "Security review", value: "4 of 6", icon: "ClipboardList", variant: "alert" },
      ]},
    ],
  },
  vehicle: {
    // Nothing generic could have produced these. This is the part the model has
    // to bring, and the reason a type is more than a label.
    extraTabs: [{ id: "service", label: "Service history" }, { id: "ownership", label: "Ownership" }],
    widgets: [
      { uid: "condition", title: "Condition", rows: [
        { label: "Odometer",     value: "14,208 mi",  icon: "Gauge",       variant: "informative" },
        { label: "Open work orders", value: "1",      icon: "Wrench",      variant: "alert" },
        { label: "Last service", value: "Aug 30, 2026", icon: "Calendar",  variant: "success" },
        { label: "Warranty",     value: "Active to 2029", icon: "ShieldCheck", variant: "success" },
      ]},
      { uid: "commercial", title: "Commercial", rows: [
        { label: "List price",   value: "$58,400",    icon: "DollarSign",  variant: "informative", scope: "finance.read" },
        { label: "Days on lot",  value: "23",         icon: "Clock",       variant: "alert" },
        { label: "Floor plan",   value: "Financed",   icon: "Banknote",    variant: "neutral" },
      ]},
    ],
  },
  dealership: {
    extraTabs: [{ id: "inventory", label: "Inventory" }, { id: "staff", label: "Staff" }],
    widgets: [
      { uid: "operations", title: "Operations", rows: [
        { label: "Vehicles on lot", value: "412",      icon: "Car",        variant: "informative" },
        { label: "Bays occupied",   value: "9 of 12",  icon: "Wrench",     variant: "alert" },
        { label: "Service backlog", value: "2.4 days", icon: "Timer",      variant: "alert" },
      ]},
      { uid: "governance", title: "Governance", rows: [
        { label: "Licenses current", value: "Yes",     icon: "FileCheck",  variant: "success" },
        { label: "Open audits",      value: "1",       icon: "ClipboardList", variant: "alert" },
      ]},
    ],
  },
}

/** The four every type carries, in this order. Never authored per type. */
export const UNIVERSAL_TABS = [
  { id: "overview", label: "Overview" },
  { id: "snapshot", label: "Snapshot" },
  { id: "activity", label: "Activity" },
  { id: "drives",   label: "Drives"   },
] as const

export function tabsForType(typeId: string) {
  // Domain tabs sit between the canvas and the knowledge planes: after "what
  // should I look at", before "how do we know". A vehicle's service history is
  // closer to its overview than to its provenance.
  const spec = PROFILE_SPECS[typeId]
  return [
    UNIVERSAL_TABS[0],
    ...(spec?.extraTabs ?? []),
    UNIVERSAL_TABS[1], UNIVERSAL_TABS[2], UNIVERSAL_TABS[3],
  ]
}
