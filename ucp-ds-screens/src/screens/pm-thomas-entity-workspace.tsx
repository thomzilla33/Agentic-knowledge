/**
 * Entity Workspace — the scaling experiment, revised against prior art.
 *
 * SIDE-BY-SIDE WITH THE APPROVED VERSION. Both cards are registered; reverting
 * is deleting this file, `entityRegistry.ts` and two lines of App.tsx.
 *
 * ── What the first draft got wrong ────────────────────────────────────────
 * It put cross-type saved views on the primary tab strip and made a mixed list
 * the default door to the roster. A 107-agent research pass over primary
 * sources (Microsoft Dataverse, Salesforce/SLDS, HubSpot, IBM Carbon, NN/g)
 * contradicts that on three counts:
 *
 *   1 · No documented platform lists heterogeneous types in a working table.
 *       The dominant pattern is to group BY TYPE and render a column set that
 *       belongs to each type. Where a mixed surface exists at all it is SEARCH,
 *       and deliberately degraded — Dataverse caps it at six columns, drops
 *       sort, and indexes only some fields.
 *
 *   2 · Cross-type FILTERING collapses to the lowest common denominator.
 *       Dataverse derives this explicitly: the mixed tab offers only the three
 *       facets that exist on every type — Owner, Modified On, Created On.
 *       Type-specific facets require narrowing to a type first. The first draft
 *       hid this by only ever showing fields that happened to be common.
 *
 *   3 · Grouping types by their schema namespace has NO prior art as a
 *       user-facing structure. Dataverse orders by relevance, Salesforce keeps a
 *       flat searchable "All Items" above its per-app grouping, HubSpot does not
 *       group. Grouping by model was inventing a pattern.
 *
 * ── What survived ─────────────────────────────────────────────────────────
 * The catalog door is validated: Salesforce's App Launcher lists "every item in
 * Salesforce that you have permission to use" — searchable and permission
 * filtered. Saved-views-as-tabs is validated too, but WITHIN a type: HubSpot's
 * index-page tabs are exactly that, and Carbon sanctions user-curated tabs "to
 * focus a specific data set" while saying in the same breath "Do not use as
 * navigation".
 *
 * ── So ────────────────────────────────────────────────────────────────────
 * The roster is one type at a time, reached through a switcher and a flat
 * catalog ordered by use. Saved views are tabs inside the type. The mixed list
 * keeps the one role the evidence concedes it — an inbox — and moves to My Work,
 * with columns declared rather than discovered.
 *
 * One thing the prior art could not weigh: none of those platforms has a Next
 * Best Action. "What needs a decision" is cross-type by nature AND an inbox by
 * nature, which is why the mixed surface still earns a place — just not this one.
 */

import { useMemo, useState } from "react"
import { ScreenLayout }      from "@/components/layouts/screen-layout"
import { Header }            from "@/components/ui/header"
import { Tabs }              from "@/components/ui/tabs"
import { Tag }               from "@/components/ui/tag"
import { Button }            from "@/components/ui/button"
import { Chip }              from "@/components/ui/chip"
import { CardContainer }     from "@/components/ui/card-container"
import { EntityList }        from "@/components/ui/entity-list"
import type { EntityListItemData } from "@/components/ui/entity-list"
import { EmptyState }        from "@/components/ui/empty-state"
import { HighlightIcon }     from "@/components/ui/highlight-icon"
import { Filters }           from "@/components/ui/filters"
import { Pagination }        from "@/components/ui/pagination"
import { SlideOut }          from "@/components/ui/slide-out"
import { ModalDialog }       from "@/components/ui/modal-dialog"
import { Menu, MenuItem }    from "@/components/ui/menu-item"
import { anchorFromEvent, useDropdownPosition } from "@/lib/dropdown-anchor"
import type { DropdownAnchor } from "@/lib/dropdown-anchor"
import { LayoutGrid, Plus, Lock, Search, ChevronDown, Inbox, SlidersHorizontal } from "lucide-react"
import { UCP_SIDEBAR_ITEMS } from "./pm-thomas-ucp-profile"
import { EntityProfileView } from "./entityProfileView"
import type { ProfileRecord } from "./entityProfileView"
import type { ProfileField } from "./entityProfiles"
import {
  ENTITY_TYPES, MODEL_LABEL, INBOX_VIEWS, INBOX_COLUMNS, COMMON_FACETS,
  isReadable, byUsage, viewsForType, facetsForType,
} from "./entityRegistry"
import type { EntityTypeDef, Facet } from "./entityRegistry"
import { CONTACTS } from "./ucpShared"

// ── Records ───────────────────────────────────────────────────────────────────

