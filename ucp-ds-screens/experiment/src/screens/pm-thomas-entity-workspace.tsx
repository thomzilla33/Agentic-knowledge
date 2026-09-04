/**
 * Entity Workspace — the scaling experiment for the record roster.
 *
 * SIDE-BY-SIDE WITH THE APPROVED VERSION. This screen does not replace
 * `pm-thomas-ucp-contacts.tsx`; both are registered, so the two doors can be
 * opened one after the other and compared. Reverting is deleting this file,
 * `entityRegistry.ts`, and the two lines that register them — nothing else in
 * the prototype is touched.
 *
 * ── The problem ───────────────────────────────────────────────────────────
 * The approved roster navigates by type: All · Customers · Employees ·
 * Companies. That works at three types and stops working the moment a tenant
 * publishes forty — vehicles, dealerships, invoices, policies. Not because they
 * do not fit: because a tab strip ASSERTS that what it shows is the set. Eight
 * tabs out of forty types are not a summary of forty, they are an arbitrary
 * eight, in an order that is the same for every tenant when the set is not.
 *
 * ── The actual bug is older than the scale ────────────────────────────────
 * `Tabs` is documented as "Where am I?" — primary navigation. The List View
 * pattern is documented as "Filters as the single source of truth for the
 * dataset". The type tabs change which rows are listed without changing where
 * you are, so they are a second source of truth for the dataset. That is
 * already wrong at three types; forty only makes it visible.
 *
 * ── What this tries ───────────────────────────────────────────────────────
 * Two questions were being answered by one control, and they have different
 * shapes:
 *
 *   "Take me to what I work with"  — constant, personal, a handful → TABS,
 *      carrying saved VIEWS rather than types. Bounded by a person's attention
 *      instead of by the tenant's schema, and it answers "where am I?" truly:
 *      in my view.
 *
 *   "What does this tenant even hold?" — rare, needs completeness → a CATALOG,
 *      one permanent door away, grouped by the Data Studio model each type
 *      belongs to, showing governance and record counts.
 *
 * Type stops being a place and becomes a filter, which is where the DS already
 * said the dataset is decided. The payoff is not only that it scales: once type
 * is an attribute, "everything about Riverbend" is expressible across vehicles,
 * dealerships and customers at once — which a tab strip can never say.
 *
 * At three published types the derived views make this render exactly like the
 * approved roster, so nothing regresses on a small tenant.
 */

import { useMemo, useState } from "react"
import { ScreenLayout }      from "@/components/layouts/screen-layout"
import { Header }            from "@/components/ui/header"
import { Tabs }              from "@/components/ui/tabs"
import { Tag }               from "@/components/ui/tag"
import { Chip }              from "@/components/ui/chip"
import { Button }            from "@/components/ui/button"
import { CardContainer }     from "@/components/ui/card-container"
import { EntityList }        from "@/components/ui/entity-list"
import type { EntityListItemData } from "@/components/ui/entity-list"
import { EmptyState }        from "@/components/ui/empty-state"
import { HighlightIcon }     from "@/components/ui/highlight-icon"
import { Filters }           from "@/components/ui/filters"
import { Pagination }        from "@/components/ui/pagination"
import { SlideOut }          from "@/components/ui/slide-out"
import { LayoutGrid, Plus, Lock, Search } from "lucide-react"
import { UCP_SIDEBAR_ITEMS } from "./pm-thomas-ucp-profile"
import {
  ENTITY_TYPES, MODEL_LABEL, SAVED_VIEWS, isReadable,
} from "./entityRegistry"
import type { EntityTypeDef } from "./entityRegistry"
import { CONTACTS } from "./ucpShared"

// ── Records ───────────────────────────────────────────────────────────────────
// The sixteen contacts from the approved prototype keep their data and gain a
// registry type id; vehicles and dealerships are added so the cross-type view
// has something to cross. Deliberately NOT repair orders — that was declined.

