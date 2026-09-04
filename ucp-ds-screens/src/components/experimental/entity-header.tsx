// DS-GAP: EntityHeader — identity card for a Unified Entity Profile. Built from
// Figma node 19815-101547 ("Entity Header - WIP"). Closest DS component:
// RecordHeader (src/components/ui/record-header.tsx), which this supersedes on
// UEP surfaces — see "Why not RecordHeader" below. Not promoted: the Figma
// frame is still marked WIP, so this stays in experimental/ until Michael
// signs it off and it gets a non-WIP node.

/**
 * Entity Header — AIMS OS
 *
 * Identity card for a Unified Entity Profile. It identifies the entity you are
 * looking at and surfaces what needs attention. It carries no detail — detail
 * lives in the tabs below. It answers four questions, in this order:
 *
 *   1 · What is this?             → visual + title
 *   2 · Where does it sit?        → source
 *   3 · What is its status?       → state badge
 *   4 · What needs attention?     → tags
 *
 * It does not answer *why*. That is the Overview's job.
 *
 * ── Why not RecordHeader ──────────────────────────────────────────────────
 * RecordHeader branches on three record shapes (employee / customer / client)
 * and carries the Next Best Action inside itself as a Signal bar. The Figma
 * spec for this component does neither:
 *   - Nothing in the structure is specific to a record shape. The same skeleton
 *     has to hold a contact, a repair order and a store, so the only branch is
 *     avatar-vs-highlight-icon, decided by whether the entity has a real-world
 *     visual identity.
 *   - The Next Best Action is a separate Card below the header, not a slot
 *     inside it ("Under the header, never inside it… The header identifies the
 *     entity; the card proposes"). See next-best-action-card.tsx.
 * Both are load-bearing, so this is a different component rather than a
 * variant of that one.
 *
 * ── It has no container of its own ────────────────────────────────────────
 * Per the spec, the header is never placed directly on a page and never grows
 * its own background — "a header with its own background inside a card
 * produces a box within a box". The caller wraps it:
 *
 *     <CardContainer size="lg"><EntityHeader … /></CardContainer>
 *
 * It is FILL width inside that slot and never sets its own width. The
 * breakpoint it responds to is the card's, not the viewport's — which is why
 * `size` is a prop here rather than a media query.
 *
 * ── Composition ───────────────────────────────────────────────────────────
 * AvatarCircle (sizeKey="lg" — its own doc names entity headers as the use
 * case) · HighlightIcon · Tag · Button (variant="main" for Ask, which is the
 * DS's Main Action Gradient) · Menu/MenuItem · Tooltip · Skeleton. No new
 * colour semantics — every value is an existing token.
 */

import { useState } from "react"
import { Info, MoreVertical, Sparkle } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarCircle }  from "@/components/ui/avatar"
import { HighlightIcon } from "@/components/ui/highlight-icon"
import type { HighlightIconVariant } from "@/components/ui/highlight-icon"
import { Tag }           from "@/components/ui/tag"
import type { TagVariant } from "@/components/ui/tag"
import { Button }        from "@/components/ui/button"
import { Tooltip }       from "@/components/ui/tooltip"
import { Skeleton }      from "@/components/ui/skeleton"
import { Menu, MenuItem } from "@/components/ui/menu-item"

// ── Types ─────────────────────────────────────────────────────────────────────

export type EntityHeaderVariant = "default" | "loading" | "restricted"
export type EntityHeaderSize    = "default" | "responsive"

/**
 * One question decides this: does the entity have a real-world visual identity
 * — a face or a brand? Natural persons and branded entities (companies, sites,
 * tenants, suppliers) get an avatar. Everything else — objects, assets,
 * processes, transactions, documents — gets a highlight icon. Exactly one
 * renders; never both, never neither.
 *
 * The rule is about the entity, not about whether the asset exists: a company
 * with no logo still uses an avatar, falling back to initials. And initials are
 * never derived from a code — RO-48291 has no initials, so it is an icon by
 * definition.
 */
export type EntityVisual =
  | { kind: "avatar"; src?: string; initials?: string }
  | { kind: "icon"; iconName: string; iconVariant?: HighlightIconVariant }

/**
 * Three kinds of tag, one component. The vocabulary belongs to the tenant; the
 * colour belongs to the platform.
 *
 * `signal` — something that needs attention, bounded in time or condition.
 * `classification` — what kind of thing this is, and only when the visual is an
 * avatar (a highlight icon already says the type).
 *
 * Left tags carry two colours only: `error` when something is broken or
 * overdue, `alert` when it needs review, `neutral` for everything else. The
 * test is not signal-vs-classification, it is whether someone has to do
 * something about it. Classification is never coloured — that is what keeps the
 * vocabulary scalable when a tenant defines a hundred of them.
 */
