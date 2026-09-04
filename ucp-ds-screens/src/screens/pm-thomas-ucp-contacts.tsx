/**
 * UCP — Contacts list.
 *
 * The entry point into the Unified Contact Profile. One roster for the three
 * record types AIMS OS keeps profiles for — People, Employees and Companies —
 * because the profile behind them is the same surface either way.
 *
 * Records arrive through ingestion and account sync, and can also be created
 * here. The Header's primary CTA names the entity type of the active tab —
 * Create New Contact on All, then Person / Employee / Company — because a
 * generic "Create" on a roster of three types does not say what it will make.
 *
 * A record created here has no `source`: source is the system a record was
 * pulled FROM, and per the Entity Header spec the slot is removed rather than
 * refilled when the entity was created in the platform itself.
 *
 * Navigation: Tabs (record type) → Filters. Cards are the only layout in this
 * version — the DS's SwitchTab is not shown by default and a table view is not
 * in scope yet. Row click opens the profile; the Eye opens a preview without
 * leaving the list.
 */

import { useMemo, useState } from "react"
import { ScreenLayout }      from "@/components/layouts/screen-layout"
import { Header }            from "@/components/ui/header"
import { Tabs }              from "@/components/ui/tabs"
import { Filters }           from "@/components/ui/filters"
import { FiltersSlideout }   from "@/components/ui/filters-slideout"
import { Menu, MenuItem }    from "@/components/ui/menu-item"
import { Tag }               from "@/components/ui/tag"
import { Button }            from "@/components/ui/button"
import { CardContainer }     from "@/components/ui/card-container"
import { EntityList }        from "@/components/ui/entity-list"
import type { EntityListItemData } from "@/components/ui/entity-list"
import { EmptyState }        from "@/components/ui/empty-state"
import { Pagination }        from "@/components/ui/pagination"
import { SlideOut }          from "@/components/ui/slide-out"
import { ModalDialog }       from "@/components/ui/modal-dialog"
import { HighlightIcon }     from "@/components/ui/highlight-icon"
import { Input }             from "@/components/ui/input"
import { Chip }              from "@/components/ui/chip"
import { anchorFromEvent, useDropdownPosition } from "@/lib/dropdown-anchor"
import type { DropdownAnchor } from "@/lib/dropdown-anchor"
import { Sparkle, Send, Plus, Contact as ContactIcon } from "lucide-react"
import { UcpProfileView, UCP_SIDEBAR_ITEMS } from "./pm-thomas-ucp-profile"
import {
  CONTACTS, CONCIERGE_PROMPTS, PLANE_META,
  STATUS_TAG, TYPE_ICON, TYPE_LABEL, TYPE_TAG, entityState,
  getActivity, getDrives, getFacts,
} from "./ucpShared"
import type { UcpContact, UcpEntityType, UcpStatus } from "./ucpShared"

const PAGE_SIZE = 10

const TYPE_TABS: { id: string; label: string; type: UcpEntityType | "all" }[] = [
  { id: "all",       label: "All",       type: "all"      },
  { id: "customers", label: "Customers", type: "person"   },
  { id: "employees", label: "Employees", type: "employee" },
  { id: "companies", label: "Companies", type: "company"  },
]

/**
 * The create CTA names what it will make, so it tracks the active tab. On All
 * the roster is mixed, so the label falls back to the module's own noun and the
 * form asks for the type.
 */
const CREATE_LABEL: Record<string, string> = {
  all:       "Create New Contact",
  customers: "Create New Customer",
  employees: "Create New Employee",
  companies: "Create New Company",
}

/** Which fields the create form asks for, per type. Six at most — past that it
 *  stops being a panel and becomes a page. */
const CREATE_FIELDS: Record<UcpEntityType, string[]> = {
  person:   ["Full name", "Title", "Company", "Email", "Phone", "Account owner"],
  employee: ["Full name", "Role", "Department", "Work email", "Manager", "Access role"],
  company:  ["Legal name", "Industry", "Headcount", "Account email", "Account owner", "Primary contact"],
}

type SortKey = "recent" | "name" | "owner"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Last interaction" },
  { key: "name",   label: "Name A\u2192Z"     },
  { key: "owner",  label: "Owner"             },
]

