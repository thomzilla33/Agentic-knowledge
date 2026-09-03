/**
 * UCP — Contacts list.
 *
 * The entry point into the Unified Contact Profile. One roster for the three
 * record types AIMS OS keeps profiles for — People, Employees and Companies —
 * because the profile behind them is the same surface either way.
 *
 * Read-only: contacts arrive through ingestion and account sync, not through a
 * create form, so the Header's one main CTA is the concierge — ask it about the
 * roster instead of typing a record in.
 *
 * Navigation: Tabs (record type) → SwitchTab (cards vs. table) → Filters.
 * Row click opens the profile; the Eye opens a preview without leaving the list.
 */

import { useMemo, useState } from "react"
import { ScreenLayout }      from "@/components/layouts/screen-layout"
import { Header }            from "@/components/ui/header"
import { Tabs }              from "@/components/ui/tabs"
import { SwitchTab }         from "@/components/ui/switch-tab"
import { Filters }           from "@/components/ui/filters"
import { FiltersSlideout }   from "@/components/ui/filters-slideout"
import { Menu, MenuItem }    from "@/components/ui/menu-item"
import { Tag }               from "@/components/ui/tag"
import { Button }            from "@/components/ui/button"
import { CardContainer }     from "@/components/ui/card-container"
import { EntityList }        from "@/components/ui/entity-list"
import type { EntityListItemData } from "@/components/ui/entity-list"
import { Table }             from "@/components/ui/table"
import type { TableColumn }  from "@/components/ui/table"
import { TableCellAvatar, TableCellLink } from "@/components/ui/table"
import { EmptyState }        from "@/components/ui/empty-state"
import { Pagination }        from "@/components/ui/pagination"
import { SlideOut }          from "@/components/ui/slide-out"
import { ModalDialog }       from "@/components/ui/modal-dialog"
import { HighlightIcon }     from "@/components/ui/highlight-icon"
import { Input }             from "@/components/ui/input"
import { Chip }              from "@/components/ui/chip"
import { anchorFromEvent, useDropdownPosition } from "@/lib/dropdown-anchor"
import type { DropdownAnchor } from "@/lib/dropdown-anchor"
import { Sparkle, Send, Contact as ContactIcon, LayoutList, Table2 } from "lucide-react"
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
  { id: "people",    label: "People",    type: "person"   },
  { id: "employees", label: "Employees", type: "employee" },
  { id: "companies", label: "Companies", type: "company"  },
]

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

// ── Table columns ─────────────────────────────────────────────────────────────

const CONTACT_COLUMNS: TableColumn<UcpContact>[] = [
  {
    key: "name", header: "Name", width: "24%",
    render: r => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <TableCellAvatar name={r.name} size="sm" />
        <TableCellLink>{r.name}</TableCellLink>
      </div>
    ),
  },
  { key: "type",   header: "Type",   width: "11%", render: r => <Tag variant={TYPE_TAG[r.type]} size="sm">{TYPE_LABEL[r.type]}</Tag> },
  { key: "subtitle", header: "Context",           render: r => <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>{r.subtitle}</span> },
  { key: "owner",  header: "Owner",  width: "13%", render: r => <span style={{ fontSize: 12, color: "var(--foreground)" }}>{r.owner}</span> },
  { key: "lastInteraction", header: "Last interaction", width: "14%", render: r => <span style={{ fontSize: 12, color: "var(--field-supporting)", whiteSpace: "nowrap" }}>{r.lastInteraction}</span> },
  { key: "status", header: "Status", width: "10%", render: r => { const s = entityState(r); return <Tag variant={s.variant} size="sm">{s.label}</Tag> } },
]

// ── Screen ────────────────────────────────────────────────────────────────────

export default function PMThomasUcpContactsScreen() {
  const [openId,     setOpenId]     = useState<string | null>(null)
  const [tab,        setTab]        = useState("all")
  const [view,       setView]       = useState("cards")
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
    primaryMeta: [
      { iconName: "Info",  label: c.subtitle },
      { iconName: "Hash",  label: c.id       },
    ],
    secondaryMeta: [
      { iconName: "UserRound", label: `Owner · ${c.owner}` },
      { iconName: "Clock",     label: `Last interaction · ${c.lastInteraction}` },
      { iconName: "Mail",      label: c.email },
    ],
    aiInsight: {
      action:   "read",
      detail:   c.aiSummary.headline,
      viewMore: false,
    },
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
            <Button variant="main" size="sm" icon={<Sparkle size={13} />} onClick={() => setChatOpen(true)}>
              Ask the concierge
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

      <div className="mb-[24px]">
        <SwitchTab
          value={view}
          onChange={id => { setView(id); resetPage() }}
          aria-label="Result layout"
          items={[
            { id: "cards", label: "Cards", icon: <LayoutList size={14} /> },
            { id: "table", label: "Table", icon: <Table2 size={14} />     },
          ]}
        />
      </div>

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
            : "Contacts arrive through account sync and ingestion. They'll appear here once the first one lands."
          }
          ctaLabel={hasFilters ? "Clear filters" : undefined}
          onCta={hasFilters ? clearAll : undefined}
        />
      ) : view === "cards" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {paged.map(c => (
            <div key={c.id} onClickCapture={e => { setKebabAnchor(anchorFromEvent(e)) }}>
              <CardContainer size="sm" className="!p-0 overflow-hidden">
                <EntityList items={[{ ...toItem(c), onMenuClick: () => setKebab(c) }]} />
              </CardContainer>
            </div>
          ))}
        </div>
      ) : (
        <Table
          columns={CONTACT_COLUMNS}
          data={paged}
          size="sm"
          rowKey={r => r.id}
          onRowClick={r => setOpenId(r.id)}
        />
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

      <RosterConcierge open={chatOpen} onClose={() => setChatOpen(false)} total={CONTACTS.length} />
    </ScreenLayout>
  )
}