interface WorkspaceRecord {
  id:       string
  typeId:   string
  title:    string
  subtitle: string
  owner:    string
  source:   string
  state:    { label: string; variant: "success" | "error" | "alert" | "informative" | "neutral" }
  nba?:     string
  mine?:    boolean
}

const EXTRA: WorkspaceRecord[] = [
  { id: "VEH-88214", typeId: "vehicle",    title: "2024 Ford F-150 Lariat",  subtitle: "VIN 1FTFW1E5•••4821 · Riverbend Tampa",  owner: "Daniel Ruiz",  source: "CDK Global", state: { label: "In service",  variant: "alert" },        nba: "Approve the extended warranty quote · 2h ago", mine: true },
  { id: "VEH-88250", typeId: "vehicle",    title: "2023 Toyota RAV4 XLE",    subtitle: "VIN 2T3P1RFV•••0913 · Riverbend Brandon", owner: "Daniel Ruiz",  source: "CDK Global", state: { label: "Available",   variant: "success" } },
  { id: "VEH-88301", typeId: "vehicle",    title: "2025 Honda CR-V Sport",   subtitle: "VIN 7FARW2H5•••1177 · Riverbend Tampa",   owner: "Marcus Delgado", source: "CDK Global", state: { label: "Reserved",  variant: "informative" } },
  { id: "DLR-0004",  typeId: "dealership", title: "Riverbend Tampa",         subtitle: "Automotive Retail · 240 employees · Tampa, FL", owner: "Daniel Ruiz", source: "CDK Global", state: { label: "Active", variant: "success" }, nba: "Rebalance the service load across four stores · 5h ago", mine: true },
  { id: "DLR-0007",  typeId: "dealership", title: "Riverbend Brandon",       subtitle: "Automotive Retail · 96 employees · Brandon, FL", owner: "Marcus Delgado", source: "CDK Global", state: { label: "Under review", variant: "informative" } },
  { id: "TEA-0012",  typeId: "team",       title: "Service Operations",      subtitle: "People Ops · 34 members · Tampa, FL",       owner: "Elena Fischer", source: "Workday",  state: { label: "Active", variant: "success" } },
  { id: "POL-0031",  typeId: "policy",     title: "Sub-processor disclosure", subtitle: "Compliance · reviewed quarterly",          owner: "Sarah Chen",   source: "Helix",     state: { label: "Active", variant: "success" } },
]

const RECORDS: WorkspaceRecord[] = [
  ...CONTACTS.map(c => ({
    id: c.id,
    typeId: c.type === "person" ? "customer" : c.type === "employee" ? "employee" : "company",
    title: c.name,
    subtitle: c.subtitle,
    owner: c.owner,
    source: c.source.label,
    state: { label: c.status, variant: (c.status === "Active" ? "success" : "neutral") as WorkspaceRecord["state"]["variant"] },
    nba: c.nba ? `${c.nba.title} · ${c.nba.timestamp}` : undefined,
    mine: c.owner === "Priya Nair",
  })),
  ...EXTRA,
]

const TYPE_BY_ID = new Map(ENTITY_TYPES.map(t => [t.id, t]))

// ── Catalog ───────────────────────────────────────────────────────────────────

const GOV_TAG: Record<EntityTypeDef["governance"], "success" | "alert" | "neutral"> = {
  governed:    "success",
  "in review": "alert",
  draft:       "neutral",
}

/**
 * The rare door, and the honest one. Grouped by the Data Studio model each type
 * belongs to, because that is the schema's own grouping and it already carries
 * governance — not a grouping invented for this screen.
 *
 * Types the viewer cannot read are SHOWN, locked. Hiding them would misstate
 * what the tenant holds, which is the same call the record surface already
 * makes for a governed record: the thing exists, and the scope is named.
 */