interface WorkspaceRecord {
  id: string; typeId: string; title: string; subtitle: string
  owner: string; source: string; lastActivity: string
  state: { label: string; variant: "success" | "error" | "alert" | "informative" | "neutral" }
  nba?: string; mine?: boolean; flag?: string
}

const EXTRA: WorkspaceRecord[] = [
  { id: "VEH-88214", typeId: "vehicle",    title: "2024 Ford F-150 Lariat",   subtitle: "VIN 1FTFW1E5•••4821 · Riverbend Tampa",  owner: "Daniel Ruiz",    source: "CDK Global", lastActivity: "2h ago",  state: { label: "In service", variant: "alert" },       nba: "Approve the extended warranty quote · 2h ago", mine: true, flag: "service" },
  { id: "VEH-88250", typeId: "vehicle",    title: "2023 Toyota RAV4 XLE",     subtitle: "VIN 2T3P1RFV•••0913 · Riverbend Brandon", owner: "Daniel Ruiz",    source: "CDK Global", lastActivity: "1d ago",  state: { label: "Available",  variant: "success" },     mine: true },
  { id: "VEH-88301", typeId: "vehicle",    title: "2025 Honda CR-V Sport",    subtitle: "VIN 7FARW2H5•••1177 · Riverbend Tampa",   owner: "Marcus Delgado", source: "CDK Global", lastActivity: "3d ago",  state: { label: "Reserved",   variant: "informative" } },
  { id: "VEH-88355", typeId: "vehicle",    title: "2024 Chevrolet Silverado", subtitle: "VIN 3GCUYDED•••7702 · Riverbend Tampa",   owner: "Daniel Ruiz",    source: "CDK Global", lastActivity: "5h ago",  state: { label: "In service", variant: "alert" },       flag: "service" },
  { id: "DLR-0004",  typeId: "dealership", title: "Riverbend Tampa",          subtitle: "Automotive Retail · 240 employees · Tampa, FL",  owner: "Daniel Ruiz",   source: "CDK Global", lastActivity: "5h ago", state: { label: "Active",       variant: "success" },     nba: "Rebalance the service load across four stores · 5h ago", mine: true },
  { id: "DLR-0007",  typeId: "dealership", title: "Riverbend Brandon",        subtitle: "Automotive Retail · 96 employees · Brandon, FL", owner: "Marcus Delgado", source: "CDK Global", lastActivity: "2d ago", state: { label: "Under review", variant: "informative" }, flag: "review" },
]

const RECORDS: WorkspaceRecord[] = [
  ...CONTACTS.map(c => ({
    id: c.id,
    typeId: c.type === "person" ? "customer" : c.type === "employee" ? "employee" : "company",
    title: c.name, subtitle: c.subtitle, owner: c.owner, source: c.source.label,
    lastActivity: c.lastInteraction,
    state: { label: c.status, variant: (c.status === "Active" ? "success" : "neutral") as WorkspaceRecord["state"]["variant"] },
    nba: c.nba ? `${c.nba.title} · ${c.nba.timestamp}` : undefined,
    mine: c.owner === "Priya Nair",
  })),
  ...EXTRA,
]

const TYPE_BY_ID = new Map(ENTITY_TYPES.map(t => [t.id, t]))

/** Cómo cada faceta se lee sobre un registro. Un lugar, no uno por pantalla. */
function facetValue(r: WorkspaceRecord, facetId: string): string {
  switch (facetId) {
    case "status":
    case "condition": return r.state.label
    case "owner":     return r.owner
    case "source":    return r.source
    case "store":     return r.subtitle.split(" · ").pop() ?? ""
    case "type":      return TYPE_BY_ID.get(r.typeId)?.singular ?? ""
    default:          return ""
  }
}

/**
 * The fields each type puts in its own header. This is the whole difference
 * between a vehicle's profile and a customer's — no branching in the profile
 * screen, just a different set of columns published by a different model.
 */
