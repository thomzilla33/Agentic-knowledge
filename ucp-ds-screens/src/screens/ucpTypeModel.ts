/**
 * The per-type model for the UCP — what a Customer, an Employee and a Company
 * each publish, read by both surfaces: the profile takes its tabs and its own
 * Overview widget from here, the roster takes its filter facets.
 *
 * One module for both because they are one fact. A type that publishes a
 * Department field should be filterable by it and should show it on the record;
 * splitting that across two files is how the list and the profile end up
 * disagreeing about what a type is.
 *
 * ── Ported from the entity-workspace experiment ───────────────────────────
 * The experiment's central claim was that a profile should be driven by the
 * MODEL rather than by the screen: the same code renders a vehicle and a
 * customer, and they differ only in what their type published. That claim does
 * not need twelve types to be worth having — it is already true of three.
 *
 * The evidence was sitting in the fixtures the whole time. `UcpContact.subtitle`
 * is documented as "role · department, or industry · size · HQ", which is three
 * different field sets wearing one string:
 *
 *   Customer   Head of Compliance · Legal · Meridian Corp
 *   Employee   Account Director · Revenue · Chicago, IL
 *   Company    Automotive Retail · 640 employees · Tampa, FL
 *
 * Flattening those into one metadata line was the screen deciding that every
 * type has the same shape. It does not. This gives each type back its own
 * fields and, where the data supports it, its own tab.
 *
 * ── The spine stays universal ─────────────────────────────────────────────
 * Overview · Snapshot · Activity · Drives are the same on every type, because
 * they are about KNOWLEDGE rather than about the thing: every record is
 * ingested, claimed about, interacted with and documented. What the type adds
 * is the domain.
 *
 * ── A type with nothing to add still renders ──────────────────────────────
 * Customer and Employee get no extra tab, and that asymmetry is the point
 * rather than an omission: a company's roster of people is real data the
 * fixtures already carry, and a customer has no equivalent. Inventing one to
 * make the three types symmetric would be the screen deciding the model's
 * shape again, in the other direction.
 */

import type { UcpContact } from "./ucpShared"

export interface ProfileWidgetRow {
  label:   string
  value:   string
  icon:    string
  variant: "success" | "alert" | "informative" | "neutral"
}

export interface UcpProfileSpec {
  /** Beyond the universal four. Empty when the type has nothing to add. */
  extraTabs: { id: string; label: string }[]
  /** The type's own Overview widget — the fields only this type carries. */
  widget:    { uid: string; title: string; rows: ProfileWidgetRow[] }
}

/**
 * Split `subtitle` without assuming how many parts it has. Person subtitles
 * carry two in some fixtures and three in others — "VP of Operations ·
 * Meridian Corp" against "Head of Compliance · Legal · Meridian Corp" — so a
 * positional read would silently label a company as a department.
 */
function parts(c: UcpContact): string[] {
  return c.subtitle.split("·").map(s => s.trim()).filter(Boolean)
}

export function specForContact(c: UcpContact): UcpProfileSpec {
  const p = parts(c)

  if (c.type === "company") {
    const [industry, headcount, hq] = p
    return {
      extraTabs: [{ id: "people", label: "People" }],
      widget: {
        uid: "organization", title: "Organization",
        rows: [
          { label: "Industry",     value: industry  ?? "—", icon: "Factory",   variant: "informative" },
          { label: "Headcount",    value: headcount ?? "—", icon: "Users",     variant: "neutral" },
          { label: "Headquarters", value: hq        ?? "—", icon: "MapPin",    variant: "neutral" },
          { label: "Account owner", value: c.owner,         icon: "UserRound", variant: "informative" },
        ],
      },
    }
  }

  if (c.type === "employee") {
    const [role, department, location] = p
    return {
      extraTabs: [],
      widget: {
        uid: "employment", title: "Employment",
        rows: [
          { label: "Role",       value: role       ?? "—", icon: "BriefcaseBusiness", variant: "informative" },
          { label: "Department", value: department ?? "—", icon: "Building2",         variant: "neutral" },
          { label: "Location",   value: location   ?? "—", icon: "MapPin",            variant: "neutral" },
          { label: "Manager",    value: c.owner,           icon: "UserRound",         variant: "informative" },
        ],
      },
    }
  }

  // Customer. The last part is the account; anything between it and the role is
  // the department, which only some records carry.
  const role    = p[0] ?? "—"
  const account = p.length > 1 ? p[p.length - 1] : c.company
  const dept    = p.length > 2 ? p[1] : undefined
  const rows: ProfileWidgetRow[] = [
    { label: "Role",    value: role,    icon: "BriefcaseBusiness", variant: "informative" },
    { label: "Account", value: account, icon: "Building2",         variant: "neutral" },
  ]
  if (dept) rows.push({ label: "Department", value: dept, icon: "Users", variant: "neutral" })
  rows.push({ label: "Account owner", value: c.owner, icon: "UserRound", variant: "informative" })

  return { extraTabs: [], widget: { uid: "account", title: "Account", rows } }
}

