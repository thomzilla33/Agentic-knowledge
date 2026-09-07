/**
 * Entity Profile — ONE screen, N types.
 *
 * This is the thesis made testable. There is no `if (type === "vehicle")` in
 * this file. The header fields, the tab strip and the Overview widgets are all
 * read from the registry, so a vehicle and a customer render through the same
 * code and differ only in what the model published.
 *
 * That is the claim to check when reviewing: open a customer, then a vehicle.
 * The chrome is identical, the content is not, and no screen was written for
 * either.
 *
 * ── What is universal and what is not ─────────────────────────────────────
 * Universal: RecordHeader, and the four knowledge tabs — Overview, Snapshot,
 * Activity, Drives. Those hold for any entity because they are about knowledge
 * rather than about the thing: everything ingested is claimed about, interacted
 * with and documented.
 *
 * Per type: the record fields, the domain tabs (Service history, Inventory,
 * Deals), and the Overview widgets. All from `entityProfiles.ts`, which is the
 * projection of what Data Studio already owns.
 *
 * A type with no spec still renders — four tabs, no domain widgets. Publishing a
 * type therefore costs nothing at the profile: it works the moment it exists,
 * and the domain detail can arrive later without blocking it.
 */

import { useMemo, useState } from "react"
import { ScreenLayout }     from "@/components/layouts/screen-layout"
import { WidgetCanvasView } from "@/components/layouts/widget-canvas-view"
import type { CanvasSlot }  from "@/components/layouts/widget-canvas-view"
import { Header }           from "@/components/ui/header"
import { Tabs }             from "@/components/ui/tabs"
import { Tag }              from "@/components/ui/tag"
import { CardContainer }    from "@/components/ui/card-container"
import { EmptyState }       from "@/components/ui/empty-state"
import { HighlightIcon }    from "@/components/ui/highlight-icon"
import { SlideOut }        from "@/components/ui/slide-out"
import { RecordHeader }     from "@/components/ui/record-header"
import type { RecordField, NextBestAction } from "@/components/ui/record-header"
import * as LucideIcons     from "lucide-react"
import type { LucideIcon }  from "lucide-react"
import { Construction, FileSearch } from "lucide-react"
import { UCP_SIDEBAR_ITEMS } from "./pm-thomas-ucp-profile"
import { MODEL_LABEL }       from "./entityRegistry"
import type { EntityTypeDef } from "./entityRegistry"
import { PROFILE_SPECS, tabsForType } from "./entityProfiles"
import type { ProfileField } from "./entityProfiles"

const icon = (name: string): LucideIcon =>
  (LucideIcons[name as keyof typeof LucideIcons] ?? LucideIcons.CircleDot) as LucideIcon

export interface ProfileRecord {
  id:     string
  title:  string
  typeId: string
  state:  { label: string; variant: "success" | "error" | "alert" | "informative" | "neutral" }
  fields: ProfileField[]
  agent:  { id: string; name: string }
  nba?:   { title: string; description: string }
}

/** Rows shared by every domain widget. Same arrangement as the UCP profile:
 *  icon left, label, value right, subtle divider, none after the last. */
function WidgetRows({ rows }: { rows: NonNullable<ReturnType<typeof Object.values>> extends never ? never : { label: string; value: string; icon: string; variant: "success" | "alert" | "informative" | "neutral" }[] }) {
  return (
    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column" }}>
      {rows.map((r, i) => (
        <div key={r.label} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
          borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--color-border-neutral-subtle)",
        }}>
          <HighlightIcon size="sm" variant={r.variant} iconName={r.icon} />
          <span title={r.label} style={{
            fontSize: 12, color: "var(--field-supporting)", flex: 1, minWidth: 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{r.label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", whiteSpace: "nowrap" }}>{r.value}</span>
        </div>
      ))}
    </div>
  )
}

