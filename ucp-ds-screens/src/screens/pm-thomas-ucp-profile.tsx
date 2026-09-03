/**
 * UCP — Unified Contact Profile (detail view).
 *
 * Read-only by design: the record is assembled by ingestion and agents, not
 * typed in here, so there is no create/edit CTA in the Header. The one
 * always-present entry point is the record's assigned concierge — RecordHeader's
 * agent button — which opens a chat scoped to this record.
 *
 * Tabs: Overview · Snapshot · Activity · Drives
 *   Overview  → WidgetCanvasView (DS rule: any tab named Overview is a canvas)
 *   Snapshot  → this record's facts by knowledge plane (Truth / Sandbox / Sources)
 *   Activity  → interaction timeline, paginated
 *   Drives    → the Source Drives attached to this record
 */

import { useMemo, useState } from "react"
import { ScreenLayout }      from "@/components/layouts/screen-layout"
import { WidgetCanvasView }  from "@/components/layouts/widget-canvas-view"
import type { CanvasSlot }   from "@/components/layouts/widget-canvas-view"
import { useWidgetSize }     from "@/components/layouts/widget-canvas-view"
import type { SidebarItem }  from "@/components/ui/sidebar"
import { Header }            from "@/components/ui/header"
import { Breadcrumb }        from "@/components/ui/breadcrumb"
import { Tabs }              from "@/components/ui/tabs"
import { Tag }               from "@/components/ui/tag"
import { Chip }              from "@/components/ui/chip"
import { Button }            from "@/components/ui/button"
import { Input }             from "@/components/ui/input"
import { Table }             from "@/components/ui/table"
import type { TableColumn }  from "@/components/ui/table"
import { CardContainer }     from "@/components/ui/card-container"
import { EntityList }        from "@/components/ui/entity-list"
import type { EntityListItemData } from "@/components/ui/entity-list"
import { EmptyState }        from "@/components/ui/empty-state"
import { HighlightIcon }     from "@/components/ui/highlight-icon"
import { Pagination }        from "@/components/ui/pagination"
import { SlideOut }          from "@/components/ui/slide-out"
import { RecordHeader, RECORD_HEADER_RECOMMENDED_ACTIONS } from "@/components/ui/record-header"
import { Sparkle, Send, ScanLine, Inbox, HardDrive } from "lucide-react"
import {
  CONTACTS, PLANE_META, PLANE_ORDER, CHANNEL_META, CONCIERGE_PROMPTS,
  RECORD_VARIANT, STATUS_TAG,
  buildRecord, getActivity, getConciergeOpening, getConnections, getDrives,
  getFacts, getGovernance, getRisk,
} from "./ucpShared"
import type {
  ActivityChannel, ConciergeTurn, KnowledgePlane, StudyState, UcpContact, UcpDrive, UcpFact,
} from "./ucpShared"

export const UCP_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "home",       label: "Home",       icon: "Home"      },
  { id: "work",       label: "My Work",    icon: "Inbox"     },
  { id: "contacts",   label: "Contacts",   icon: "Contact"   },
  { id: "agents",     label: "Agents",     icon: "Bot"       },
  { id: "workflows",  label: "Workflows",  icon: "Zap"       },
  { id: "knowledge",  label: "Knowledge",  icon: "BookOpen"  },
  { id: "governance", label: "Governance", icon: "Shield"    },
  { id: "admin",      label: "Admin",      icon: "Settings"  },
]

const ACTIVITY_PAGE_SIZE = 8

// ── Study widget — hidden when the study returned nothing, retry when it failed ─

function StudyWidget({ title, state, children }: { title: string; state: StudyState; children: React.ReactNode }) {
  if (state === "empty") return null
  if (state === "error") {
    return (
      <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HighlightIcon size="sm" variant="error" iconName="AlertCircle" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Failed to load</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>
          {title} data couldn&apos;t be retrieved for this record.
        </span>
        <Button variant="tertiary" size="sm" className="self-start !px-0" onClick={() => {}}>
          Retry
        </Button>
      </div>
    )
  }
  return <>{children}</>
}