function EntityCatalog({
  open, onClose, onPick,
}: { open: boolean; onClose: () => void; onPick: (t: EntityTypeDef) => void }) {
  const [q, setQ] = useState("")
  const models = useMemo(() => {
    const hit = ENTITY_TYPES.filter(t =>
      !q || t.label.toLowerCase().includes(q.toLowerCase()) || MODEL_LABEL[t.model].toLowerCase().includes(q.toLowerCase()))
    const by = new Map<string, EntityTypeDef[]>()
    hit.forEach(t => by.set(t.model, [...(by.get(t.model) ?? []), t]))
    return [...by.entries()]
  }, [q])

  return (
    <SlideOut
      open={open} onClose={onClose} type="with-variants" size="m"
      title="All entities"
      subtitle={`${ENTITY_TYPES.length} published types · ${new Set(ENTITY_TYPES.map(t => t.model)).size} models`}
      showIcon iconContent={<LayoutGrid size={14} />}
      showStatus={false} showTopButton={false} showTabs={false} showSearchBar={false} showChips={false} showCta={false}
    >
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HighlightIcon size="sm" variant="neutral" iconName="Search" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search types or models…"
            style={{
              flex: 1, background: "var(--field-bg)", border: "1px solid var(--field-border)",
              borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--foreground)", outline: "none",
            }}
          />
        </div>

        {models.length === 0 ? (
          <EmptyState compact icon={Search} title="No types match" description="Try the model name instead." />
        ) : models.map(([model, types]) => (
          <div key={model} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--field-supporting)" }}>
              {MODEL_LABEL[model]}
            </span>
            {types.map(t => {
              const readable = isReadable(t)
              return (
                <CardContainer key={t.id} size="sm" className="w-full">
                  <button
                    type="button"
                    disabled={!readable}
                    onClick={() => { onPick(t); onClose() }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                      background: "transparent", border: "none", padding: 0,
                      cursor: readable ? "pointer" : "not-allowed", opacity: readable ? 1 : 0.55,
                    }}
                  >
                    <HighlightIcon size="sm" variant={readable ? "informative" : "neutral"} iconName={t.iconName} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{t.label}</span>
                      <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>
                        {t.records.toLocaleString()} records · {t.fields} fields
                      </span>
                    </div>
                    {!readable && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--field-supporting)" }}>
                        <Lock size={12} /> {t.requiredScope}
                      </span>
                    )}
                    <Tag variant={GOV_TAG[t.governance]} size="sm">{t.governance}</Tag>
                  </button>
                </CardContainer>
              )
            })}
          </div>
        ))}
      </div>
    </SlideOut>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

const PAGE = 8