export function EntityProfileView({
  record, type, onBack,
}: { record: ProfileRecord; type: EntityTypeDef; onBack: () => void }) {
  const tabs = tabsForType(record.typeId)
  const [tab, setTab] = useState(tabs[0].id)
  const [prov, setProv] = useState(false)
  const spec = PROFILE_SPECS[record.typeId]

  const recordFields = useMemo<RecordField[]>(
    () => record.fields.map(f => ({
      label: f.label,
      icon:  icon(f.iconName),
      provenance: { system: f.system, systemAbbr: f.system.slice(0, 2).toUpperCase(), modelVersion: `${MODEL_LABEL[type.model]} v1`, syncedAgo: "2h ago" },
      state: f.masked ? "masked" : "hydrated",
      value: f.value,
      maskedValue: f.masked ? "•••• (restricted)" : undefined,
    })),
    [record, type],
  )

  const nba = useMemo<NextBestAction[]>(
    () => record.nba ? [{ id: `nba-${record.id}`, title: record.nba.title, description: record.nba.description, contextTag: type.singular, onOpen: () => {} }] : [],
    [record, type],
  )

  const slots = useMemo<CanvasSlot[]>(
    () => (spec?.widgets ?? []).map(w => ({
      uid: w.uid, title: w.title, colSpan: 1, rowSpan: 4,
      content: <WidgetRows rows={w.rows} />,
    })),
    [spec],
  )

  const isUniversal = ["overview", "snapshot", "activity", "drives"].includes(tab)
  const domainTab   = spec?.extraTabs.find(t => t.id === tab)

  return (
    <ScreenLayout
      workspaceName="Riverbend Group"
      userName="Thomas González"
      userEmail="thomas.gonzalez@aimsos.ai"
      sidebarItems={UCP_SIDEBAR_ITEMS}
      activeSidebarId="contacts"
      header={isScrolled => (
        <>
          <Header size={isScrolled ? "compress" : "size-m"} title={type.label} backButton showBackInCompress onBack={onBack} />
          <div style={{ padding: "0 32px 8px" }}>
            <RecordHeader
              name={record.title}
              entityType={{ icon: icon(type.iconName), label: type.singular }}
              statusTag={{ label: record.state.label }}
              recordFields={recordFields}
              // Wired for real. RecordHeader does not render recordFields
              // inline — the array's visible effect is enabling this trigger —
              // so passing the fields with a no-op handler produces a live
              // button that does nothing, which is worse than a disabled one.
              // The panel is also where the per-type difference becomes visible:
              // a vehicle shows VIN and odometer, a customer shows a role.
              onProvenanceOpen={() => setProv(true)}
              assignedAgent={{ id: record.agent.id, name: record.agent.name, onOpenChat: () => {} }}
              nextBestActions={nba}
              actions={[{ label: "Export record", variant: "secondary", onClick: () => {} }]}
            />
          </div>
          <div style={{ padding: "0 32px 16px" }}>
            {/* Four universal tabs plus whatever the model published. The strip
                is generated, never authored here. */}
            <Tabs activeId={tab} onChange={setTab} items={tabs.map(t => ({ id: t.id, label: t.label }))} />
          </div>
        </>
      )}
    >
      {tab === "overview" && (
        slots.length > 0
          ? <WidgetCanvasView initialSlots={slots} />
          : <EmptyState icon={Construction} title="No widgets published yet"
              description={`${type.label} has no Overview widgets in its model. The four knowledge tabs still work — the domain detail can arrive later.`} />
      )}

      {domainTab && (
        // The honest state for a prototype: the tab EXISTS because the model
        // published it, and saying so is more useful than inventing content that
        // would then have to be unlearned.
        <EmptyState
          icon={Construction}
          title={`${domainTab.label} — defined by the model, not built yet`}
          description={`This tab exists because ${MODEL_LABEL[type.model]} publishes it for ${type.label.toLowerCase()}. Its content comes from the entity's own columns and relationships.`}
        />
      )}

      <SlideOut
        open={prov} onClose={() => setProv(false)} type="with-variants" size="m"
        title="Field sources"
        subtitle={`${type.singular} · ${record.title}`}
        showIcon iconContent={<FileSearch size={14} />}
        showStatus={false} showTopButton={false} showTabs={false} showSearchBar={false} showChips={false} showCta={false}
      >
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <span style={{ fontSize: 12, color: "var(--field-supporting)", lineHeight: 1.6 }}>
            Every field this {type.singular.toLowerCase()} carries, and the system it came from.
            The set is published by {MODEL_LABEL[type.model]} — it is not the same set another type carries.
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {record.fields.map((f, i) => (
              <div key={`${f.label}-${i}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--field-supporting)" }}>
                  {f.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: f.masked ? "var(--field-supporting)" : "var(--foreground)" }}>
                  {f.masked ? "•••• (restricted)" : f.value}
                </span>
                <span style={{ fontSize: 12, color: "var(--field-supporting)", lineHeight: 1.5 }}>
                  {f.system}{f.masked ? " · governed by finance.read" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SlideOut>

      {isUniversal && tab !== "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <CardContainer size="lg" variant="default" className="w-full">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HighlightIcon size="sm" variant="informative" iconName={tab === "snapshot" ? "ScanLine" : tab === "activity" ? "Inbox" : "HardDrive"} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>
                  {tab === "snapshot" ? "Knowledge planes" : tab === "activity" ? "Interaction timeline" : "Source Drives"}
                </span>
                <Tag variant="neutral" size="sm">universal</Tag>
              </div>
              <span style={{ fontSize: 12, color: "var(--field-supporting)", lineHeight: 1.6 }}>
                {tab === "snapshot"
                  ? `Every fact on this ${type.singular.toLowerCase()} by plane — Truth, Sandbox, Sources — with its provenance. Identical on every type, because every ingested entity is claimed about.`
                  : tab === "activity"
                  ? `Everything that happened to this ${type.singular.toLowerCase()}, any channel. Identical on every type.`
                  : `The drives and documents backing this ${type.singular.toLowerCase()}. Identical on every type.`}
              </span>
              <span style={{ fontSize: 12, color: "var(--field-supporting)" }}>
                Fully built on the approved UCP card — reused here rather than rebuilt per type.
              </span>
            </div>
          </CardContainer>
        </div>
      )}
    </ScreenLayout>
  )
}