function fieldsFor(r: WorkspaceRecord): ProfileField[] {
  const sys = r.source
  const common: ProfileField[] = [
    { label: "Owner",         iconName: "UserRound", value: r.owner,        system: sys },
    { label: "Last activity", iconName: "Clock",     value: r.lastActivity, system: "Helix Data Studio" },
  ]
  switch (r.typeId) {
    case "vehicle": {
      const [vin, store] = r.subtitle.split(" · ")
      return [
        { label: "VIN",       iconName: "Fingerprint", value: vin.replace("VIN ", ""), system: sys },
        { label: "Store",     iconName: "Store",       value: store,        system: sys },
        { label: "Odometer",  iconName: "Gauge",       value: "14,208 mi",  system: sys },
        { label: "List price", iconName: "DollarSign", value: "$58,400",    system: "Finance Core", scope: "finance.read" },
        ...common,
      ]
    }
    case "dealership": {
      const [industry, staff, city] = r.subtitle.split(" · ")
      return [
        { label: "Industry",  iconName: "Factory",   value: industry, system: sys },
        { label: "Headcount", iconName: "Users",     value: staff,    system: "Workday" },
        { label: "Location",  iconName: "MapPin",    value: city,     system: sys },
        ...common,
      ]
    }
    case "employee":
      return [
        { label: "Role",   iconName: "Info",        value: r.subtitle, system: sys },
        { label: "Scopes", iconName: "ShieldCheck", value: "hr.read +2", system: "Helix Data Studio" },
        ...common,
      ]
    default:
      return [
        { label: "Profile", iconName: "Info", value: r.subtitle, system: sys },
        ...common,
      ]
  }
}
const GOV_TAG: Record<EntityTypeDef["governance"], "success" | "alert" | "neutral"> = {
  governed: "success", "in review": "alert", draft: "neutral",
}

// ── Catalog ───────────────────────────────────────────────────────────────────

/**
 * Flat, searchable, ordered by use, filtered by permission. Every one of those
 * four words is from prior art rather than preference:
 *
 *   flat + searchable  → Salesforce "All Items"; and menu BREADTH mattered more
 *                        than label quality in the navigation study — broad
 *                        menus dropped fallback-to-search below 10%, narrow ones
 *                        pushed it to ~40%.
 *   ordered by use     → Dataverse orders by relevance of results, not taxonomy.
 *   permission filter  → App Launcher shows only what you have permission to use.
 *
 * The model is still on the row, so it stays searchable — it just is not the
 * structure any more.
 *
 * Locked types are still SHOWN, and this is now a knowingly contested call. The
 * evidence leans the other way: Salesforce and Dataverse both filter, and
 * HubSpot's inability to hide an object the viewer cannot read was filed by its
 * own community as a defect. Held anyway, because a record surface here already
 * shows a governed RECORD rather than hiding it, and a catalog that hides a type
 * would answer "what does this tenant hold" with something untrue. Flagged for
 * Michael rather than settled — the primary-source basis for hide-vs-lock at the
 * TYPE level did not survive verification in either direction.
 */
/** Shared by both surfaces: search over the type's label and its model. */
function matchTypes(q: string): EntityTypeDef[] {
  const needle = q.trim().toLowerCase()
  return ENTITY_TYPES
    .filter(t => !needle
      || t.label.toLowerCase().includes(needle)
      || MODEL_LABEL[t.model].toLowerCase().includes(needle))
    .sort(byUsage)
}

/**
 * The switcher's dropdown — the fast path.
 *
 * It replaced a SlideOut, and the reason is what the two surfaces are FOR. A
 * SlideOut is a place you go; a dropdown is a thing you flick. Switching type is
 * the most repeated action on this screen and the viewer usually already knows
 * the name, so it should cost one click and a couple of keystrokes, not a panel
 * that covers the roster it is about to change.
 *
 * Search is in the menu rather than behind it because with twelve published
 * types the list already outgrows a glance, and typing is faster than reading
 * once a viewer knows what they want. It pins while the list scrolls.
 *
 * What the dropdown cannot do is let someone DECIDE. Comparing what a type
 * holds — records, fields, governance, whether it is even readable — needs room
 * the menu does not have, so the last row opens the full view instead of trying.
 */