export default function PMThomasEntityWorkspaceScreen() {
  const [viewId,      setViewId]      = useState(SAVED_VIEWS[0].id)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [search,      setSearch]      = useState("")
  const [page,        setPage]        = useState(1)

  const view = SAVED_VIEWS.find(v => v.id === viewId) ?? SAVED_VIEWS[0]

  // A person keeps a handful of views on the strip; the rest of the published
  // types live one click away in the catalog. Bounded by attention, not schema.
  const tabViews = SAVED_VIEWS.slice(0, 6)
  const onStrip  = tabViews.some(v => v.id === viewId)

  const rows = useMemo(() => {
    let r = RECORDS.filter(x => {
      const t = TYPE_BY_ID.get(x.typeId)
      if (!t || !isReadable(t)) return false
      if (view.id === "my-open")   return x.mine
      if (view.id === "needs-nba") return Boolean(x.nba)
      if (view.types.length)       return view.types.includes(x.typeId)
      return true
    })
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(x => [x.title, x.subtitle, x.owner, x.id].some(f => f.toLowerCase().includes(q)))
    }
    return r
  }, [view, search])

  const shown = rows.slice((page - 1) * PAGE, page * PAGE)

  const toItem = (r: WorkspaceRecord): EntityListItemData => {
    const t = TYPE_BY_ID.get(r.typeId)!
    return {
      id: r.id,
      title: r.title,
      // Type is no longer the row's identity — it is one of its attributes, and
      // it earns a tag like any other. The icon says what kind of thing it is
      // because a mixed list genuinely needs that; in a single-type view it is
      // redundant but harmless, and dropping it per-view would make the same
      // record render differently depending on how you arrived.
      iconName:    t.iconName,
      iconVariant: "info",
      primaryMeta: [
        { iconName: "Hash",  label: r.id,     tooltip: `Record ID · ${r.id}` },
        { iconName: "Cloud", label: r.source, tooltip: `Source · ${r.source}` },
      ],
      secondaryMeta: [
        { iconName: "Info",      label: r.subtitle, tooltip: r.subtitle },
        { iconName: "UserRound", label: r.owner,    tooltip: `Owner · ${r.owner}` },
      ],
      aiInsight: r.nba
        ? { action: "Next Best Action", showAiPrefix: false, detail: r.nba }
        : undefined,
      tags:  [{ label: t.singular }],
      state: r.state,
      showMenu: true,
      onMenuClick: () => {},
    }
  }

  return (
    <ScreenLayout
      workspaceName="Riverbend Group"
      userName="Thomas González"
      userEmail="thomas.gonzalez@aimsos.ai"
      sidebarItems={UCP_SIDEBAR_ITEMS}
      activeSidebarId="contacts"
      header={isScrolled => (
        <Header
          size={isScrolled ? "compress" : "size-l"}
          title="Records"
          description="Every entity type this workspace publishes, in one place."
          primaryAction={{ label: `New ${view.types.length === 1 ? TYPE_BY_ID.get(view.types[0])!.singular : "record"}`, icon: Plus, onClick: () => {} }}
          secondaryAction={{ label: "All entities", icon: LayoutGrid, onClick: () => setCatalogOpen(true) }}
        />
      )}
      pagination={
        rows.length > PAGE
          ? <Pagination currentPage={page} totalItems={rows.length} itemsPerPage={PAGE} onPageChange={setPage} rowsPerPageOptions={[8, 25, 50]} />
          : undefined
      }
    >
      {/* Views, not types. The strip is bounded by what this person keeps, and
          the catalog holds the rest — so the tab strip stops claiming to be the
          complete set of what the tenant has. */}
      <div className="mb-[24px]" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Tabs
          activeId={onStrip ? viewId : tabViews[0].id}
          onChange={id => { setViewId(id); setPage(1) }}
          items={tabViews.map(v => ({ id: v.id, label: v.label }))}
        />
        <Button variant="tertiary" size="sm" icon={<LayoutGrid size={14} />} onClick={() => setCatalogOpen(true)}>
          {`All entities (${ENTITY_TYPES.length})`}
        </Button>
      </div>

      {/* A view reached from the catalog is not on the strip, so it says so
          rather than leaving the strip lying about where you are. */}
      {!onStrip && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Chip size="s" variant="primary" onClick={() => setViewId(tabViews[0].id)}>
            {`${view.label}  ✕`}
          </Chip>
          <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>
            Opened from the catalog — not one of your saved views.
          </span>
        </div>
      )}

      {view.hint && onStrip && (
        <div style={{ marginBottom: 16, fontSize: 12, color: "var(--field-supporting)" }}>{view.hint}</div>
      )}

      <div className="mb-[24px]">
        <Filters
          searchPlaceholder="Search across every readable type…"
          searchValue={search}
          onSearchChange={v => { setSearch(v); setPage(1) }}
          showViewToggle={false}
          showSort={false}
        />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nothing in this view"
          description="No record matches this view and search. Clear the search, or open another view from All entities."
          ctaLabel="Open the catalog"
          onCta={() => setCatalogOpen(true)}
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

      <EntityCatalog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onPick={t => { setViewId(`type-${t.id}`); setPage(1) }}
      />
    </ScreenLayout>
  )
}
