# Agentic Studio — Feature Review
**File:** `agentic-studio.html`  
**Prototype type:** Single-file HTML/CSS/JS — fully interactive, no build step  
**Prepared for:** Principal Engineer Review  
**Status:** E2E tested — 29/29 passing ✅

---

## Table of Contents

1. [What This Is](#1-what-this-is)
2. [Application Shell](#2-application-shell)
3. [Data Model](#3-data-model)
4. [View: List (Home)](#4-view-list-home)
5. [View: Full Overview](#5-view-full-overview)
6. [View: Builder (Edit Mode)](#6-view-builder-edit-mode)
7. [View: Test Mode](#7-view-test-mode)
8. [Knowledge System](#8-knowledge-system)
9. [TruthPack Marketplace](#9-truthpack-marketplace)
10. [Drive Marketplace](#10-drive-marketplace)
11. [TruthPack Preview Popup](#11-truthpack-preview-popup)
12. [Drive Preview Popup](#12-drive-preview-popup)
13. [Create Network — AI Wizard](#13-create-network--ai-wizard)
14. [Overview Widget Grid — Drag & Resize](#14-overview-widget-grid--drag--resize)
15. [State Management](#15-state-management)
16. [Component Reuse Map](#16-component-reuse-map)
17. [E2E Test Coverage](#17-e2e-test-coverage)
18. [Implementation Notes for Engineering](#18-implementation-notes-for-engineering)

---

## 1. What This Is

**Agentic Studio** is the workspace where users create, monitor, and manage **Agentic Networks** — multi-agent, multi-workflow automation graphs that orchestrate AI agents across complex business processes.

An **Agentic Network** is composed of:
- **Workflows** — structured process sequences
- **Agents** — AI actors that perform tasks within workflows
- **Nodes** — individual steps in the execution graph (triggers, workflows, agents, outputs, RAG nodes)
- **Knowledge** — TruthPacks and Source Drives that provide context to every node

The prototype covers the full lifecycle: **List → Preview → Full Overview → Builder → Test Mode**, plus all Knowledge management surfaces.

---

## 2. Application Shell

### Layout

```
┌─────────────────────────────────────────────────────┐
│ TOPBAR (fixed, 60px)                                │
├──────┬──────────────────────────────────────────────┤
│      │                                              │
│  SB  │  MAIN (view router — one view active)        │
│      │                                              │
└──────┴──────────────────────────────────────────────┘
```

### Sidebar (`#sidebar`, `.sidebar`)
- **52px collapsed** / **220px expanded** — animated via CSS transition
- Toggle button (chevron arrow) docks/expands the sidebar
- 7 navigation sections, each collapsible:
  - **Agents** — individual AI agent management
  - **Contacts** — contact records
  - **Networks** ← active in this prototype
  - **Workers** — background task workers
  - **Logs** — execution logs
  - **Starred** — favorited items
- Active item shows a gradient icon (`--grad: linear-gradient(135deg, #00C2C2, #155DFC)`)
- In collapsed mode: only icon visible; in expanded mode: icon + label + chevron for sub-nav

### Topbar
- **Left:** App logo + product picker dropdown + tabs (Agentic Networks / Workers / Logs)
- **Center:** Global search bar — `"Search in AIMS-OS Platform..."`
- **Right:** Notification bell, History icon, Settings, User avatar (`JJ`)

### View Router
Views are `.view` divs that toggle `.active` class. Only one is visible at a time:
| View ID | Description |
|---------|-------------|
| `#vList` | List home — default active |
| `#vOverview` | Full overview dashboard |
| `#vBuilder` | Node editor / builder |
| `#vTestMode` | Execution simulation |

---

## 3. Data Model

Each **Network** object (`NETWORKS[]`) carries:

```javascript
{
  id, name, status,          // 'active' | 'running' | 'error' | 'inactive' | 'draft'
  desc, aiText,              // description + AI-generated summary
  owner: { init, name },     // owner avatar initials + full name + department
  schedule, runs, rate,      // trigger schedule, execution count, success rate %
  workflows_n, agents_n, nodes,  // composition counts
  triggers: [{ type, label, detail, next }],
  recentRuns: [{ id, type, dur, ago, status }],
  metrics: { exec, rate, dur, fail },
  flow: [{ t, l, badge }],   // mini flow node list for the overview diagram
  knowledge: [               // TruthPacks attached to this network (global layer)
    { id, name, docs, facts, claims, planes: { truth, sandbox, sources } }
  ]
}
```

**Plane states** per TruthPack: `'on'` | `'off'` | `'disabled'`

**TP_PLANES_LABEL / TP_PLANES_TIP** — display labels and hover tooltips for each plane type, reflecting confidence levels:
- **Truth Plane** → 100% verified facts
- **Sandbox Claims** → unverified claims, ~80% confidence
- **Sources** → raw documents, ~60% confidence

---

## 4. View: List (Home)

**Entry point.** Displays all Agentic Networks with filter, search, and a slide-in preview panel.

### Filter Bar
- **Status pills:** All · Active · Running · Error · Inactive · Draft — click to filter `currentFilter`
- **Search input:** Real-time filter on `n.name` and `n.desc`
- **Sort button:** "Sort: Last updated" (UI only in prototype)
- Active filter count shown in each pill badge (e.g. "Active 2")

### Network Cards (`.net-card`)
Each card shows:
- Network name + status badge (color-coded dot: green=active, blue=running, red=error, gray=inactive, amber=draft)
- Last updated timestamp
- Description (1 line, truncated)
- **AI Summary row** — star icon + "AI Summary" label + generated insight text
- **Meta row:** Owner avatar + name, schedule/trigger, run count, success rate %, workflow count

**Interaction:** Clicking a card calls `selectNetwork(id)`, which:
1. Marks the card `.sel` (blue border highlight)
2. Slides in the **Preview Panel** from the right
3. Opens a tabbed panel with Summary / Triggers / Logs tabs

### Preview Panel (`.prev-panel`)
Right-side slide-in, triggered by `selectNetwork()`. Contains:

**Header:**
- Network name + status badge + version tag
- **"Open →" button** (`.prev-open`) → calls `openFullView()` → navigates to Full Overview
- Close button → calls `deselectNetwork()` → hides panel, clears selection

**Tab: Summary**
- AI insight text block
- Owner, schedule, input/output metadata
- Composition row: `N workflows · N agents · N nodes`
- Trigger chips (Scheduled, Event, Manual)

**Tab: Triggers**
- Each trigger: type icon + label + detail description + next execution time
- Cron expression shown for scheduled triggers

**Tab: Logs**
- Recent runs table: Run ID, trigger type icon, duration, time ago, status badge
- Status: `s`=success (green), `f`=failed (red), `r`=running (blue pulse), `w`=warning (amber)
- Clicking a row → `openRunDetail(runId, status)` → opens run detail overlay with step-by-step execution log

**Run Detail Overlay:**
- Breadcrumb: Network name → Run ID
- Tabs: Steps / Payload / Errors
- Step list with pass/fail/running states, duration per step, error messages inline

---

## 5. View: Full Overview

Reached via the **"Open →"** button in the preview panel. Full-page dashboard for a single network.

### Topbar
- Back button (`.btn-back`) → `backToList()` → returns to List view
- Network name (`.ov-name`, `#ovName`) + status badge (`#ovStatus`) + version (`#ovVer`)
- Tab strip: **Overview** (active) / **Builder** / **Test** — switching opens the respective view

### AI Insight Panel
- Full-width card with star icon, "AI Insight" label, and the `aiText` from the network data
- Italic, muted styling — purely informational

### Metrics Grid (`#ovMetrics`, `.ov-metrics`)
4 stat cards rendered by `openFullView()`:
| Card | Value |
|------|-------|
| Total Executions | `metrics.exec` |
| Success Rate | `metrics.rate%` |
| Avg Duration | `metrics.dur` |
| Failures | `metrics.fail` |

### Draggable Widget Grid (`#ovWidgetGrid`)
3 widgets arranged in a CSS Grid (2-column: left stack + right panel).  
See [Section 14](#14-overview-widget-grid--drag--resize) for full drag/resize spec.

**Widget 1 — Network Composition (`data-pos="1"`)**
- Header: "Network Composition" + drag grip
- Shows: Workflows count, Agents count, Triggers chips (Scheduled / Event / Manual / API)
- Mini flow diagram (`#ovFlow`): sequence of nodes rendered as flow bubbles — trigger → workflows → agents → output
- Flow stats row: N workflows, N agents, N nodes

**Widget 2 — Recent Executions (`data-pos="2"`)**
- Header: "Recent Executions" + drag grip + "View all" link
- Scrollable execution list (`#ovExecs`): each row shows run ID, trigger type, duration, time ago, status badge
- Tab strip inside: All / Successful / Failed
- Empty state if no runs

**Widget 3 — Knowledge Panel (`data-pos="3"`)**
- Right column, spans both rows
- See [Section 8.3](#83-knowledge-panel-in-overview-read-only) for full spec

---

## 6. View: Builder (Edit Mode)

Accessed via: Tab "Builder" in the Overview topbar, or the full Builder view entry.

### Layout: 3-panel

```
┌──────────────┬──────────────────────────┬──────────────────┐
│  Node Panel  │      Canvas              │  Inspector Panel │
│  (left)      │  (center)                │  (right)         │
└──────────────┴──────────────────────────┴──────────────────┘
```

### Node Panel (left, collapsible)
- Toggle button `toggleNodesPanel()` collapses/expands
- Lists available node types to drag onto canvas:
  - Trigger, Workflow, Agent, RAG Node, Output, Condition, Loop, Human in the Loop
- Each entry shows icon + label + description

### Canvas (center)
- `renderEditCanvas(net)` renders the network's nodes as positioned boxes
- `buildEditNode(node, x, y, w, h)` renders each node card with: type icon, label, status, connection handles
- Clicking a node → `selectEditNode(nodeId)` → populates the Inspector panel

### Inspector Panel (right, collapsible)
- `toggleInspPanel()` collapses/expands
- When a node is selected, shows:
  - Node type + name (editable)
  - Configuration fields per node type
  - **Knowledge sub-panel** (for applicable node types) — same 3-tab structure as global Knowledge, but scoped to that node
  - **"Knowledge →" button** → opens the Builder Knowledge Modal

### Builder Knowledge Modal
A centered modal (distinct from the global KN Modal) for editing knowledge on the current builder context (network-level or node-level).  
See [Section 8.2](#82-builder-knowledge-modal) for full spec.

### Breadcrumb / Topbar
- Back to Overview, network name, version
- Action buttons: Test / Save / Publish

---

## 7. View: Test Mode

Accessed via: "Test" tab in the Overview topbar, or `openTestMode()`.

### Purpose
Simulates execution of the Agentic Network step-by-step so the user can validate logic before publishing.

### Layout
- **Top bar:** Back button, "Test Mode" label, "Run Network" button
- **Canvas:** `renderTestCanvas(net)` — same node layout as Builder but read-only, highlights active node
- **Execution Trace Panel (right):** `renderTraceList()` — step-by-step log of the simulation
  - Each step: node icon, label, status (pending / running / done / failed), duration
  - Clicking a step → `selectTraceStep(idx)` → highlights the corresponding canvas node
- **"Show Execution Trace" toggle** — `toggleExecTrace()` — shows/hides the right panel
- **"Run Next Step" button** — `runNextStep(idx)` — advances simulation one step at a time

---

## 8. Knowledge System

### 8.1 Conceptual Architecture

Every entity in AIMS-OS (Agent, Agentic Network, Worker) has **three layers of knowledge**:

| Layer | Description |
|-------|-------------|
| **Global / Transversal** | Network-level context — all nodes inherit by default |
| **Node-level** | Per-node knowledge index — same structure, scoped to one node |
| **RAG-type Node** | A node of type RAG uses knowledge to answer a specific question as an orchestration step |

Each knowledge context has **three sub-sections**:

| Sub-section | What it contains |
|-------------|-----------------|
| **TruthPacks** | Curated knowledge packs — added/removed as a whole unit |
| **Shared Drives** | Documents and drives shared externally from the workspace |
| **Own Documents (Private Drive)** | Auto-created per entity, unique ID, not shareable |

### 8.2 Builder Knowledge Modal

**Trigger:** Clicking "Knowledge →" in the Inspector panel → `openBldrKnPanel()` / `openKnModal(ctx='bldr')`

A **full-height slide-in panel** (or centered modal) with 3 tabs:

#### Tab: TruthPacks
- **Added zone** (`#bldrKnTpAddedZone`): Accordion list of attached TruthPacks, rendered by `renderBldrAddedTp()`
- Each pack row (`.km-ac`) shows:
  - Arrow toggle for expand/collapse
  - Pack icon + name + meta (N facts, N claims, N docs)
  - **Plane toggle chips** — Truth / Sandbox / Sources — each can be `on`, `off`, or `disabled`
    - `on` → blue chip, clickable to turn off
    - `off` → gray chip, clickable to turn on
    - `disabled` → translucent, not clickable (set by the TruthPack creator)
  - **Remove button** (`×`) → `kmsRemoveWithConfirm()` → shows inline confirm dialog
- **"Add Knowledge Pack" button** → opens [TruthPack Marketplace](#9-truthpack-marketplace)
- Inline search filters the added list in real time

#### Tab: Source Drives
Two-zone layout:
- **Added zone:** List of added drives/folders/documents, rendered by `renderBldrDriveAdded()`
  - Each item shows: drive icon, name, type (drive / folder / document), remove button
- **Catalog zone:** Available drives from the workspace, rendered by `renderBldrDriveCatalog()`
  - Expandable tree: Drive → Folder → File
  - Checkbox selection per item → `drvCatalogToggleItem()`
  - "Add Selected" button → `drvAddStaged(ctx)` — stages selections
  - Staged preview bar shows what will be added before commit
- **"Add Drive" button** → opens [Drive Marketplace](#10-drive-marketplace)

#### Tab: Own Documents (My Drive)
- Displays documents in the network's own private drive (auto-created)
- Drive name displayed as "Private Drive — [Network Name]"
- Upload button → `toast('Uploading...')` (stubbed in prototype)
- File list with icons, names, sizes

#### Confirm / Discard bar
- Appears when unsaved changes exist (`kmsMarkChanged()`)
- **Confirm** → `kmsConfirm(ctx)` — saves changes
- **Discard** → `kmsDiscard(ctx)` — reverts to snapshot

#### State tracking
`kmsSnapshot(ctx)` captures the current state before editing. `kmsMarkChanged(ctx)` shows the action bar. Managed separately for `'bldr'` and `'kn'` contexts to prevent cross-contamination.

### 8.3 Knowledge Panel in Overview (Read-Only)

**Location:** Widget 3 in the [Overview Widget Grid](#14-overview-widget-grid--drag--resize) — right column, spans both rows.

**Key design rule:** The Overview is read-only. Users can **see** the knowledge configuration but cannot modify it from here. All modifications go through the KN Modal (launched via "Edit →").

#### Header
- "Knowledge" title
- **"View only" badge** (`.ov-kn-ro-badge`) — eye icon + "View only" text — always visible
- **"Edit →" button** (`.ov-kn-edit-btn`) → `openKnModal()` → launches the full editable KN Modal

#### Tabs (`.kn-ptabs`)
Three tabs managed by `switchKnPanelTab(tab, btn)`:

**Packs tab (`#knPnlTp`)**
- Inline search (`.kn-pinline-search`) → `filterOvKnTp(q)` — live filter
- Accordion list (`#ovKnTpZone`) — rendered by `renderOvKnAddedTp(net, query)`
- Each pack row: same visual as builder but **plane chips are static display chips** (not toggles)
  - `on` → blue filled chip
  - `off` → gray chip
  - `disabled` → transparent/muted chip
  - No remove button
- Footer: pack count label (`#ovKnTpLbl`) + "Edit in Knowledge" button → opens KN Modal

**Drives tab (`#knPnlDrives`, `#ovKnDriveZone`)**
- Added drives/folders/documents list — rendered by `renderOvKnDriveAdded(query)`
- No remove buttons, no add buttons
- Footer: drives count (`#ovKnDrvLbl`) + "Edit in Knowledge" button

**Documents tab (`#knPnlOwn`)**
- Own Documents list for this network's private drive
- Drive name: "Private Drive — [Network Name]" (`#ovKnOwnDriveName`)
- No upload button, no delete buttons

#### Interconnection with KN Modal
`renderKnAddedTp()` and `renderKnDriveAdded()` (the editable modal renderers) both call their overview counterparts as side effects:
```
renderKnAddedTp(net)      → also calls → renderOvKnAddedTp(net)
renderKnDriveAdded()      → also calls → renderOvKnDriveAdded()
```
This means **changes made in the KN Modal are immediately reflected in the Overview sidebar** without any manual sync step.

#### Tab state reset
When `openFullView()` is called (navigating to a new network's overview), the Packs tab is always reset to active — ensuring a clean state per network visit.

### 8.4 Global KN Modal (`#knModal`)

Triggered by `openKnModal()` from any context. This is the **authoritative edit surface** for network-level knowledge.

- Same 3-tab structure as Builder Knowledge Modal
- Overlay modal (centered, backdrop dismiss)
- "Manage in Governance →" button (`.km-govern-btn`) — redirects to Governance Studio for TruthPack creation/management
- Full Confirm/Discard bar with change tracking

---

## 9. TruthPack Marketplace

**Trigger:** "Add Knowledge Pack" button in any knowledge tab → `openTpMarketplace(ctx)`

A full-screen overlay modal (`#tpMktModal`) with two views:

### List View
- **Filter sidebar (left):**
  - Show: All / Added / Not Added
  - Sort: A–Z / Most Used / Newest
  - Category filters: HR, Legal, Finance, Sales, Operations, etc.
  - Plane filters: Truth / Sandbox / Sources
  - Active filter chips rendered by `renderTpMktChips()`
- **Grid (right):** `renderTpMktGrid(query)` — card per TruthPack
  - Pack name, description, category badge
  - Plane availability indicators (Truth / Sandbox / Sources dots)
  - Facts / Claims / Documents counts
  - Add/Remove toggle button
  - **Preview button (eye icon)** → `openTpPreview(id)` → opens [TruthPack Preview Popup](#11-truthpack-preview-popup)
- **Search input** — fuzzy match via `mktFuzzyMatch(text, q)` — filters in real time

### Detail View
- Triggered by clicking a pack card (not the eye icon)
- Breadcrumb: TruthPacks > [Pack Name]
- Full pack detail: description, category, plane config, fact list, claim list, document list
- Add/Remove button

### Save / Cancel
- "Add Selected" confirms additions to the current context (builder or KN modal)
- Cancel or backdrop click → `closeTpMarketplace()` → if unsaved changes, shows discard confirmation dialog

---

## 10. Drive Marketplace

**Trigger:** "Add Drive" button in Source Drives tab → `openDriveMarketplace(ctx)`

A full-screen overlay modal (`#drvMktModal`) with two views:

### List View
- **Filter sidebar:** Show / Sort / Category toggles — same pattern as TP Marketplace
- **Drive grid:** `renderDrvMktGrid(query)` — card per drive
  - Drive name, owner, item count, last updated
  - Add button → `addDriveFromMkt(driveId)` — adds the whole drive
  - Preview button → `openDrivePreview(name, desc, key)` → opens [Drive Preview Popup](#12-drive-preview-popup)

### Detail View
- **Breadcrumb navigation** — `navigateDrvMkt(driveId, folderPath)` and `drvMktBcNav(idx)` — supports deep folder navigation
- **Toolbar:** Grid / List view toggle (`drvSetView(v)`), AI Summarize button
- **File type filter** — filter contents by: All / Documents / Spreadsheets / PDFs / Images
- **Grid view:** File cards with type icon, name, size
- **List view:** Table rows with checkbox, name, type, size, modified date
- **Checkbox selection:** `drvToggleItem()`, `drvToggleAll()` — select specific files/folders to add
- **"Add Selected" button** — `drvAddSelected(driveId)` — stages the selection
- **AI Summary panel** — `drvAiSummarize()` — shows an AI-generated summary of folder contents

---

## 11. TruthPack Preview Popup

**Trigger:** Eye icon on a TruthPack card in the Marketplace → `openTpPreview(id)`

A floating popup (`#tpPreviewOv`, `.tp-preview-ov`) that slides in over the marketplace without closing it.

**Displays:**
- Pack name + category badge
- Description
- Plane availability — read-only indicator chips (Truth / Sandbox / Sources)
- **Facts/FAQs list** — expandable, with each fact shown as a row
- **Claims list** — expandable
- **Documents list** — expandable, with file icons
- Auto-assignment rules (if configured by the pack creator)
- Add / Remove button

**Purpose:** Allows the user to inspect what's inside a TruthPack before adding it — critical because pack names can be similar when there are hundreds of packs.

---

## 12. Drive Preview Popup

**Trigger:** Eye icon on a Drive card → `openDrivePreview(name, desc, key)`

A floating panel (`#drivePrevOv`) that renders the drive's folder/file tree.

**Root view (`_dpvRenderRoot()`):**
- Drive name + description
- Grid of folders: icon + name + item count
- Clicking a folder → `dpvOpenFolder(folderId)` — navigates into it

**Folder view (`dpvOpenFolder()`):**
- Breadcrumb navigation back to root (`dpvBackToRoot()`)
- List of files with: type icon, name, size
- Per-item "Add" button → `drvAddItem()` — adds to the current context
- "Add All" button → `dpvAddAll()` — adds all files in the current view

**Add state:** Added items show a green "Added ✓" indicator; `_dpvFlipBtn()` manages this toggle.

---

## 13. Create Network — AI Wizard

**Trigger:** "+ New Network" button in the List view topbar → `openCreateAi()`

A multi-step modal (`#createAiModal`) that guides the user through creating a new Agentic Network via conversational AI.

### Flow
**Step 1 — Name**  
Input field: "Network name..." → validates non-empty → stores in `aiAnswers[0]`

**Step 2 — Goal**  
Textarea: "Describe the main goal..." → `aiAnswers[1]`

**Step 3 — Trigger**  
Radio cards: Schedule / Event / Manual / API → `aiAnswers[2]`

**Step 4 — Data**  
Checkboxes for data sources: CRM / Spreadsheets / Documents / Email / API → `aiAnswers[3]`

**Step 5 — AI Processing**  
Final step — the modal shows an animated "Generating your network..." state, then a **node diagram preview** rendered inline showing the proposed network structure.

### Confirm / Edit
- **"Looks good, create it"** → adds the network to `NETWORKS[]` and navigates to the new network's Builder view
- **"Edit manually"** → opens Builder view with the generated draft

### Navigation
- Back/Next buttons per step
- Step indicator dots at the bottom
- Cancel × → `closeCreateAi()`

---

## 14. Overview Widget Grid — Drag & Resize

### Grid Layout
```css
grid-template-columns: 1fr 320px;
grid-template-rows: auto auto;
```
- `data-pos="1"` → left column, row 1 (Network Composition)
- `data-pos="2"` → left column, row 2 (Recent Executions)
- `data-pos="3"` → right column, spans both rows (Knowledge)

### Drag to Reorder
Implemented via HTML5 Drag API in `initOvWidgets()`:
1. User mousedowns on `.ov-drag-grip` → sets `draggable="true"` on the parent `.ov-widget`
2. `dragstart` → records source widget, adds `.ov-dragging` class (reduces opacity to 25%)
3. `dragover` on another widget → adds `.ov-drag-over` class (dashed blue outline)
4. `drop` → swaps `data-pos` attributes between source and target; CSS grid updates position automatically
5. `dragend` / `dragleave` → cleanup classes

**Key design decision:** `data-pos` values are swapped (not DOM nodes), so the grid layout updates through CSS alone.

### Resize Handle
Each widget has `.ov-resize-hdl` (bottom-right corner, `cursor: se-resize`):
1. `mousedown` → captures `startY` + `startH` (current `offsetHeight`)
2. `mousemove` → sets `style.minHeight = startH + (e.clientY - startY) + 'px'`
3. `mouseup` → removes event listeners

Resize handle is **opacity: 0** until the widget is hovered (`.ov-widget:hover .ov-resize-hdl { opacity: 1 }`).

### Visual States
| Class | Applied to | When |
|-------|-----------|------|
| `.ov-dragging` | Source widget | During drag |
| `.ov-drag-over` | Target widget | Drag enters it |

---

## 15. State Management

All state is in-memory JavaScript variables. Key global state:

| Variable | Type | Description |
|----------|------|-------------|
| `NETWORKS` | Array | Source of truth for all network data |
| `selectedId` | string\|null | Currently selected network in List view |
| `currentOvId` | string\|null | Network shown in Full Overview |
| `currentFilter` | string | Active status filter (`'all'` \| `'active'` \| ...) |
| `currentSearch` | string | Search query |
| `driveAddedItems` | Array | Added drives/files in Builder context |
| `knDriveAddedItems` | Array | Added drives/files in KN Modal context |
| `_drvStagedBldr` / `_drvStagedKn` | Array | Staged (uncommitted) drive selections |
| `tpMktCtx` / `drvMktCtx` | string | Which context opened the marketplace (`'bldr'` \| `'kn'`) |
| `_tpMktAdded` | Set | TruthPack IDs currently added (marketplace state) |

### Context Isolation
Builder and KN Modal maintain **separate state pools** via `_drvStaged(ctx)` and `_drivePool(ctx)` helper functions — preventing edits in one modal from affecting the other.

### Change Tracking
`kmsSnapshot(ctx)` / `kmsMarkChanged(ctx)` / `kmsConfirm(ctx)` / `kmsDiscard(ctx)` implement a simple dirty-tracking pattern per modal context. The Confirm/Discard action bar appears only when `kmsMarkChanged` has been called since the last snapshot.

---

## 16. Component Reuse Map

Several components are rendered in multiple contexts. Engineering should implement these as true shared components:

| Component | Contexts | Notes |
|-----------|---------|-------|
| `buildKmAddedRow(tp, removeCallback, readOnly)` | Builder modal, KN Modal, Overview sidebar | `readOnly=true` suppresses remove button and converts plane toggles to static chips |
| `buildKmDriveAddedRow(item, removeCallback, readOnly)` | Builder modal, KN Modal, Overview sidebar | Same `readOnly` pattern |
| `buildKmDriveCatalogRow()` | Builder modal, KN Modal | Shared catalog row renderer |
| Knowledge 3-tab panel | Builder, KN Modal, Overview (read-only), Node Inspector | Same tab names and IDs; layout changes per container |
| TruthPack plane chips | Added rows, Preview popup, Marketplace detail | Shared display; interactivity varies by context |
| `.net-card` | List view | Fully dynamic, rendered by `buildCard(n)` |
| Toast system | Everywhere | `toast(msg, type)` — singleton |
| Confirm dialog (`.rm-confirm-dialog`) | All remove actions | `kmsRemoveWithConfirm(name, type, fn)` |

---

## 17. E2E Test Coverage

**Suite location:** `/tmp/aims-e2e/tests/overview.spec.ts`  
**Test runner:** Playwright (Chromium)  
**Last run result:** 29/29 passed ✅ in 37.5s

| Suite | Coverage |
|-------|---------|
| Overview opens and renders | Network card click → preview → full view; name in topbar; 4 metric cards; flow nodes; executions container |
| Knowledge panel read-only | "View only" badge present; no Add Knowledge Pack button; no Add Drive button; no Upload button in Documents tab; "Edit in Knowledge" button opens KN Modal; pack count label; Drives tab footer; inline search filters |
| KN Modal remains editable | Add Knowledge Pack button exists; Manage in Governance button; remove buttons on packs |
| Widget grid drag & resize | 3 widgets present; each has drag grip; each has resize handle; correct `data-pos` values; drag grip sets `draggable=true`; resize handle has `se-resize` cursor; Knowledge widget at pos 3 |
| Knowledge panel tab navigation | Packs tab active by default; Drives tab shows drives panel; Documents tab shows own-docs panel; switching back to Packs works |
| Multi-network state | Tab state resets to Packs on re-open; Private Drive name updates per network |

---

## 18. Implementation Notes for Engineering

### Recommended Architecture for React Migration

**Views** → React Router routes  
**Network cards** → React component, data from API  
**Knowledge panel** → Single `<KnowledgePanel readOnly={boolean} />` component — same component renders in Overview, Builder inspector, and KN Modal  
**TruthPack plane toggles** → Controlled component — `disabled` state driven by the pack creator's configuration (from API), `on/off` state local to the network  
**Widget grid** → `react-grid-layout` or equivalent — `data-pos` → `layout` prop  
**Marketplace modals** → Lazy-loaded routes or portals  

### API Contract Surface (inferred from prototype)

The following data shapes will need API backing:

- `GET /networks` → list with filters/search/pagination
- `GET /networks/:id` → full network detail including `flow`, `recentRuns`, `metrics`, `knowledge`
- `GET /networks/:id/runs` → paginated execution history
- `GET /truthpacks` → catalog with filter/sort/search
- `GET /truthpacks/:id` → detail with facts, claims, documents
- `GET /drives` → catalog
- `GET /drives/:id/tree` → folder/file tree
- `PUT /networks/:id/knowledge` → save knowledge configuration (packs + planes + drives)

### Key Design Decisions to Preserve in Implementation

1. **TruthPacks are atomic** — users add or remove the whole pack. No item-level selection within a pack. The only granularity is toggling planes (Truth / Sandbox / Sources) on/off — and only planes the creator enabled can be toggled.

2. **Overview is always read-only** — no knowledge modifications from the Overview dashboard. All edits go through the KN Modal. This is enforced in the prototype and E2E-tested.

3. **Knowledge component is universal** — the same 3-tab structure (TruthPacks / Shared Drives / Own Documents) appears identically in every context. Container shape changes; content and behavior do not.

4. **Private Drive is auto-created** — every network gets its own drive on creation (unique ID). It is not shareable with other networks or agents.

5. **Plane confidence model:**
   - Truth Plane only → 100% confidence
   - + Sandbox Plane → ~80% confidence
   - + Sources Plane → ~60% confidence  
   Engineers should preserve this semantic in any filtering/retrieval logic.

6. **Change tracking is per-context** — builder knowledge changes and KN modal changes are tracked independently. Confirming one does not affect the other.

7. **Marketplace state is transient** — selections in the TruthPack or Drive marketplace are staged until "Add Selected" is confirmed. Closing without confirming prompts a discard dialog.