export interface EntityTag {
  label:    string
  role:     "signal" | "classification"
  tone?:    "error" | "alert" | "neutral"
  /** Sorts signals among themselves — higher is more severe. Ignored for classification. */
  severity?: number
  tooltip?: string
}

/**
 * Icon says what kind of information this is, text says the value, tooltip
 * names the field and adds context. The tooltip is not optional: it opens on
 * hover AND on focus, always, even when the text is not truncated.
 */
export interface EntityMetaItem {
  iconName: string
  /** The value. Short form ≤ 8 chars, long form ≤ 24. */
  label:    string
  /** Field label + context, e.g. "Assigned agent · Manager Agent. Handling this account since Mar 3." */
  tooltip:  string
}

export interface EntityMenuAction {
  label:        string
  destructive?: boolean
  onClick?:     () => void
}

export interface EntityHeaderProps {
  visual: EntityVisual
  /** The entity's name or ID, exactly as the source system stores it. Never rewritten or reformatted. */
  title: string
  /**
   * The system the record was pulled from — Workday, Salesforce, NetSuite, DMS,
   * Helix Data Studio. One item, never two: a job title, a location, a region,
   * a category or a parent company is not a source. When the entity was created
   * in the platform itself the slot is removed, never filled with something else.
   */
  source?: { label: string; iconName?: string }
  /** Exactly one. If several statuses are concurrent, the most blocking wins and the rest become signals. */
  state?: { label: string; variant: TagVariant }
  /** Max 6 plus overflow. Signals first (by severity), then classification. */
  tags?: EntityTag[]
  /**
   * How many tags stay on the row before the rest collapse into +N. Tags are the
   * flexible element: show fewer tags and a larger +N rather than truncating the
   * title further — the identifier is what the user came to read.
   */
  maxVisibleTags?: number
  /**
   * Off by default. Most headers do not carry one. Turn it on only when the
   * title is an opaque code — RO-48291 alone means nothing. One line, plain
   * language, no status words: it says what the entity IS, never what is
   * happening to it. The durability test: if the sentence could change next
   * week, it is an activity note and belongs in the Overview.
   */
  description?: string
  /** Max 6 — six is the maximum, not the goal. Aim for four. Beyond six it belongs in the Overview, not behind a +N chip. */
  meta?: EntityMetaItem[]
  /** Ask — opens a context-aware Personal Assistant in a side panel. It talks, it does not execute. */
  onAsk?: () => void
  askLabel?: string
  /** Information — opens a side panel with the provenance of the fields in this header. One side panel at a time. */
  onInformation?: () => void
  /** Optional, off by default. Icon-only in Figma; a short label reads better in code, so the label is required when used. */
  secondaryAction?: { label: string; onClick?: () => void }
  /** Destructive and secondary actions only. Never a visible button. */
  menuActions?: EntityMenuAction[]
  /**
   * State 5 of the five this component owns: "Only visual, title and state. No
   * description, no tags, no metadata. The header stays valid. This is what
   * priorities 1 to 3 guarantee."
   *
   * It is the arrangement to use when the header is pinned and the content
   * scrolls behind it — the spec's own answer to "what survives when there is
   * no room", applied to vertical space instead of horizontal. Actions stay:
   * the right side is fixed and never compressed, and affordances are always
   * visible with no hover reveal.
   */
  minimum?: boolean
  variant?: EntityHeaderVariant
  size?: EntityHeaderSize
  /** Shown in place of the governed values when variant="restricted". Calm and explanatory — this is a state, not a failure. */
  restrictedNote?: string
  className?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TONE_TAG: Record<NonNullable<EntityTag["tone"]>, TagVariant> = {
  error:   "error",
  alert:   "alert",
  neutral: "neutral",
}

/** Signals first, sorted by severity; classification after. The state badge keeps its own slot. */
function orderTags(tags: EntityTag[]): EntityTag[] {
  const signals = tags.filter(t => t.role === "signal").sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0))
  const classes = tags.filter(t => t.role === "classification")
  return [...signals, ...classes]
}

/** Classification is never coloured, whatever tone the caller passed. */
function tagVariant(tag: EntityTag): TagVariant {
  if (tag.role === "classification") return "neutral"
  return TONE_TAG[tag.tone ?? "neutral"]
}

const DOT = (
  <span aria-hidden style={{ color: "var(--border-neutral-lighter, var(--field-border))", fontSize: 10, lineHeight: 1 }}>
    ●
  </span>
)