function TypeDropdown({
  anchor, current, onPick, onClose, onFullView,
}: {
  anchor: DropdownAnchor
  current: string
  onPick: (id: string) => void
  onClose: () => void
  onFullView: () => void
}) {
  const [q, setQ] = useState("")
  const dropdown = useDropdownPosition(anchor)
  const list = useMemo(() => matchTypes(q), [q])

  return (
    <>
      <div className="fixed inset-0 z-[10000]" onClick={onClose} />
      <div ref={dropdown.ref} style={{ position: "fixed", zIndex: 10001, ...dropdown.style }}>
        <Menu className="!w-[330px] !max-h-[420px]">
          <div style={{
            position: "sticky", top: 0, zIndex: 1, padding: "4px 8px 8px",
            background: "var(--menu-bg)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--field-bg)", border: "1px solid var(--field-border)",
              borderRadius: 8, padding: "6px 8px",
            }}>
              <Search size={13} color="var(--field-placeholder)" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search types or models…"
                style={{
                  flex: 1, minWidth: 0, background: "transparent", border: "none",
                  outline: "none", fontSize: 12, color: "var(--foreground)",
                }}
              />
            </div>
          </div>

          {list.length === 0 ? (
            <div style={{ padding: "4px 8px 8px" }}>
              <EmptyState compact icon={Search} title="No types match" description="Try the model name instead." />
            </div>
          ) : list.map(t => {
            const readable = isReadable(t)
            return (
              <MenuItem
                key={t.id}
                size="sm"
                label={t.label}
                subtext={`${MODEL_LABEL[t.model]} · ${t.records.toLocaleString()} records`}
                leadingIcon={<HighlightIcon size="sm" variant={t.id === current ? "informative" : "neutral"} iconName={t.iconName} />}
                trailingElement={readable ? undefined : <Lock size={12} color="var(--field-supporting)" />}
                state={!readable ? "disabled" : t.id === current ? "focus" : "default"}
                onClick={() => { if (readable) { onPick(t.id); onClose() } }}
              />
            )
          })}

          {/* Pinned like the search, and for the same reason: with twelve types
              the list already scrolls, and the one row that leads somewhere
              else cannot be the row you have to go looking for. */}
          <div style={{
            position: "sticky", bottom: 0, zIndex: 1,
            borderTop: "1px solid var(--color-border-neutral-subtle)",
            marginTop: 4, paddingTop: 4, background: "var(--menu-bg)",
          }}>
            <MenuItem
              size="sm"
              label={`Browse all ${ENTITY_TYPES.length} types`}
              subtext="Compare records, fields and governance"
              leadingIcon={<HighlightIcon size="sm" variant="informative" iconName="LayoutGrid" />}
              onClick={() => { onClose(); onFullView() }}
            />
          </div>
        </Menu>
      </div>
    </>
  )
}

/**
 * The full view — the deliberate path.
 *
 * A modal rather than a panel because choosing a type to work in is a decision
 * with a before and an after, and the roster behind it is about to be replaced
 * anyway; there is nothing to keep referring to while you choose.
 *
 * The default view is FLAT and ordered by use, which is the finding the
 * research pass produced: grouping published types by their schema namespace
 * has no prior art as a user-facing structure. The model rail is a FILTER over
 * that flat list, not the path to it — "All models" is where it opens, and a
 * viewer who never touches the rail never meets the grouping.
 *
 * Locked types are shown, not filtered, and that call is still contested — see
 * the note on the catalog it replaced.
 */
function EntityMarketplace({
  open, onClose, current, onPick,
}: { open: boolean; onClose: () => void; current: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("")
  const [model, setModel] = useState<string | null>(null)

  const matched = useMemo(() => matchTypes(q), [q])
  const list = useMemo(
    () => matched.filter(t => !model || t.model === model),
    [matched, model],
  )

  /** Counts run over the search result, so the rail says what a click would give. */
  const models = useMemo(() => {
    const seen = new Map<string, number>()
    ENTITY_TYPES.forEach(t => seen.set(t.model, 0))
    matched.forEach(t => seen.set(t.model, (seen.get(t.model) ?? 0) + 1))
    return Array.from(seen.entries())
  }, [matched])

  const body = (
    <div style={{ display: "flex", gap: 20, minHeight: 380, maxHeight: "60vh" }}>
      {/* Model rail — a filter, not the structure. */}
      <div style={{
        width: 190, flex: "none", display: "flex", flexDirection: "column", gap: 2,
        borderRight: "1px solid var(--color-border-neutral-subtle)", paddingRight: 16,
        overflowY: "auto",
      }}>
        <button
          type="button"
          onClick={() => setModel(null)}
          style={railStyle(model === null)}
        >
          <span>All models</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{matched.length}</span>
        </button>
        {models.map(([m, n]) => (
          <button
            key={m}
            type="button"
            disabled={n === 0}
            onClick={() => { if (n > 0) setModel(m) }}
            style={{ ...railStyle(model === m), opacity: n === 0 ? 0.45 : 1, cursor: n === 0 ? "not-allowed" : "pointer" }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{MODEL_LABEL[m]}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{n}</span>
          </button>
        ))}
      </div>

      {/* The grid. */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--field-bg)", border: "1px solid var(--field-border)",
          borderRadius: 8, padding: "8px 10px",
        }}>
          <Search size={14} color="var(--field-placeholder)" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search every published type…"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--foreground)" }}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No types match"
            description="Try the model name, or clear the model filter to search every published type."
            ctaLabel={model ? "Clear model filter" : undefined}
            onCta={model ? () => setModel(null) : undefined}
          />
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12, overflowY: "auto", paddingRight: 4, alignContent: "start",
          }}>
            {list.map(t => {
              const readable = isReadable(t)
              return (
                <CardContainer key={t.id} size="sm" className="w-full">
                  <button
                    type="button"
                    disabled={!readable}
                    onClick={() => { onPick(t.id); onClose() }}
                    style={{
                      width: "100%", display: "flex", flexDirection: "column", gap: 8, textAlign: "left",
                      background: "transparent", border: "none", padding: 0,
                      cursor: readable ? "pointer" : "not-allowed", opacity: readable ? 1 : 0.6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <HighlightIcon size="sm" variant={t.id === current ? "informative" : "neutral"} iconName={t.iconName} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.label}
                      </span>
                      {t.id === current && <Tag variant="informative" size="sm">Current</Tag>}
                    </div>

                    <span style={{ fontSize: 11, color: "var(--field-supporting)" }}>{MODEL_LABEL[t.model]}</span>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 11, color: "var(--field-supporting)" }}>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{t.records.toLocaleString()} records</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{t.fields} fields</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Tag variant={GOV_TAG[t.governance]} size="sm">{t.governance}</Tag>
                      {!readable && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--field-supporting)" }}>
                          <Lock size={11} /> {t.requiredScope}
                        </span>
                      )}
                    </div>
                  </button>
                </CardContainer>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <ModalDialog
      isOpen={open}
      onClose={onClose}
      variant="content"
      showIcon
      iconName="LayoutGrid"
      iconVariant="informative"
      title="Browse entity types"
      description={`${ENTITY_TYPES.length} types published by Data Studio, most used first. Pick one to list its records.`}
      slot={body}
      slotUnstyled
      showClose
      ctaSecondary={{ label: "Cancel", onClick: onClose }}
    />
  )
}