/** Metric rows shared by the Governance and Risk study widgets. */
function MetricRows({ rows }: { rows: { label: string; value: string; icon: string; variant: "success" | "alert" | "informative" | "neutral" }[] }) {
  const { availableHeight } = useWidgetSize()
  // 34px pitch per single-line metric row, 70px for the widget's title chrome + padding.
  const maxRows = availableHeight ? Math.max(2, Math.floor((availableHeight - 70) / 34)) : rows.length
  return (
    <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.slice(0, maxRows).map(row => (
        <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>{row.label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
            <HighlightIcon size="sm" variant={row.variant} iconName={row.icon} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{row.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ConnectionsContent({ contact }: { contact: UcpContact }) {
  const { availableHeight } = useWidgetSize()
  const connections  = getConnections(contact)
  // 44px pitch per icon + two-line row, 70px for the widget's title chrome +
  // padding. At the default 4-row slot height that lands on 3 without clipping.
  const maxRows      = availableHeight ? Math.max(2, Math.floor((availableHeight - 70) / 44)) : 3
  const visible      = connections.slice(0, maxRows)
  const hidden       = connections.length - visible.length
  return (
    <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {visible.map(c => (
        <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <HighlightIcon size="sm" variant="neutral" iconName={c.icon} />
          <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
            <span style={{ fontSize: 11, color: "var(--field-supporting)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.relation}</span>
          </div>
        </div>
      ))}
      {hidden > 0 && (
        <Button variant="tertiary" size="sm" className="self-start !px-0" onClick={() => {}}>
          {`View ${hidden} more`}
        </Button>
      )}
    </div>
  )
}

/** The assigned agent's read on this record. Purple = "AI produced this",
 *  the same treatment EntityList's own aiInsight block uses. */
function AiSummaryContent({ contact, onAsk }: { contact: UcpContact; onAsk: () => void }) {
  const { isNarrow } = useWidgetSize()
  return (
    <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          background: "var(--tag-purple-bg)",
          border: "1px solid var(--tag-purple-bd)",
          borderRadius: 8,
          padding: "12px 14px",
          display: "flex", flexDirection: "column", gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkle size={13} style={{ color: "var(--tag-purple-bd)" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tag-purple-fg)" }}>
            {contact.agent.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--tag-purple-fg)", opacity: 0.75, marginLeft: "auto" }}>
            {contact.aiSummary.confidence}% confidence
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--tag-purple-fg)", lineHeight: 1.4 }}>
          {contact.aiSummary.headline}
        </span>
        {!isNarrow && (
          <span style={{ fontSize: 12, color: "var(--tag-purple-fg)", opacity: 0.9, lineHeight: 1.55 }}>
            {contact.aiSummary.detail}
          </span>
        )}
      </div>
      {!isNarrow && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--field-supporting)" }}>Drawn from</span>
          {PLANE_ORDER.map(plane => (
            <Tag key={plane} variant={PLANE_META[plane].tag} size="sm">
              {PLANE_META[plane].label} · {getFacts(contact).filter(f => f.plane === plane).length}
            </Tag>
          ))}
        </div>
      )}
      <Button variant="primary" size="sm" className="self-start" icon={<Sparkle size={13} />} onClick={onAsk}>
        Ask the concierge
      </Button>
    </div>
  )
}

// ── Snapshot (Truth Facts) ────────────────────────────────────────────────────

const FACT_COLUMNS: TableColumn<UcpFact>[] = [
  {
    key: "label", header: "Fact", width: "22%",
    render: r => <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{r.label}</span>,
  },
  {
    key: "value", header: "Value",
    render: r => <span style={{ fontSize: 12, color: "var(--foreground)" }}>{r.value}</span>,
  },
  {
    key: "plane", header: "Plane", width: "14%",
    render: r => <Tag variant={PLANE_META[r.plane].tag} size="sm">{PLANE_META[r.plane].label}</Tag>,
  },
  {
    key: "confidence", header: "Confidence", width: "11%", align: "right",
    render: r => <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{PLANE_META[r.plane].confidence}</span>,
  },
  {
    key: "source", header: "Source", width: "22%",
    render: r => <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>{r.source}</span>,
  },
  {
    key: "verifiedAt", header: "Last verified", width: "14%",
    render: r => <span style={{ fontSize: 12, color: "var(--field-supporting)", whiteSpace: "nowrap" }}>{r.verifiedAt}</span>,
  },
]

function SnapshotTab({ contact }: { contact: UcpContact }) {
  const [plane, setPlane] = useState<KnowledgePlane | "all">("all")
  const facts   = useMemo(() => getFacts(contact), [contact])
  const visible = plane === "all" ? facts : facts.filter(f => f.plane === plane)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Plane summary — what the system holds as true about this record, and how sure it is */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {PLANE_ORDER.map(p => {
          const meta  = PLANE_META[p]
          const count = facts.filter(f => f.plane === p).length
          return (
            <CardContainer key={p} variant="default" size="sm">
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <Tag variant={meta.tag} size="sm">{meta.label} plane</Tag>
                  <span style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: "var(--color-text-title)" }}>{count}</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--field-supporting)", lineHeight: 1.5 }}>{meta.blurb}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>Confidence {meta.confidence}</span>
              </div>
            </CardContainer>
          )
        })}
      </div>

      {/* Plane filter — a selection toggle, so primary/secondary, not a semantic color */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Chip size="s" variant={plane === "all" ? "primary" : "secondary"} onClick={() => setPlane("all")}>
          All facts ({facts.length})
        </Chip>
        {PLANE_ORDER.map(p => (
          <Chip
            key={p}
            size="s"
            variant={plane === p ? "primary" : "secondary"}
            onClick={() => setPlane(p)}
          >
            {PLANE_META[p].label} ({facts.filter(f => f.plane === p).length})
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="No facts on this plane"
          description="Nothing has been recorded on this plane for this contact yet."
          ctaLabel="Show all facts"
          onCta={() => setPlane("all")}
        />
      ) : (
        <Table columns={FACT_COLUMNS} data={visible} size="sm" rowKey={r => r.id} />
      )}
    </div>
  )
}

// ── Activity ──────────────────────────────────────────────────────────────────

function ActivityTab({
  contact, channel, onChannelChange, page, pageSize,
}: {
  contact:  UcpContact
  channel:  ActivityChannel | "all"
  onChannelChange: (c: ActivityChannel | "all") => void
  page:     number
  pageSize: number
}) {
  const all      = useMemo(() => getActivity(contact), [contact])
  const filtered = channel === "all" ? all : all.filter(a => a.channel === channel)
  const paged    = filtered.slice((page - 1) * pageSize, page * pageSize)

  const items: EntityListItemData[] = paged.map(a => ({
    id:          a.id,
    title:       a.title,
    iconName:    CHANNEL_META[a.channel].icon,
    iconVariant: a.channel === "agent" ? "purple" : a.channel === "system" ? "neutral" : "info",
    primaryMeta: [{ iconName: "Clock", label: a.timestamp }],
    secondaryMeta: [{ iconName: "Info", label: a.meta }],
    state:       { label: a.state.label, variant: a.state.variant },
    aiInsight:   a.aiSummary
      ? { action: "summary", detail: a.aiSummary, viewMore: a.aiSummary.length > 160 }
      : undefined,
  }))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Chip size="s" variant={channel === "all" ? "primary" : "secondary"} onClick={() => onChannelChange("all")}>
          All ({all.length})
        </Chip>
        {(Object.keys(CHANNEL_META) as ActivityChannel[]).map(c => (
          <Chip
            key={c}
            size="s"
            variant={channel === c ? "primary" : "secondary"}
            onClick={() => onChannelChange(c)}
          >
            {CHANNEL_META[c].label} ({all.filter(a => a.channel === c).length})
          </Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No activity on this channel"
          description="Try another channel, or clear the filter to see the full timeline."
          ctaLabel="Clear filter"
          onCta={() => onChannelChange("all")}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(item => (
            <CardContainer key={item.id} size="sm" className="!p-0 overflow-hidden">
              <EntityList items={[item]} />
            </CardContainer>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Drives ────────────────────────────────────────────────────────────────────

function DrivesTab({ contact, onPreview }: { contact: UcpContact; onPreview: (d: UcpDrive) => void }) {
  const drives = useMemo(() => getDrives(contact), [contact])

  if (drives.length === 0) {
    return (
      <EmptyState
        icon={HardDrive}
        title="No drives attached"
        description="Source Drives connected to this contact will appear here."
      />
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {drives.map(d => (
        <CardContainer key={d.id} size="sm" className="!p-0 overflow-hidden">
          <EntityList
            items={[{
              id:          d.id,
              title:       d.name,
              iconName:    d.kind === "Document" ? "FileText" : d.kind === "Drive" ? "HardDrive" : "Folder",
              iconVariant: d.state.variant === "error" ? "error" : d.state.variant === "alert" ? "yellow" : "light-blue",
              primaryMeta: [
                { iconName: "Cloud",  label: d.provider },
                { iconName: "Files",  label: d.items    },
              ],
              secondaryMeta: [
                { iconName: "User",         label: `Owner · ${d.owner}` },
                { iconName: "RefreshCw",    label: `Last sync · ${d.lastSync}` },
                { iconName: "Share2",       label: d.scope },
              ],
              tags:    [{ label: d.kind }],
              state:   { label: d.state.label, variant: d.state.variant },
              actions: [{ label: "Preview", variant: "tertiary", icon: "Eye", onClick: () => onPreview(d) }],
            }]}
          />
        </CardContainer>
      ))}
    </div>
  )
}

// ── Concierge chat ────────────────────────────────────────────────────────────
// DS-GAP: agent chat panel — there is no chat component in src/components/ui/.
// Composed here from SlideOut + CardContainer + Tag + Input + Button per the
// "compose before you build" rule; the message bubbles are the only bespoke
// arrangement, and they only rearrange existing tokens.

function ConciergeChat({
  contact, open, onClose,
}: {
  contact: UcpContact
  open:    boolean
  onClose: () => void
}) {
  const [turns, setTurns] = useState<ConciergeTurn[]>(() => getConciergeOpening(contact))
  const [draft, setDraft] = useState("")

  const ask = (question: string) => {
    if (!question.trim()) return
    setTurns(prev => [
      ...prev,
      { id: `u-${prev.length}`, from: "user", text: question },
      {
        id: `a-${prev.length + 1}`, from: "agent",
        text: `Here's what this record supports for that. Everything below is drawn from ${contact.name}'s own planes — nothing inferred from outside this profile.`,
        sources: [
          { label: "Interaction history", plane: "truth"   },
          { label: "Call notes — Aug 28", plane: "sandbox" },
        ],
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
      subtitle={`${contact.agent.name} · ${contact.name}`}
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
                maxWidth: "90%",
                display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <div
                style={{
                  background: turn.from === "user" ? "var(--field-bg)" : "var(--tag-purple-bg)",
                  border: `1px solid ${turn.from === "user" ? "var(--field-border)" : "var(--tag-purple-bd)"}`,
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: turn.from === "user" ? "var(--foreground)" : "var(--tag-purple-fg)",
                }}
              >
                {turn.text}
              </div>
              {turn.sources && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {turn.sources.map(s => (
                    <Tag key={s.label} variant={PLANE_META[s.plane].tag} size="sm">
                      {PLANE_META[s.plane].label} · {s.label}
                    </Tag>
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
              placeholder={`Ask about ${contact.name}…`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") ask(draft) }}
            />
            <Button
              variant="primary"
              size="default"
              icon={<Send size={14} />}
              iconPosition="alone"
              aria-label="Send"
              onClick={() => ask(draft)}
            />
          </div>
        </div>
      </div>
    </SlideOut>
  )
}

// ── Profile view ──────────────────────────────────────────────────────────────

export function UcpProfileView({
  contact, onBack, onSidebarItemClick,
}: {
  contact: UcpContact
  onBack?: () => void
  onSidebarItemClick?: (id: string) => void
}) {
  const [tab,        setTab]        = useState("overview")
  const [channel,    setChannel]    = useState<ActivityChannel | "all">("all")
  const [actPage,    setActPage]    = useState(1)
  const [actSize,    setActSize]    = useState(ACTIVITY_PAGE_SIZE)
  const [chatOpen,   setChatOpen]   = useState(false)
  const [drivePeek,  setDrivePeek]  = useState<UcpDrive | null>(null)

  const variant = RECORD_VARIANT[contact.type]
  const record  = useMemo(() => buildRecord(contact), [contact])

  const activityCount = useMemo(() => {
    const all = getActivity(contact)
    return channel === "all" ? all.length : all.filter(a => a.channel === channel).length
  }, [contact, channel])

  const overviewSlots = useMemo<CanvasSlot[]>(() => {
    const slots: CanvasSlot[] = [
      {
        uid: "ai-summary", title: `${contact.agent.name} — read on this record`,
        colSpan: 3, widthClass: "full", rowSpan: 5,
        content: <AiSummaryContent contact={contact} onAsk={() => setChatOpen(true)} />,
      },
    ]
    if (contact.governance !== "empty") {
      slots.push({
        uid: "governance", title: "Governance", colSpan: 1, rowSpan: 4,
        content: (
          <StudyWidget title="Governance" state={contact.governance}>
            <MetricRows rows={getGovernance(contact)} />
          </StudyWidget>
        ),
      })
    }
    if (contact.risk !== "empty") {
      slots.push({
        uid: "risk", title: "Risk", colSpan: 1, rowSpan: 4,
        content: (
          <StudyWidget title="Risk" state={contact.risk}>
            <MetricRows rows={getRisk(contact)} />
          </StudyWidget>
        ),
      })
    }
    if (contact.connections !== "empty") {
      slots.push({
        uid: "connections", title: "Connections", colSpan: 1, rowSpan: 4,
        content: (
          <StudyWidget title="Connections" state={contact.connections}>
            <ConnectionsContent contact={contact} />
          </StudyWidget>
        ),
      })
    }
    slots.push({
      uid: "recent-activity", title: "Recent activity", colSpan: 3, widthClass: "full",
      content: (
        <div style={{ padding: "0 16px 16px" }}>
          <Table
            size="sm"
            rowKey={r => r.id}
            data={getActivity(contact).slice(0, 5)}
            columns={[
              { key: "timestamp", header: "When",    width: "18%", render: r => <span style={{ fontSize: 12, color: "var(--field-supporting)", whiteSpace: "nowrap" }}>{r.timestamp}</span> },
              { key: "channel",   header: "Channel", width: "12%", render: r => <Tag variant="neutral" size="sm">{CHANNEL_META[r.channel].label}</Tag> },
              { key: "title",     header: "Event",                 render: r => <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{r.title}</span> },
              { key: "meta",      header: "Detail",  width: "30%", render: r => <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>{r.meta}</span> },
              { key: "state",     header: "Status",  width: "14%", render: r => <Tag variant={r.state.variant} size="sm">{r.state.label}</Tag> },
            ]}
          />
          <Button
            variant="tertiary"
            size="sm"
            className="!px-0 mt-[8px]"
            onClick={() => { setTab("activity"); setActPage(1) }}
          >
            View full timeline
          </Button>
        </div>
      ),
    })
    return slots
  }, [contact])

  const goTab = (id: string) => {
    setTab(id)
    setActPage(1)
  }

  return (
    <ScreenLayout
      workspaceName="Acme Corp"
      userName="Thomas González"
      userEmail="thomas.gonzalez@aimsos.ai"
      sidebarItems={UCP_SIDEBAR_ITEMS}
      activeSidebarId="contacts"
      onSidebarItemClick={onSidebarItemClick}
      header={isScrolled => (
        <Header
          size={isScrolled ? "compress" : "size-l"}
          title={contact.name}
          description={contact.subtitle}
          tag={<Tag variant={STATUS_TAG[contact.status]} size="sm">{contact.status}</Tag>}
          breadcrumb={
            <Breadcrumb
              depth={2}
              items={[{ label: "Contacts", href: "contacts" }, { label: contact.name }]}
              onNavigate={() => onBack?.()}
            />
          }
        />
      )}
      pagination={
        tab === "activity" && activityCount > actSize
          ? (
              <Pagination
                currentPage={actPage}
                totalItems={activityCount}
                itemsPerPage={actSize}
                onPageChange={setActPage}
                onItemsPerPageChange={n => { setActSize(n); setActPage(1) }}
                rowsPerPageOptions={[8, 25, 50]}
              />
            )
          : undefined
      }
    >
      <RecordHeader
        variant={variant}
        data={record}
        signal={contact.signal}
        assignedAgent={{
          id:         contact.agent.id,
          name:       contact.agent.name,
          onOpenChat: () => setChatOpen(true),
        }}
        actions={RECORD_HEADER_RECOMMENDED_ACTIONS[variant]}
      />

      <Tabs
        className="mt-[24px] mb-[24px]"
        activeId={tab}
        onChange={goTab}
        items={[
          { id: "overview", label: "Overview" },
          { id: "snapshot", label: "Snapshot" },
          { id: "activity", label: "Activity" },
          { id: "drives",   label: "Drives"   },
        ]}
      />

      {tab === "overview" && <WidgetCanvasView initialSlots={overviewSlots} />}
      {tab === "snapshot" && <SnapshotTab contact={contact} />}
      {tab === "activity" && (
        <ActivityTab
          contact={contact}
          channel={channel}
          onChannelChange={c => { setChannel(c); setActPage(1) }}
          page={actPage}
          pageSize={actSize}
        />
      )}
      {tab === "drives" && <DrivesTab contact={contact} onPreview={setDrivePeek} />}

      <ConciergeChat contact={contact} open={chatOpen} onClose={() => setChatOpen(false)} />

      <SlideOut
        open={drivePeek !== null}
        onClose={() => setDrivePeek(null)}
        type="with-variants"
        size="m"
        title={drivePeek?.name ?? ""}
        subtitle={drivePeek ? `${drivePeek.kind} · ${drivePeek.provider}` : ""}
        showIcon
        iconContent={<HardDrive size={14} />}
        showStatus={false}
        showTopButton={false}
      showTabs={false}
      showSearchBar={false}
      showChips={false}
      showCta={false}
      >
        {drivePeek && (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <Tag variant={drivePeek.state.variant} size="sm">{drivePeek.state.label}</Tag>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Provider",  value: drivePeek.provider },
                { label: "Contents",  value: drivePeek.items    },
                { label: "Owner",     value: drivePeek.owner    },
                { label: "Last sync", value: drivePeek.lastSync },
                { label: "Scope",     value: drivePeek.scope    },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--field-supporting)", lineHeight: 1.6 }}>
              Drives feed the Sources plane. Anything here can be cited by {contact.agent.name}, but never
              promoted to Truth without a verification step.
            </span>
          </div>
        )}
      </SlideOut>
    </ScreenLayout>
  )
}

// ── Standalone registration ───────────────────────────────────────────────────
// Deep link lands on the flagship record; the Contacts list renders this same
// component when a row is opened.

export default function PMThomasUcpProfileScreen() {
  const contact = CONTACTS.find(c => c.id === "ORG-0023") ?? CONTACTS[0]
  return <UcpProfileView contact={contact} />
}