function Visual({ visual, title }: { visual: EntityVisual; title: string }) {
  // The avatar exposes the entity's name as its accessible name, whether it
  // renders a photo, a logo or initials. The highlight icon names the entity
  // type — it is not decorative.
  if (visual.kind === "avatar") {
    return (
      <span style={{ flexShrink: 0, display: "inline-flex" }} role="img" aria-label={title}>
        <AvatarCircle
          name={title}
          sizeKey="lg"
          avatarStyle={visual.src ? "photo" : "text"}
          src={visual.src}
          initials={visual.initials}
        />
      </span>
    )
  }
  return (
    <span style={{ flexShrink: 0, display: "inline-flex" }}>
      <HighlightIcon size="lg" variant={visual.iconVariant ?? "informative"} iconName={visual.iconName} />
    </span>
  )
}

/**
 * Title truncates last: flex 0 1 auto with min-width 0, ellipsis, full value in
 * a tooltip. Never wraps.
 *
 * It renders at full strength in every state, Restricted included. Restricted
 * governs the entity's VALUES, not its identity — the name is already visible
 * in the list the viewer came from, and dimming it would say the name itself is
 * uncertain. Priorities 1 to 3 are never dropped and never weakened.
 */
function Title({ title }: { title: string }) {
  return (
    <Tooltip content={title} side="cursor" triggerClassName="block min-w-0">
      <h1
        style={{
          fontSize: 20, fontWeight: 600, lineHeight: 1.2, margin: 0,
          color: "var(--color-text-title)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
      >
        {title}
      </h1>
    </Tooltip>
  )
}

function Source({ source }: { source: NonNullable<EntityHeaderProps["source"]> }) {
  return (
    <Tooltip content={`Source · ${source.label}`} side="cursor">
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
          maxWidth: 160, fontSize: 12, fontWeight: 500, color: "var(--field-supporting)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
      >
        {source.iconName && <HighlightIcon size="sm" variant="neutral" iconName={source.iconName} />}
        {source.label}
      </span>
    </Tooltip>
  )
}

/** Tags hug and collapse into +N one at a time — never a fixed width, so growth
 *  in the title or source makes them collapse rather than overlap. The overflow
 *  chip exposes the hidden tags to keyboard and screen reader, not only hover. */
function TagGroup({ tags, maxVisible }: { tags: EntityTag[]; maxVisible: number }) {
  const ordered = orderTags(tags).slice(0, 6)
  const visible = ordered.slice(0, maxVisible)
  const hidden  = ordered.slice(maxVisible)
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 1, minWidth: 0, flexWrap: "nowrap" }}>
      {visible.map(tag => (
        <Tooltip key={tag.label} content={tag.tooltip ?? tag.label} side="cursor">
          <Tag variant={tagVariant(tag)} size="sm">{tag.label}</Tag>
        </Tooltip>
      ))}
      {hidden.length > 0 && (
        <Tooltip content={hidden.map(t => t.label).join(" · ")} side="cursor">
          <span tabIndex={0} style={{ display: "inline-flex", borderRadius: 999, outlineOffset: 2 }}>
            <Tag variant="neutral" size="sm">{`+${hidden.length}`}</Tag>
          </span>
        </Tooltip>
      )}
    </span>
  )
}

/** Icon + text, always — the header has the width, and a bare icon forces the
 *  user to interpret a symbol. Hidden entirely before it is stripped of text. */
function MetaRow({ meta }: { meta: EntityMetaItem[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
      {meta.slice(0, 6).map((item, i) => (
        <span key={item.label + i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {i > 0 && DOT}
          <Tooltip content={item.tooltip} side="cursor">
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 12, fontWeight: 500, color: "var(--field-supporting)",
                maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              <HighlightIcon size="sm" variant="neutral" iconName={item.iconName} />
              {item.label}
            </span>
          </Tooltip>
        </span>
      ))}
    </div>
  )
}

/**
 * The three actions sit in one row and look like one group, but they are three
 * different kinds of thing — reading them as a row of buttons is the most
 * common misreading of this component.
 *
 *   Ask         — the gradient button. Opens a context-aware Personal
 *                 Assistant. It never resolves a task and never commits the
 *                 user to anything, which is why it must not share the visual
 *                 mark a Next Best Action uses: that one asks to be accepted.
 *   Information — icon button. Explains where the fields on screen came from.
 *   Menu        — destructive and secondary actions only, never a visible button.
 *
 * Actions are always visible. There is no hover reveal.
 */
function InformationButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Tooltip content="Where these fields came from" side="cursor">
      <Button
        variant="tertiary" size="sm" disabled={disabled}
        icon={<Info size={16} />} iconPosition="alone"
        aria-label="Field information"
        onClick={onClick}
      />
    </Tooltip>
  )
}