/**
 * The full tab strip: the universal spine with the type's own tabs slotted
 * between Overview and Snapshot. Domain tabs sit next to Overview because they
 * answer "what is this thing"; the knowledge tabs that follow answer "what do
 * we know about it", and that order is the same on every type.
 */
export function tabsForContact(c: UcpContact): { id: string; label: string }[] {
  return [
    { id: "overview", label: "Overview" },
    ...specForContact(c).extraTabs,
    { id: "snapshot", label: "Snapshot" },
    { id: "activity", label: "Activity" },
    { id: "drives",   label: "Drives"   },
  ]
}

/**
 * What the agent trigger should say. The component's default takes the first
 * token of the name, which identifies a person and misreads an organisation —
 * "Ask about Riverbend" for Riverbend Auto Group is close enough to be
 * confusing, and it is the account's name doing work the record's name should.
 * Companies get the type instead; people keep their first name, which is what
 * you would actually say out loud.
 */
export function assistantLabelFor(c: UcpContact): string | undefined {
  return c.type === "company" ? "Ask about this company" : undefined
}

// ── Filter facets, published by the type ─────────────────────────────────────

/**
 * A facet the roster can filter on. `inline` earns a slot in the visible filter
 * line rather than a row behind All filters, and the criterion is frequency —
 * FILTERS_SPEC's own rule for what stays out of the slideout.
 */
export interface UcpFacet {
  id:      string
  label:   string
  inline?: boolean
}

/**
 * Facets per tab. The All tab gets the common floor rather than the union,
 * because a facet that only some rows can answer filters the rest out by
 * accident: filtering a mixed list by Department would silently drop every
 * customer and company, which reads as "no results" rather than "not
 * applicable". Microsoft derives the same restriction for Dataverse's mixed
 * search, and it is the one place the union is the wrong answer.
 */
const FACETS: Record<string, UcpFacet[]> = {
  all: [
    { id: "status", label: "Status", inline: true },
    { id: "owner",  label: "Owner",  inline: true },
    { id: "source", label: "Source" },
  ],
  person: [
    { id: "status",  label: "Status",  inline: true },
    { id: "account", label: "Account", inline: true },
    { id: "owner",   label: "Owner" },
    { id: "source",  label: "Source" },
  ],
  employee: [
    { id: "status",     label: "Status",     inline: true },
    { id: "department", label: "Department", inline: true },
    { id: "location",   label: "Location" },
    { id: "owner",      label: "Manager" },
    { id: "source",     label: "Source" },
  ],
  company: [
    { id: "status",   label: "Status",       inline: true },
    { id: "industry", label: "Industry",     inline: true },
    { id: "hq",       label: "Headquarters" },
    { id: "owner",    label: "Account owner" },
    { id: "source",   label: "Source" },
  ],
}

export function facetsForType(type: string): UcpFacet[] {
  return FACETS[type] ?? FACETS.all
}

/**
 * This record's value for a facet, or "" when the type does not carry it.
 * Reading it off the same `subtitle` split the profile uses is deliberate: one
 * parser, so a record cannot be filed under a Department the profile never
 * shows.
 */
export function facetValue(c: UcpContact, facetId: string): string {
  const p = parts(c)
  switch (facetId) {
    case "status":  return c.status
    case "owner":   return c.owner
    case "source":  return c.source.label
    case "account": return p.length > 1 ? p[p.length - 1] : c.company
    case "department": return c.type === "employee" ? (p[1] ?? "") : ""
    case "location":   return c.type === "employee" ? (p[2] ?? "") : ""
    case "industry":   return c.type === "company"  ? (p[0] ?? "") : ""
    case "hq":         return c.type === "company"  ? (p[2] ?? "") : ""
    default: return ""
  }
}

/** Every value a facet actually takes across a set of records, sorted. */
export function facetOptions(rows: UcpContact[], facetId: string): string[] {
  return Array.from(new Set(rows.map(c => facetValue(c, facetId)).filter(Boolean))).sort()
}
