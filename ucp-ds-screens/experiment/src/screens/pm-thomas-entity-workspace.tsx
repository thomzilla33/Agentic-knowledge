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
import { CardContainer }     from "@/components/ui/card-container"
import { EntityList }        from "@/components/ui/entity-list"
import type { EntityListItemData } from "@/components/ui/entity-list"
import { EmptyState }        from "@/components/ui/empty-state"
import { HighlightIcon }     from "@/components/ui/highlight-icon"
import { Filters }           from "@/components/ui/filters"
import { Pagination }        from "@/components/ui/pagination"
import { SlideOut }          from "@/components/ui/slide-out"
import { LayoutGrid, Plus, Lock, Search, ChevronDown, Inbox } from "lucide-react"
import { UCP_SIDEBAR_ITEMS } from "./pm-thomas-ucp-profile"
import {
  ENTITY_TYPES, MODEL_LABEL, INBOX_VIEWS, INBOX_COLUMNS,
  isReadable, byUsage, viewsForType,
} from "./entityRegistry"
import type { EntityTypeDef } from "./entityRegistry"
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
function EntityCatalog({
  open, onClose, current, onPick,
}: { open: boolean; onClose: () => void; current: string; onPick: (id: string) => void }) {
  const [q, setQ] = useState("")
  const list = useMemo(
    () => ENTITY_TYPES
      .filter(t => !q || t.label.toLowerCase().includes(q.toLowerCase()) || MODEL_LABEL[t.model].toLowerCase().includes(q.toLowerCase()))
      .sort(byUsage),
    [q],
  )

  return (
    <SlideOut
      open={open} onClose={onClose} type="with-variants" size="m"
      title="All entities"
      subtitle={`${ENTITY_TYPES.length} published types · most used first`}
      showIcon iconContent={<LayoutGrid size={14} />}
      showStatus={false} showTopButton={false} showTabs={false} showSearchBar={false} showChips={false} showCta={false}
    >
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HighlightIcon size="sm" variant="neutral" iconName="Search" />
          <input
            value={q} onChange={e => setQ(e.target.value)} placeholder="Search types or models…"
            style={{ flex: 1, background: "var(--field-bg)", border: "1px solid var(--field-border)", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--foreground)", outline: "none" }}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState compact icon={Search} title="No types match" description="Try the model name instead." />
        ) : list.map(t => {
          const readable = isReadable(t)
          return (
            <CardContainer key={t.id} size="sm" className="w-full">
              <button
                type="button" disabled={!readable}
                onClick={() => { onPick(t.id); onClose() }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  background: "transparent", border: "none", padding: 0,
                  cursor: readable ? "pointer" : "not-allowed", opacity: readable ? 1 : 0.55,
                }}
              >
                <HighlightIcon size="sm" variant={t.id === current ? "informative" : "neutral"} iconName={t.iconName} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{t.label}</span>
                  <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>
                    {MODEL_LABEL[t.model]} · {t.records.toLocaleString()} records · {t.fields} fields
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
    </SlideOut>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

const PAGE = 8

export default function PMThomasEntityWorkspaceScreen() {
  const [nav,     setNav]     = useState("contacts")   // "contacts" = roster · "work" = inbox
  const [typeId,  setTypeId]  = useState("customer")
  const [viewId,  setViewId]  = useState("customer-all")
  const [inboxId, setInboxId] = useState(INBOX_VIEWS[0].id)
  const [catalog, setCatalog] = useState(false)
  const [search,  setSearch]  = useState("")
  const [page,    setPage]    = useState(1)

  const isInbox = nav === "work"
  const type    = TYPE_BY_ID.get(typeId)!
  const views   = viewsForType(typeId)
  const view    = views.find(v => v.id === viewId) ?? views[0]

  const pickType = (id: string) => {
    setTypeId(id); setViewId(`${id}-all`); setPage(1); setSearch(""); setNav("contacts")
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
    return r
  }, [isInbox, inboxId, typeId, view, search])

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
    }
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
            <Button variant="secondary" size="sm" icon={<ChevronDown size={14} />} iconPosition="right" onClick={() => setCatalog(true)}>
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

      <div className="mb-[24px]">
        <Filters
          searchPlaceholder={isInbox ? "Search across every readable type…" : `Search ${type.label.toLowerCase()}…`}
          searchValue={search}
          onSearchChange={v => { setSearch(v); setPage(1) }}
          showViewToggle={false}
          showSort={false}
        />
      </div>

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

      <EntityCatalog open={catalog} onClose={() => setCatalog(false)} current={typeId} onPick={pickType} />
    </ScreenLayout>
  )
}