function Actions({
  onAsk, askLabel, secondaryAction, menuActions, disabled,
}: Pick<EntityHeaderProps, "onAsk" | "askLabel" | "secondaryAction" | "menuActions"> & { disabled?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, position: "relative" }}>
      {secondaryAction && (
        <Button variant="secondary" size="sm" disabled={disabled} onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </Button>
      )}
      {onAsk && (
        <Tooltip content="Ask about this entity" side="cursor">
          <Button
            variant="main" size="sm" disabled={disabled}
            icon={<Sparkle size={13} />}
            onClick={onAsk}
          >
            {askLabel ?? "Ask"}
          </Button>
        </Tooltip>
      )}
      {menuActions && menuActions.length > 0 && (
        <>
          <Button
            variant="tertiary" size="sm" disabled={disabled}
            icon={<MoreVertical size={16} />} iconPosition="alone"
            aria-label="More actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          />
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-[10000]" onClick={() => setMenuOpen(false)} />
              <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 10001 }}>
                <Menu>
                  {menuActions.map(action => (
                    <MenuItem
                      key={action.label}
                      size="sm"
                      label={action.label}
                      onClick={() => { setMenuOpen(false); action.onClick?.() }}
                    />
                  ))}
                </Menu>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

/** Skeleton matching the arrangement of its size. Never an empty state — saying
 *  "nothing here" while data is in flight states something untrue. */
function LoadingHeader({ size }: { size: EntityHeaderSize }) {
  const stacked = size === "responsive"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton shape="circle" width={32} height={32} />
        <Skeleton shape="text" width={stacked ? 160 : 200} height={18} />
        <Skeleton shape="text" width={110} height={14} />
        <span style={{ flex: 1 }} />
        <Skeleton shape="text" width={80} height={24} />
        <Skeleton shape="text" width={120} height={24} />
      </div>
      {stacked && <Skeleton shape="text" width="60%" height={14} />}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[72, 88, 64, 96, 56].map((w, i) => <Skeleton key={i} shape="text" width={w} height={14} />)}
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EntityHeader({
  visual,
  title,
  source,
  state,
  tags,
  maxVisibleTags = 2,
  description,
  meta,
  onAsk,
  askLabel,
  onInformation,
  secondaryAction,
  menuActions,
  minimum = false,
  variant = "default",
  size = "default",
  restrictedNote = "You don't have access to these values. The fields exist and are governed.",
  className,
}: EntityHeaderProps) {
  if (variant === "loading") {
    return (
      <header className={cn("w-full", className)}>
        <LoadingHeader size={size} />
      </header>
    )
  }

  const restricted = variant === "restricted"
  // Minimum keeps the desktop single row whatever the size axis says — a
  // stacked minimum would be three rows of nothing.
  const stacked    = size === "responsive" && !minimum
  // Restricted removes the tag group rather than leaving it empty; minimum
  // drops everything below priority 3.
  const shownTags  = restricted || minimum ? [] : (tags ?? [])
  const shownMeta  = restricted || minimum ? [] : (meta ?? [])
  const shownSource      = minimum ? undefined : source
  const shownDescription = minimum ? undefined : description

  const identityLeft = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: "1 1 auto" }}>
      <Visual visual={visual} title={title} />
      {/* flex 0 1 auto + min-width 0: the title takes what remains after visual,
          source, collapsed tags and actions, and truncates only there. */}
      <div style={{ flex: "0 1 auto", minWidth: 0, marginLeft: 4 }}>
        <Title title={title} />
      </div>
      {shownSource && !stacked && (
        <>
          {DOT}
          <Source source={shownSource} />
        </>
      )}
      {shownTags.length > 0 && !stacked && <TagGroup tags={shownTags} maxVisible={maxVisibleTags} />}
    </div>
  )

  const identityRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      {onInformation && <InformationButton onClick={onInformation} disabled={restricted} />}
      {state && <Tag variant={state.variant} size="sm">{state.label}</Tag>}
      <Actions
        onAsk={onAsk}
        askLabel={askLabel}
        secondaryAction={secondaryAction}
        menuActions={menuActions}
        disabled={restricted}
      />
    </div>
  )

  return (
    <header className={cn("w-full", className)} style={{ display: "flex", flexDirection: "column", gap: minimum ? 0 : 12 }}>
      {/* Row 1 — identity. The right side is fixed and never compressed. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {identityLeft}
        {identityRight}
      </div>

      {/* Responsive reflow: stack before you shrink. Source and tags get their
          own rows rather than competing with the title. */}
      {stacked && (shownSource || shownTags.length > 0) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
          {shownSource && <Source source={shownSource} />}
          {shownTags.length > 0 && <TagGroup tags={shownTags} maxVisible={maxVisibleTags + 2} />}
        </div>
      )}

      {shownDescription && !restricted && (
        <Tooltip content={shownDescription} side="cursor" triggerClassName="block min-w-0 w-full">
          <p
            style={{
              margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--field-supporting)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {shownDescription}
          </p>
        </Tooltip>
      )}

      {restricted && !minimum && (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--field-supporting)" }}>
          {restrictedNote}
        </p>
      )}

      {shownMeta.length > 0 && <MetaRow meta={shownMeta} />}
    </header>
  )
}

export default EntityHeader