/** Rail rows are one object: same padding, same baseline, count on the right. */
function railStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
    width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", textAlign: "left",
    fontSize: 12, cursor: "pointer",
    background: active ? "var(--card-purple-bg)" : "transparent",
    color: active ? "var(--foreground)" : "var(--field-supporting)",
    fontWeight: active ? 600 : 400,
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────

const PAGE = 8

export default function PMThomasEntityWorkspaceScreen() {
  const [nav,     setNav]     = useState("contacts")   // "contacts" = roster · "work" = inbox
  const [typeId,  setTypeId]  = useState("customer")
  const [viewId,  setViewId]  = useState("customer-all")
  const [inboxId, setInboxId] = useState(INBOX_VIEWS[0].id)
  // Dos superficies, dos estados. El anchor y el "abrir" viven en el MISMO
  // state a propósito: useDropdownPosition mide en un layout effect, así que si
  // el anchor llega en un commit y la apertura en otro, el flip se calcula
  // contra una ref vacía y el panel se sale de la ventana.
  const [typeMenu, setTypeMenu] = useState<DropdownAnchor | null>(null)
  const [catalog, setCatalog] = useState(false)
  const [openId,  setOpenId]  = useState<string | null>(null)
  const [search,  setSearch]  = useState("")
  const [page,    setPage]    = useState(1)
  // Aplicados, por id de faceta. El slideout trabaja sobre un borrador aparte
  // (draft-then-apply, como manda el patrón de filtros del DS).
  const [applied, setApplied] = useState<Record<string, string>>({})
  const [draft,   setDraft]   = useState<Record<string, string>>({})
  const [allOpen, setAllOpen] = useState(false)
  // Al cambiar de tipo los filtros no pueden viajar — un filtro por Odometer no
  // significa nada en customers — así que se limpian. Y hay que DECIRLO, o el
  // usuario cree que la lista se rompió.
  const [clearedOn, setClearedOn] = useState<string | null>(null)

  const isInbox = nav === "work"
  const type    = TYPE_BY_ID.get(typeId)!
  const views   = viewsForType(typeId)
  const view    = views.find(v => v.id === viewId) ?? views[0]

  const pickType = (id: string) => {
    const had = Object.keys(applied).length
    setTypeId(id); setViewId(`${id}-all`); setPage(1); setSearch(""); setNav("contacts")
    setApplied({}); setDraft({})
    setClearedOn(had > 0 ? TYPE_BY_ID.get(id)?.label ?? null : null)
  }

  const rows = useMemo(() => {
    let r: WorkspaceRecord[]
    if (isInbox) {
      // The mixed surface, and the only one. Cross-type by nature because a
      // recommendation is not a property of one type.
      r = RECORDS.filter(x => {
        const t = TYPE_BY_ID.get(x.typeId)
        if (!t || !isReadable(t)) return false
        return inboxId === "inbox-nba" ? Boolean(x.nba) : Boolean(x.mine)
      })
    } else {
      r = RECORDS.filter(x => x.typeId === typeId)
      if (view.id === "cust-mine" || view.id === "veh-mine" || view.id === "emp-mine") r = r.filter(x => x.mine)
      if (view.id === "cust-nba")    r = r.filter(x => x.nba)
      if (view.id === "veh-service") r = r.filter(x => x.flag === "service")
      if (view.id === "dlr-review")  r = r.filter(x => x.flag === "review")
    }
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(x => [x.title, x.subtitle, x.owner, x.id].some(f => f.toLowerCase().includes(q)))
    }
    for (const [fid, val] of Object.entries(applied)) {
      r = r.filter(x => facetValue(x, fid) === val)
    }
    return r
  }, [isInbox, inboxId, typeId, view, search, applied])

  // Las facetas las publica el modelo del tipo; el Inbox cae al piso común,
  // porque una superficie mixta solo puede ofrecer lo que todos los tipos tienen.
  const facets: Facet[] = useMemo(() => {
    if (!isInbox) return facetsForType(typeId)
    return COMMON_FACETS.map(f => f.id === "type"
      // Las opciones de Type se derivan de lo que el Inbox realmente puede
      // mostrar — es la única faceta cuyo dominio ES el conjunto de tipos.
      ? { ...f, options: [...new Set(RECORDS.filter(x => isReadable(TYPE_BY_ID.get(x.typeId)!)).map(x => TYPE_BY_ID.get(x.typeId)!.singular))].sort() }
      : f)
  }, [isInbox, typeId])

  /**
   * Conteo por opción, calculado sobre el conjunto con las OTRAS facetas
   * aplicadas — así el número dice cuántos quedarían si eligieras esta.
   *
   * Cero deshabilita, nunca remueve. Si "In service" borrara la faceta Store
   * porque ningún vehículo en taller está en Brandon, perderías la salida: no
   * podés ensanchar de vuelta. Es el fallo conocido de esconder facetas vacías.
   */
  const countFor = (facetId: string, option: string): number => {
    const others = Object.entries(applied).filter(([k]) => k !== facetId)
    let base = RECORDS.filter(x => {
      const t = TYPE_BY_ID.get(x.typeId)
      if (!t || !isReadable(t)) return false
      if (isInbox) return inboxId === "inbox-nba" ? Boolean(x.nba) : Boolean(x.mine)
      return x.typeId === typeId
    })
    for (const [k, v] of others) base = base.filter(x => facetValue(x, k) === v)
    return base.filter(x => facetValue(x, option === "" ? "" : facetId) === option).length
  }

  const activeCount = Object.keys(applied).length
  const inline = facets.filter(f => f.inline)

  const shown = rows.slice((page - 1) * PAGE, page * PAGE)

  const toItem = (r: WorkspaceRecord): EntityListItemData => {
    const t = TYPE_BY_ID.get(r.typeId)!
    return {
      id: r.id,
      title: r.title,
      ...(r.typeId === "customer" || r.typeId === "employee"
        ? { avatarName: r.title }
        : { iconName: t.iconName, iconVariant: "info" as const }),
      // In the roster every row is the same type, so the type is not repeated on
      // the row — it is in the switcher above. In the Inbox it is the first
      // declared column, because a mixed list that does not say what each row IS
      // is unreadable.
      primaryMeta: isInbox
        ? [{ iconName: t.iconName, label: t.singular, tooltip: `Type · ${t.singular}` },
           { iconName: "Hash", label: r.id, tooltip: `Record ID · ${r.id}` }]
        : [{ iconName: "Hash", label: r.id, tooltip: `Record ID · ${r.id}` },
           { iconName: "Cloud", label: r.source, tooltip: `Source · ${r.source}` }],
      // Roster rows can show fields that belong to this type. Inbox rows may
      // only show the declared common columns — that is the whole discipline.
      secondaryMeta: isInbox
        ? [{ iconName: "UserRound", label: r.owner,        tooltip: `Owner · ${r.owner}` },
           { iconName: "Clock",     label: r.lastActivity, tooltip: `Last activity · ${r.lastActivity}` }]
        : [{ iconName: "Info",      label: r.subtitle,     tooltip: r.subtitle },
           { iconName: "UserRound", label: r.owner,        tooltip: `Owner · ${r.owner}` },
           { iconName: "Clock",     label: r.lastActivity, tooltip: `Last activity · ${r.lastActivity}` }],
      aiInsight: r.nba ? { action: "Next Best Action", showAiPrefix: false, detail: r.nba } : undefined,
      state: r.state,
      showMenu: true,
      onMenuClick: () => {},
      onClick: () => setOpenId(r.id),
    }
  }

  // Cualquier tipo entra por la misma pantalla de perfil. No hay una por tipo.
  const open = openId ? RECORDS.find(x => x.id === openId) : null
  if (open) {
    const t = TYPE_BY_ID.get(open.typeId)!
    const pr: ProfileRecord = {
      id: open.id, title: open.title, typeId: open.typeId, state: open.state,
      fields: fieldsFor(open),
      agent: { id: "agt-1", name: `${t.singular} Concierge` },
      // El fixture guarda "título · cuándo" en una cadena; partirla mal repetía
      // el título como su propia descripción.
      nba: open.nba
        ? { title: open.nba.split(" · ")[0], description: open.nba.split(" · ").slice(1).join(" · ") || "Propuesto por el agente" }
        : undefined,
    }
    return <EntityProfileView record={pr} type={t} onBack={() => setOpenId(null)} />
  }

  return (
    <ScreenLayout
      workspaceName="Riverbend Group"
      userName="Thomas González"
      userEmail="thomas.gonzalez@aimsos.ai"
      sidebarItems={UCP_SIDEBAR_ITEMS}
      activeSidebarId={nav}
      onSidebarItemClick={id => { if (id === "work" || id === "contacts") { setNav(id); setPage(1) } }}
      header={isScrolled => (
        <Header
          size={isScrolled ? "compress" : "size-l"}
          title={isInbox ? "My Work" : type.label}
          description={isInbox
            ? "Records of any type that are waiting on you."
            : `${type.records.toLocaleString()} records · ${MODEL_LABEL[type.model]}`}
          primaryAction={isInbox ? undefined : { label: `New ${type.singular}`, icon: Plus, onClick: () => {} }}
          secondaryAction={{ label: "All entities", icon: LayoutGrid, onClick: () => setCatalog(true) }}
        />
      )}
      pagination={
        rows.length > PAGE
          ? <Pagination currentPage={page} totalItems={rows.length} itemsPerPage={PAGE} onPageChange={setPage} rowsPerPageOptions={[8, 25, 50]} />
          : undefined
      }
    >
      {isInbox ? (
        <>
          <div className="mb-[24px]">
            <Tabs
              activeId={inboxId}
              onChange={id => { setInboxId(id); setPage(1) }}
              items={INBOX_VIEWS.map(v => ({ id: v.id, label: v.label }))}
            />
          </div>
          {/* Declared, not discovered. Dataverse's mixed view offers only the
              three facets that exist on every type; saying which fields a mixed
              list may show turns that floor from a surprise into a contract. */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--field-supporting)" }}>
              <Inbox size={13} /> Mixed types — showing the fields every type carries:
            </span>
            {INBOX_COLUMNS.map(c => <Tag key={c} variant="neutral" size="sm">{c}</Tag>)}
          </div>
        </>
      ) : (
        <>
          {/* The type switcher. Not a tab strip: a tab strip claims its contents
              are the set, and the set is unbounded and different per tenant. */}
          <div className="mb-[24px]" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Button
              variant="secondary" size="sm" icon={<ChevronDown size={14} />} iconPosition="right"
              onClick={e => setTypeMenu(anchorFromEvent(e))}
            >
              {type.label}
            </Button>
            <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>·</span>
            <Tabs
              activeId={view.id}
              onChange={id => { setViewId(id); setPage(1) }}
              items={views.map(v => ({ id: v.id, label: v.label }))}
            />
          </div>
          {view.hint && (
            <div style={{ marginBottom: 16, fontSize: 12, color: "var(--field-supporting)" }}>{view.hint}</div>
          )}
        </>
      )}

      {/* Una sola línea de filtros. Los "quickfilters" son sus `slots` — la capa
          visible que el patrón del DS ya define — no una fila aparte, que sería
          una cuarta capa y un segundo source of truth del dataset.

          Cuáles van inline lo decide la FRECUENCIA, no la importancia:
          FILTERS_SPEC dice que algo se queda fuera del slideout "because it
          should always be visible (high-frequency)". */}
      <div className="mb-[24px]">
        <Filters
          searchPlaceholder={isInbox ? "Search across every readable type…" : `Search ${type.label.toLowerCase()}…`}
          searchValue={search}
          onSearchChange={v => { setSearch(v); setPage(1) }}
          slots={inline.map(f => ({
            placeholder: f.label,
            value: applied[f.id],
            // Cada opción lleva su conteo. Cero se muestra y se deshabilita —
            // el conteo va en la etiqueta porque FilterSlot toma strings.
            options: f.options.map(o => {
              const n = countFor(f.id, o)
              return n === 0 ? `${o} · 0` : `${o} · ${n}`
            }),
            onSelect: label => {
              const o = label.replace(/ · \d+$/, "")
              if (countFor(f.id, o) === 0) return   // cero no selecciona
              setApplied(a => ({ ...a, [f.id]: o })); setPage(1); setClearedOn(null)
            },
            onRemove: applied[f.id] ? () => { setApplied(a => { const n = { ...a }; delete n[f.id]; return n }); setPage(1) } : undefined,
          }))}
          showAllFilters={facets.length > inline.length}
          onAllFiltersClick={() => { setDraft(applied); setAllOpen(true) }}
          showClearFilters={activeCount > 0}
          onClearFilters={() => { setApplied({}); setPage(1) }}
          showViewToggle={false}
          showSort={false}
        />
      </div>

      {/* Chips de lo aplicado, arriba de la lista, cada uno con su X — para
          quitar uno sin abrir el slideout. Tal como lo especifica FILTERS_SPEC. */}
      {activeCount > 0 && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(applied).map(([fid, val]) => (
            <Chip key={fid} size="s" variant="primary"
              onClick={() => { setApplied(a => { const n = { ...a }; delete n[fid]; return n }); setPage(1) }}>
              {`${facets.find(f => f.id === fid)?.label ?? fid}: ${val}  ✕`}
            </Chip>
          ))}
          <Button variant="tertiary" size="sm" className="!px-[8px]"
            onClick={() => { setApplied({}); setPage(1) }}>
            {`Clear all ${activeCount}`}
          </Button>
        </div>
      )}

      {/* El aviso que evita que "se rompió la lista" — los filtros no viajan
          entre tipos porque las facetas no son las mismas. */}
      {clearedOn && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--field-supporting)" }}>
          <HighlightIcon size="sm" variant="neutral" iconName="Info" />
          {`Filters cleared — ${clearedOn} publishes a different set of facets.`}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState
          icon={isInbox ? Inbox : Search}
          title={isInbox ? "Nothing waiting on you" : `No ${type.label.toLowerCase()} match`}
          description={isInbox
            ? "When an agent proposes something on any record, it lands here."
            : "Clear the search, or switch to another type from All entities."}
          ctaLabel={isInbox ? undefined : "Open the catalog"}
          onCta={isInbox ? undefined : () => setCatalog(true)}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shown.map(r => (
            <CardContainer key={r.id} size="sm" className="!p-0 overflow-hidden">
              <EntityList items={[toItem(r)]} />
            </CardContainer>
          ))}
        </div>
      )}

      {/* All filters: borrador, luego Apply. Nunca muta lo aplicado en vivo. */}
      <SlideOut
        open={allOpen} onClose={() => setAllOpen(false)} type="with-variants" size="m"
        title="All filters"
        subtitle={isInbox
          ? `Mixed types · only the facets every type carries`
          : `${type.label} · published by ${MODEL_LABEL[type.model]}`}
        showIcon iconContent={<SlidersHorizontal size={14} />}
        showStatus={false} showTopButton={false} showTabs={false} showSearchBar={false} showChips={false}
        showCta
        ctaPrimaryLabel={`Apply${Object.keys(draft).length ? ` (${Object.keys(draft).length})` : ""}`}
        onCtaPrimary={() => { setApplied(draft); setPage(1); setAllOpen(false); setClearedOn(null) }}
        showCtaSecondary ctaSecondaryLabel="Cancel"
        onCtaSecondary={() => setAllOpen(false)}
      >
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          {isInbox && (
            <span style={{ fontSize: 12, color: "var(--field-supporting)", lineHeight: 1.6 }}>
              A mixed list can only be filtered on what every type has. These two are declared,
              not derived from the current results — a facet that appears and disappears as the
              rows change is a surprise.
            </span>
          )}
          {facets.map(f => (
            <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--field-supporting)" }}>
                {f.label}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {f.options.map(o => {
                  const n = countFor(f.id, o)
                  const on = draft[f.id] === o
                  return (
                    <Chip key={o} size="s" variant={on ? "primary" : "secondary"}
                      disabled={n === 0 && !on}
                      onClick={() => setDraft(d => {
                        const next = { ...d }
                        if (next[f.id] === o) delete next[f.id]; else next[f.id] = o
                        return next
                      })}>
                      {`${o} · ${n}`}
                    </Chip>
                  )
                })}
              </div>
            </div>
          ))}
          <Button variant="tertiary" size="sm" className="self-start !px-0" onClick={() => setDraft({})}>
            Clear all
          </Button>
        </div>
      </SlideOut>

      {typeMenu && (
        <TypeDropdown
          anchor={typeMenu}
          current={typeId}
          onPick={pickType}
          onClose={() => setTypeMenu(null)}
          onFullView={() => setCatalog(true)}
        />
      )}
      <EntityMarketplace open={catalog} onClose={() => setCatalog(false)} current={typeId} onPick={pickType} />
    </ScreenLayout>
  )
}
