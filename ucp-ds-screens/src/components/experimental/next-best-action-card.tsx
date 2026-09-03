// DS-GAP: NextBestActionCard — the Next Best Action proposal that sits under
// the Entity Header. Built from Figma node 19815-101547 ("Entity Header - WIP"
// → Next Best Action Card). Closest DS component: CardContainer variant="purple"
// size="lg", which this composes rather than replaces. Not promoted: same WIP
// frame as entity-header.tsx.

/**
 * Next Best Action Card — AIMS OS
 *
 * The engine proposes; the human governs. This card is where a Next Best Action
 * reaches a Unified Entity Profile.
 *
 * ── Placement ─────────────────────────────────────────────────────────────
 * Under the Entity Header, never inside it. Full width, directly below, in its
 * own Card Component — two records, two containers. Sixteen products were
 * reviewed when this was specified and none puts the recommendation inside the
 * record header: the header identifies the entity, the card proposes.
 *
 * ── It never stacks ───────────────────────────────────────────────────────
 * One at a time. The engine has already prioritised, unified and discarded, so
 * showing five is not trusting the engine — and stacked cards push the real
 * content below the fold. If more exist, `moreCount` renders a counter that
 * leads to the list.
 *
 * ── No action, no card ────────────────────────────────────────────────────
 * When there is nothing to do the container does not render. This is not an
 * empty state: there is nothing to say when there is nothing to do. Callers
 * pass `null` for `action` and get nothing back.
 *
 * ── Why it must not look like Ask ─────────────────────────────────────────
 * The Ask button produces summaries and commits the user to nothing. This card
 * asks for a decision. They must not share a glyph or a colour, or the user
 * cannot tell which one commits them to something — so this uses the Tag purple
 * family and its own Sparkle label, never the Main Action Gradient.
 */

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CardContainer } from "@/components/ui/card-container"
import { Button }        from "@/components/ui/button"
import { Tooltip }       from "@/components/ui/tooltip"
import { Sparkle }       from "lucide-react"

export interface NextBestAction {
  /**
   * The action, not the engine name — "Assign a renewal check-in call", never
   * "Next Best Action". Min 20 chars: under that it stops being an instruction
   * and becomes a label. Target 40, max 60.
   */
  title: string
  /** When the engine produced it. Without a timestamp and a rationale it is an order, not a proposal. */
  timestamp: string
  /**
   * A fact and its consequence — "Their certificate expires in 45 days" is the
   * fact, "requesting it now avoids a compliance gap" is why it matters. With
   * only the fact the user cannot decide. Min 60, target 90, max 150: the card
   * is full width so a single line could hold ~180 characters, but comprehension
   * drops past 90 and long lines get skipped.
   *
   * It renders on one line and truncates — the full text lives in the tooltip.
   */
  rationale?: string
  /**
   * "view-details" is the default and should be used unless there is a reason
   * not to: the card cannot guarantee it showed everything, so the safe path is
   * always the one that opens the record. "accept" is reserved for actions that
   * are neither destructive nor complex; which ones qualify is not yet decided.
   */
  variant?: "view-details" | "accept"
}

export interface NextBestActionCardProps {
  /** Pass null when the engine returned nothing — the card does not render. */
  action: NextBestAction | null
  /** Accepting assigns to the agent, it never executes, and it always routes to the detail. Never "Call now". */
  onAccept?: () => void
  onViewDetails?: () => void
  /** Session-only. Nothing is stored and nothing is fed back to the engine. */
  onDismiss?: () => void
  /** When the engine has more queued. Renders a counter that leads to the list — the card still never stacks. */
  moreCount?: number
  onViewAll?: () => void
  label?: string
  className?: string
}

export function NextBestActionCard({
  action,
  onAccept,
  onViewDetails,
  onDismiss,
  moreCount,
  onViewAll,
  label = "Next Best Action",
  className,
}: NextBestActionCardProps) {
  if (!action) return null

  const offersAccept = action.variant === "accept" && Boolean(onAccept)

  return (
    <CardContainer variant="purple" size="lg" className={cn("w-full relative", className)}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {/* AI context — names the engine, so the title never has to. */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkle size={13} style={{ color: "var(--tag-purple-bd)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tag-purple-bd)" }}>{label}</span>
          {typeof moreCount === "number" && moreCount > 0 && (
            <Button variant="tertiary" size="sm" className="!px-0 ml-[8px]" onClick={onViewAll}>
              {`+${moreCount} more`}
            </Button>
          )}
        </div>

        {/* The action, and when it was produced. */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
          <Tooltip content={action.title} side="cursor" triggerClassName="block min-w-0">
            <span
              style={{
                fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: "var(--tag-purple-fg)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
              }}
            >
              {action.title}
            </span>
          </Tooltip>
          <span style={{ fontSize: 12, color: "var(--tag-purple-fg)", opacity: 0.7, flexShrink: 0, whiteSpace: "nowrap" }}>
            {`· ${action.timestamp}`}
          </span>
        </div>

        {/* One line, always. The card shows what fits; the tooltip carries the rest. */}
        {action.rationale && (
          <Tooltip content={action.rationale} side="cursor" triggerClassName="block min-w-0 w-full">
            <span
              style={{
                fontSize: 13, lineHeight: 1.5, color: "var(--tag-purple-fg)", opacity: 0.9,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
              }}
            >
              {action.rationale}
            </span>
          </Tooltip>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          {offersAccept && (
            <Button variant="primary" size="sm" onClick={onAccept}>
              Accept
            </Button>
          )}
          <Button variant="tertiary" size="sm" className={offersAccept ? undefined : "!px-0"} onClick={onViewDetails}>
            View details
          </Button>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss this recommendation"
          onClick={onDismiss}
          style={{
            position: "absolute", top: 20, right: 20,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 20, height: 20, borderRadius: 4, border: "none",
            background: "transparent", color: "var(--tag-purple-fg)", cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      )}
    </CardContainer>
  )
}

export default NextBestActionCard