const STATUS_OPTIONS: UcpStatus[] = ["Active", "Inactive", "Archived"]
const OWNER_OPTIONS = Array.from(new Set(CONTACTS.map(c => c.owner))).sort()

// ── Roster concierge ──────────────────────────────────────────────────────────
// DS-GAP: agent chat panel — no chat component exists in src/components/ui/.
// Composed from SlideOut + Tag + Chip + Input + Button; the bubbles only
// rearrange existing tokens.

type RosterTurn = { id: string; from: "agent" | "user"; text: string; planes?: ("truth" | "sandbox" | "sources")[] }

function RosterConcierge({ open, onClose, total }: { open: boolean; onClose: () => void; total: number }) {
  const [turns, setTurns] = useState<RosterTurn[]>([
    {
      id: "t1", from: "agent",
      text: `I'm the Contacts concierge. I can read across all ${total} records in this roster and tell you which ones need a decision — I answer from each record's own planes, never from outside them.`,
    },
  ])
  const [draft, setDraft] = useState("")

  const ask = (question: string) => {
    if (!question.trim()) return
    setTurns(prev => [
      ...prev,
      { id: `u-${prev.length}`, from: "user", text: question },
      {
        id: `a-${prev.length + 1}`, from: "agent",
        text: "Three records carry an open commitment right now: Meridian Corp (renewal in 12 days), Sandra Torres (migration timeline asked twice, unanswered) and Kestrel Logistics (dormant 80 days since the pilot closed). Open any of them and I'll carry the context over.",
        planes: ["truth", "sandbox"],
      },
    ])
    setDraft("")
  }

  return (
    <SlideOut
      open={open}
      onClose={onClose}
      type="with-variants"
      size="m"
      title="Concierge"
      subtitle={`Contacts · ${total} records`}
      showIcon
      iconContent={<Sparkle size={14} />}
      showStatus
      statusLabel="Online"
      showTopButton={false}
      showTabs={false}
      showSearchBar={false}
      showChips={false}
      showCta={false}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
          {turns.map(turn => (
            <div
              key={turn.id}
              style={{
                alignSelf: turn.from === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%", display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <div
                style={{
                  background: turn.from === "user" ? "var(--field-bg)" : "var(--tag-purple-bg)",
                  border: `1px solid ${turn.from === "user" ? "var(--field-border)" : "var(--tag-purple-bd)"}`,
                  borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.6,
                  color: turn.from === "user" ? "var(--foreground)" : "var(--tag-purple-fg)",
                }}
              >
                {turn.text}
              </div>
              {turn.planes && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {turn.planes.map(p => (
                    <Tag key={p} variant={PLANE_META[p].tag} size="sm">{PLANE_META[p].label} plane</Tag>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 20px 20px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--field-border)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 10 }}>
            {CONCIERGE_PROMPTS.map(p => (
              <Chip key={p} size="s" variant="secondary" onClick={() => ask(p)}>{p}</Chip>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              placeholder="Ask about the roster…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") ask(draft) }}
            />
            <Button variant="primary" size="default" icon={<Send size={14} />} iconPosition="alone" aria-label="Send" onClick={() => ask(draft)} />
          </div>
        </div>
      </div>
    </SlideOut>
  )
}

// ── Create panel ──────────────────────────────────────────────────────────────
// A create form is non-destructive, so it is a SlideOut and not a ModalDialog.
// No `label` prop on Input — placeholder is the only field hint on desktop.

function CreatePanel({
  open, onClose, lockedType, onCreate,
}: {
  open:        boolean
  onClose:     () => void
  /** Set when a type tab is active; null on All, where the user picks. */
  lockedType:  UcpEntityType | null
  onCreate:    (type: UcpEntityType) => void
}) {
  const [type, setType]     = useState<UcpEntityType>(lockedType ?? "person")
  const [values, setValues] = useState<Record<string, string>>({})
  const [tried, setTried]   = useState(false)

  // Reopening on a different tab should follow the tab, not the last pick.
  const activeType = lockedType ?? type
  const fields     = CREATE_FIELDS[activeType]
  const complete   = fields.every(f => (values[f] ?? "").trim().length > 0)

  return (
    <SlideOut
      open={open}
      onClose={onClose}
      type="with-variants"
      size="m"
      title={`New ${TYPE_LABEL[activeType]}`}
      subtitle={`Contacts · ${fields.length} fields`}
      showIcon
      iconContent={<Plus size={14} />}
      showStatus={false}
      showTopButton={false}
      showTabs={false}
      showSearchBar={false}
      showChips={false}
      showCta
      ctaPrimaryLabel={`Create ${TYPE_LABEL[activeType]}`}
      ctaSecondaryLabel="Cancel"
      onCtaPrimary={() => {
        if (!complete) { setTried(true); return }
        onCreate(activeType)
        setValues({})
        setTried(false)
      }}
      onCtaSecondary={onClose}
    >
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 24 }}>
        {!lockedType && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>What are you creating?</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(Object.keys(CREATE_FIELDS) as UcpEntityType[]).map(t => (
                <Chip
                  key={t}
                  size="s"
                  variant={activeType === t ? "primary" : "secondary"}
                  onClick={() => { setType(t); setValues({}) }}
                >
                  {TYPE_LABEL[t]}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {fields.map(field => (
            <Input
              key={field}
              placeholder={field}
              value={values[field] ?? ""}
              onChange={e => setValues(v => ({ ...v, [field]: e.target.value }))}
            />
          ))}
        </div>

        <span style={{ fontSize: 12, color: "var(--field-supporting)", lineHeight: 1.6 }}>
          A record created here has no source system — its facts start on the Sandbox
          plane and get promoted as they are verified.
        </span>

        {tried && !complete && (
          <span style={{ fontSize: 12, color: "var(--field-text-error)" }}>
            {`Every field is required. ${fields.filter(f => !(values[f] ?? "").trim()).length} still empty.`}
          </span>
        )}
      </div>
    </SlideOut>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PMThomasUcpContactsScreen() {
  const [openId,     setOpenId]     = useState<string | null>(null)
  const [tab,        setTab]        = useState("all")
  const [page,       setPage]       = useState(1)
  const [pageSize,   setPageSize]   = useState(PAGE_SIZE)
  const [search,     setSearch]     = useState("")

  // Draft vs. applied — a chip never appears before Apply.
  const [status,     setStatus]     = useState<string | undefined>()
  const [owner,      setOwner]      = useState<string | undefined>()
  const [slideOpen,  setSlideOpen]  = useState(false)

  const [sortKey,    setSortKey]    = useState<SortKey>("recent")
  const [openSlot,   setOpenSlot]   = useState<"status" | "owner" | "sort" | null>(null)
  const [anchor,     setAnchor]     = useState<DropdownAnchor | null>(null)
  const dropdown = useDropdownPosition(anchor)

  const [preview,    setPreview]    = useState<UcpContact | null>(null)
  const [kebab,      setKebab]      = useState<UcpContact | null>(null)
  const [kebabAnchor, setKebabAnchor] = useState<DropdownAnchor | null>(null)
  const kebabDropdown = useDropdownPosition(kebabAnchor)
  const [archiving,  setArchiving]  = useState<UcpContact | null>(null)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const activeType = TYPE_TABS.find(t => t.id === tab)?.type ?? "all"

  const filtered = useMemo(() => CONTACTS.filter(c => {
    if (activeType !== "all" && c.type !== activeType) return false
    if (status && c.status !== status) return false
    if (owner  && c.owner  !== owner)  return false
    if (search) {
      const q = search.toLowerCase()
      if (![c.name, c.subtitle, c.email, c.company, c.owner, c.id].some(f => f.toLowerCase().includes(q))) return false
    }
    return true
  }), [activeType, status, owner, search])

  const sorted = useMemo(() => {
    const rows = [...filtered]
    if (sortKey === "name")   return rows.sort((a, b) => a.name.localeCompare(b.name))
    if (sortKey === "owner")  return rows.sort((a, b) => a.owner.localeCompare(b.owner) || a.name.localeCompare(b.name))
    return rows.sort((a, b) => Date.parse(b.lastInteraction) - Date.parse(a.lastInteraction))
  }, [filtered, sortKey])

  const paged = sorted.slice((page - 1) * pageSize, page * pageSize)

  const resetPage = () => setPage(1)
  const hasFilters = Boolean(status || owner || search)

  const clearAll = () => {
    setStatus(undefined)
    setOwner(undefined)
    setSearch("")
    resetPage()
  }

  const closeSlot = () => { setOpenSlot(null); setAnchor(null) }

  const pickSlot = (slot: "status" | "owner", value: string) => {
    if (slot === "status") setStatus(value)
    else setOwner(value)
    resetPage()
    closeSlot()
  }

  const pickSort = (key: SortKey) => {
    setSortKey(key)
    resetPage()
    closeSlot()
  }

  // ── Profile view takes over the whole screen ──
  const open = CONTACTS.find(c => c.id === openId)
  if (open) {
    return (
      <UcpProfileView
        contact={open}
        onBack={() => setOpenId(null)}
        onSidebarItemClick={id => { if (id === "contacts") setOpenId(null) }}
      />
    )
  }

  const toItem = (c: UcpContact): EntityListItemData => ({
    id:          c.id,
    title:       c.name,
    iconName:    TYPE_ICON[c.type],
    iconVariant: c.type === "company" ? "light-blue" : c.type === "employee" ? "purple" : "info",
    // Top row is context plus identifier: the source (one item, always visible,
    // per the shared content model) and the record ID.
    primaryMeta: [
      {
        iconName: c.source.iconName,
        label:    c.source.label,
        tooltip:  `Source · ${c.source.label}. The system this record was pulled from.`,
      },
      { iconName: "Hash", label: c.id, tooltip: `Record ID · ${c.id}` },
    ],
    // Secondary metadata. Four items, values only — no field labels on the row,
    // because the tooltip is what names the field. The spec puts a job title and
    // a parent company here explicitly ("NOT A SOURCE… they belong in tags or in
    // secondary metadata"), and qualifies the rest by whether someone could act
    // on it or governance needs it visible.
    secondaryMeta: [
      {
        iconName: "Info",
        label:    c.subtitle,
        tooltip:  `${c.type === "company" ? "Profile" : "Role"} · ${c.subtitle}`,
      },
      {
        iconName: "UserRound",
        label:    c.owner,
        tooltip:  `Account owner · ${c.owner}. Last interaction ${c.lastInteraction}.`,
      },
      {
        iconName: "ShieldCheck",
        label:    `${getFacts(c).filter(f => f.plane === "truth").length} verified`,
        tooltip:  `Verified facts · ${getFacts(c).filter(f => f.plane === "truth").length} on the Truth plane of ${getFacts(c).length} total.`,
      },
      // The spec names the assigned agent as qualifying metadata, and AIMS OS
      // is agent-first, so every record has one. An open-items count would sit
      // better here, but it is only modelled on 7 of the 16 records — printing
      // "None open" for the other 9 would be false on several of them, so that
      // number needs a real field before it can go on the row.
      {
        iconName: "Bot",
        label:    c.agent.name,
        tooltip:  `Assigned agent · ${c.agent.name}. Opens a chat scoped to this record.`,
      },
    ],
    // The row carries the record's Next Best Action, not the agent's summary.
    // A roster is scanned to decide what to open next, and the recommendation is
    // what answers that; the agent's read still lives in the Overview widget and
    // in the Eye preview, where there is room for it.
    //
    // The block renders the same purple family the Next Best Action card uses on
    // the profile, so the row and the card speak the same language. Title,
    // when, and why — without the rationale it would be an order, not a
    // proposal. It collapses past 80 characters and View more opens the record,
    // which is the card's own default path.
    //
    // No action, no block: "there is nothing to say when there is nothing to
    // do." The absence is the signal — a reader scans for purple to find the
    // records that want a decision.
    aiInsight: c.nba
      ? {
          action:   "Next Best Action",
          detail:   `${c.nba.title} · ${c.nba.timestamp}${c.nba.rationale ? ` — ${c.nba.rationale}` : ""}`,
          viewMore: true,
          onViewMore: () => setOpenId(c.id),
        }
      : undefined,
    tags:  [{ label: TYPE_LABEL[c.type] }],
    state: entityState(c),
    showMenu:    true,
    onMenuClick: () => {},
    actions: [{ label: "Preview", variant: "tertiary", icon: "Eye", onClick: () => setPreview(c) }],
    onClick: () => setOpenId(c.id),
  })

  return (
    <ScreenLayout
      workspaceName="Acme Corp"
      userName="Thomas González"
      userEmail="thomas.gonzalez@aimsos.ai"
      sidebarItems={UCP_SIDEBAR_ITEMS}
      activeSidebarId="contacts"
      header={isScrolled => (
        <Header
          size={isScrolled ? "compress" : "size-l"}
          title="Contacts"
          description="Every person, employee and company AIMS OS keeps a unified profile for."
          primaryAction={
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setCreateOpen(true)}>
              {CREATE_LABEL[tab] ?? CREATE_LABEL.all}
            </Button>
          }
          secondaryAction={
            <Button variant="secondary" size="sm" icon={<Sparkle size={13} />} onClick={() => setChatOpen(true)}>
              Ask
            </Button>
          }
        />
      )}
      pagination={
        filtered.length > pageSize
          ? (
              <Pagination
                currentPage={page}
                totalItems={filtered.length}
                itemsPerPage={pageSize}
                onPageChange={setPage}
                onItemsPerPageChange={n => { setPageSize(n); resetPage() }}
                rowsPerPageOptions={[10, 25, 50]}
              />
            )
          : undefined
      }
    >
      <Tabs
        className="mb-[24px]"
        activeId={tab}
        onChange={id => { setTab(id); resetPage() }}
        items={TYPE_TABS.map(t => ({ id: t.id, label: t.label }))}
      />

      <div className="mb-[24px]" onClickCapture={e => setAnchor(anchorFromEvent(e))}>
        <Filters
          showSearch
          searchPlaceholder="Search by name, company, owner or ID…"
          searchValue={search}
          onSearchChange={v => { setSearch(v); resetPage() }}
          slots={[
            { placeholder: "Status", value: status, onOpen: () => setOpenSlot("status"), onRemove: () => { setStatus(undefined); resetPage() } },
            { placeholder: "Owner",  value: owner,  onOpen: () => setOpenSlot("owner"),  onRemove: () => { setOwner(undefined);  resetPage() } },
          ]}
          showAllFilters
          onAllFiltersClick={() => setSlideOpen(true)}
          showClearFilters={hasFilters}
          onClearFilters={clearAll}
          showSort
          sortLabel={SORT_OPTIONS.find(o => o.key === sortKey)?.label}
          onSortClick={() => setOpenSlot("sort")}
          showViewToggle={false}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ContactIcon}
          title={hasFilters ? "No contacts found" : "No contacts yet"}
          description={hasFilters
            ? "Try adjusting your filters or search term."
            : "Records arrive through account sync and ingestion, or you can create the first one here."
          }
          ctaLabel={hasFilters ? "Clear filters" : (CREATE_LABEL[tab] ?? CREATE_LABEL.all)}
          onCta={hasFilters ? clearAll : () => setCreateOpen(true)}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paged.map(c => (
            <div key={c.id} onClickCapture={e => { setKebabAnchor(anchorFromEvent(e)) }}>
              <CardContainer size="sm" className="!p-0 overflow-hidden">
                <EntityList items={[{ ...toItem(c), onMenuClick: () => setKebab(c) }]} />
              </CardContainer>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter slot dropdowns ── */}
      {openSlot && anchor && (
        <>
          <div className="fixed inset-0 z-[10000]" onClick={closeSlot} />
          <div ref={dropdown.ref} style={{ position: "fixed", zIndex: 10001, ...dropdown.style }}>
            <Menu>
              {openSlot === "sort"
                ? SORT_OPTIONS.map(option => (
                    <MenuItem
                      key={option.key}
                      size="sm"
                      label={option.label}
                      state={sortKey === option.key ? "focus" : "default"}
                      onClick={() => pickSort(option.key)}
                    />
                  ))
                : (openSlot === "status" ? STATUS_OPTIONS : OWNER_OPTIONS).map(option => (
                    <MenuItem
                      key={option}
                      size="sm"
                      label={option}
                      onClick={() => pickSlot(openSlot, option)}
                    />
                  ))
              }
            </Menu>
          </div>
        </>
      )}

      {/* ── Row kebab — Archive + Duplicate are the DS defaults ── */}
      {kebab && kebabAnchor && (
        <>
          <div className="fixed inset-0 z-[10000]" onClick={() => setKebab(null)} />
          <div ref={kebabDropdown.ref} style={{ position: "fixed", zIndex: 10001, ...kebabDropdown.style }}>
            <Menu>
              <MenuItem size="sm" label="Archive"   leadingIcon={<HighlightIcon size="sm" variant="neutral" iconName="Archive" />}  onClick={() => { setArchiving(kebab); setKebab(null) }} />
              <MenuItem size="sm" label="Duplicate" leadingIcon={<HighlightIcon size="sm" variant="neutral" iconName="Copy" />}     onClick={() => setKebab(null)} />
            </Menu>
          </div>
        </>
      )}

      {/* ── All filters ── */}
      <FiltersSlideout
        isOpen={slideOpen}
        onClose={() => setSlideOpen(false)}
        onApply={() => { resetPage(); setSlideOpen(false) }}
        onClearAll={clearAll}
        activeFilters={[
          ...(status ? [{ label: "Status", value: status, onRemove: () => { setStatus(undefined); resetPage() } }] : []),
          ...(owner  ? [{ label: "Owner",  value: owner,  onRemove: () => { setOwner(undefined);  resetPage() } }] : []),
        ]}
      />

      {/* ── Row preview — the profile without leaving the list ── */}
      <SlideOut
        open={preview !== null}
        onClose={() => setPreview(null)}
        type="with-variants"
        size="m"
        title={preview?.name ?? ""}
        subtitle={preview ? `${TYPE_LABEL[preview.type]} · ${preview.company}` : ""}
        showIcon
        iconContent={<Sparkle size={14} />}
        showStatus={false}
        showTopButton={false}
      showTabs={false}
      showSearchBar={false}
      showChips={false}
      showCta={false}
      >
        {preview && (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Tag variant={STATUS_TAG[preview.status]} size="sm">{preview.status}</Tag>
              <Tag variant={TYPE_TAG[preview.type]} size="sm">{TYPE_LABEL[preview.type]}</Tag>
            </div>
            <div
              style={{
                background: "var(--tag-purple-bg)", border: "1px solid var(--tag-purple-bd)",
                borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tag-purple-fg)" }}>
                {preview.agent.name} · {preview.aiSummary.confidence}% confidence
              </span>
              <span style={{ fontSize: 12, color: "var(--tag-purple-fg)", lineHeight: 1.6 }}>
                {preview.aiSummary.detail}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Record ID",        value: preview.id                                       },
                { label: "Owner",            value: preview.owner                                    },
                { label: "Email",            value: preview.email                                    },
                { label: "Last interaction", value: preview.lastInteraction                          },
                { label: "Verified facts",   value: `${getFacts(preview).filter(f => f.plane === "truth").length} on the Truth plane` },
                { label: "Activity",         value: `${getActivity(preview).length} events`          },
                { label: "Drives attached",  value: `${getDrives(preview).length} sources`           },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <Button
              variant="primary"
              size="sm"
              className="self-start"
              onClick={() => { setOpenId(preview.id); setPreview(null) }}
            >
              Open full profile
            </Button>
          </div>
        )}
      </SlideOut>

      <ModalDialog
        isOpen={archiving !== null}
        onClose={() => setArchiving(null)}
        tone="warning"
        iconName="Archive"
        title={`Archive ${archiving?.name ?? "this contact"}?`}
        description="The record moves out of active views and its assigned agent stops acting on it. Facts and drives are kept, and you can restore it later."
        ctaPrimary={{ label: "Archive", onClick: () => setArchiving(null) }}
        ctaSecondary={{ label: "Cancel", onClick: () => setArchiving(null) }}
      />

      <CreatePanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        lockedType={activeType === "all" ? null : activeType}
        onCreate={() => setCreateOpen(false)}
      />

      <RosterConcierge open={chatOpen} onClose={() => setChatOpen(false)} total={CONTACTS.length} />
    </ScreenLayout>
  )
}
