# Knowledge System — V1 Implementation Spec
**Scope:** Agentic Studio — Agentic Networks  
**Prepared for:** Principal Engineer  
**Status:** Prototype finalized, E2E tested ✅  
**Prototype file:** `agentic-studio.html`

---

## Table of Contents

1. [Conceptual Architecture](#1-conceptual-architecture)
2. [Data Model](#2-data-model)
3. [The Three Sub-Sections](#3-the-three-sub-sections)
4. [TruthPack Plane System](#4-truthpack-plane-system)
5. [Surface 1 — Global KN Modal (Edit)](#5-surface-1--global-kn-modal-edit)
6. [Surface 2 — Overview Knowledge Panel (Read-Only)](#6-surface-2--overview-knowledge-panel-read-only)
7. [Surface 3 — Builder Knowledge Modal](#7-surface-3--builder-knowledge-modal)
8. [TruthPack Marketplace](#8-truthpack-marketplace)
9. [Drive Marketplace](#9-drive-marketplace)
10. [TruthPack Preview Popup](#10-truthpack-preview-popup)
11. [Drive Preview Popup](#11-drive-preview-popup)
12. [Component Reuse & readOnly Pattern](#12-component-reuse--readonly-pattern)
13. [State Management](#13-state-management)
14. [Interconnection Between Surfaces](#14-interconnection-between-surfaces)
15. [V1 Scope Boundaries](#15-v1-scope-boundaries)

---

## 1. Conceptual Architecture

Every entity in AIMS-OS that can reason — an Agent, an Agentic Network, a Worker — has a **Knowledge Layer**. The Knowledge Layer is how you define what context that entity has access to when making decisions.

For Agentic Networks in V1, there are **three layers** of knowledge:

| Layer | Description | Where it lives |
|-------|-------------|----------------|
| **Global / Transversal** | Network-level context. Every node in the graph inherits this by default. | Shield icon in the Overview; the main KN Modal |
| **Node-level** | Each individual node (Agent, Workflow, RAG) can have its own knowledge index on top of the global one. | Node Inspector in the Builder |
| **RAG-type Node** | A node whose entire purpose is to query the knowledge base and return an answer as a step in the orchestration. It has the same knowledge structure, but the output is a response to a specific question. | Builder canvas — special node type |

**For V1, the Global layer is the primary implementation focus.** Node-level and RAG node knowledge use the exact same component, just mounted in a different container.

---

## 2. Data Model

### Network Knowledge (global layer)

Each network carries a `knowledge[]` array:

```typescript
interface NetworkKnowledge {
  id: string;          // TruthPack ID
  name: string;        // Display name
  docs: number;        // Document count in this pack
  facts: number;       // Fact/FAQ count
  claims: number;      // Claim count
  planes: {
    truth:   'on' | 'off' | 'disabled';
    sandbox: 'on' | 'off' | 'disabled';
    sources: 'on' | 'off' | 'disabled';
  };
}
```

### TruthPack Catalog Entry

```typescript
interface TruthPack {
  id: string;
  name: string;
  tag: string;          // Category label (Finance, HR, Legal, etc.)
  tagColor: string;
  tagBg: string;
  facts: number;
  claims: number;
  docs: number;
  planes: {
    truth:   { enabled: boolean; on: boolean; };
    sandbox: { enabled: boolean; on: boolean; };
    sources: { enabled: boolean; on: boolean; };
  };
  desc: string;
}
```

The `planes` object on a catalog pack defines what the **creator** configured:
- `enabled: false` → this plane is `disabled` in all networks that add it — no one can turn it on
- `enabled: true, on: true` → plane is `on` by default when the pack is added
- `enabled: true, on: false` → plane is `off` by default, but the consumer can turn it on

### Source Drive Item (added to a network)

```typescript
interface DriveAddedItem {
  id: string;           // Unique item ID
  type: 'drive' | 'folder' | 'doc';
  name: string;
  driveKey: string;     // Reference to the drive catalog entry
  driveName: string;    // Display name of the parent drive
  sub: string;          // Subtitle (e.g. "3 folders · 12 documents")
}
```

---

## 3. The Three Sub-Sections

The Knowledge panel is always divided into three tabs, in this order. This structure is **identical across all surfaces** — only the container and read/write permissions change.

```
┌──────────────────────────────────────────────────┐
│  [ TruthPacks ]  [ Shared Drives ]  [ Documents ]│
├──────────────────────────────────────────────────┤
│                                                  │
│  Content panel for active tab                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

| Tab | Sub-section | What it contains |
|-----|-------------|-----------------|
| **TruthPacks** | Curated knowledge packs | Add/view packs from Governance. Toggle planes per pack. |
| **Shared Drives** | External shared documents | Add drives, folders, or specific documents from the workspace catalog. |
| **Documents** | Own Documents (Private Drive) | Every network gets an auto-created private drive on creation. Upload documents that belong exclusively to this network. |

### Private Drive Rule
When an Agentic Network is created, the system auto-generates a drive with the network's ID as its unique key. This drive:
- Is named `"Private Drive — [Network Name]"` in the UI
- Cannot be shared with other networks or agents
- Lives only in the **Documents** tab of this network's knowledge panel
- The name `#ovKnOwnDriveName` in the prototype is populated dynamically when the overview loads

---

## 4. TruthPack Plane System

This is one of the most important conceptual pieces to get right in V1.

### What a TruthPack is

A TruthPack is **not** a filtered view of a Truth Plane. It is a curated package — assembled by a knowledge administrator in Governance Studio — that bundles together:
- **Facts / FAQs** (from the Truth Plane)
- **Claims** (from the Sandbox Plane)
- **Documents / Sources** (from the Sources Plane)

The administrator selects which facts, claims, and documents belong in this pack and gives it a purpose-specific name ("Finance Playbook 2024", "Sales GTM Playbook", etc.).

### The Three Planes

| Plane | Confidence | Color | What it contains |
|-------|-----------|-------|-----------------|
| **Truth Plane** | 100% | Blue (`var(--pri)`) | Verified facts and FAQs. Authoritative, grounded responses. |
| **Sandbox Plane** | ~80% | Purple (`var(--pur)`) | Unverified claims and drafts. Exploratory or emerging knowledge. |
| **Sources Plane** | ~60% | Teal (`#34D399`) | Raw documents and reference material. Used for citation and deep lookup. |

### Plane States per Pack (on a network)

Each plane in an added TruthPack has one of three states:

| State | Meaning | Who controls it | Visual |
|-------|---------|-----------------|--------|
| `on` | Plane is active — the network can use this plane's content | Consumer (network creator), if creator allowed it | Blue filled chip / blue "On" badge |
| `off` | Plane exists in the pack but is currently disabled on this network | Consumer (network creator), if creator allowed it | Gray chip / gray "Off" badge |
| `disabled` | Creator never enabled this plane for this pack. Cannot be turned on. | Pack creator only, via Governance Studio | Muted/transparent chip + "off by creator" label |

### Plane Toggle Rules

When adding a TruthPack to a network:
1. The network **inherits the creator's defaults** — if the creator set Truth=on, Sandbox=off, Sources=disabled, that's what gets added.
2. The consumer **can turn off** a plane that came as `on`.
3. The consumer **can turn on** a plane that came as `off`.
4. The consumer **cannot interact** with a plane that is `disabled`. It shows as locked.

This is implemented in `toggleTpPack_plane()` / `toggleBldrTpPack_plane()`.

### Why This Matters for the Retrieval System
The plane on/off state is **not** content filtering — it's a confidence gate. When the network runs and queries its knowledge:
- Only **Truth Plane** → only retrieves verified facts (100% confidence queries)
- Truth + **Sandbox** → also pulls unverified claims (~80%)
- Truth + Sandbox + **Sources** → also pulls raw documents (~60%)

Engineering should treat the plane state as a retrieval filter parameter passed to the RAG pipeline.

---

## 5. Surface 1 — Global KN Modal (Edit)

**Trigger:** `openKnModal()` — called from the "Edit →" button in the Overview Knowledge Panel, or directly from the Builder.

**DOM ID:** `#knModal`  
**Behavior:** Overlay modal (centered, 800px wide). Backdrop click closes it.

### What it renders

**Header:**
- "Knowledge" title + summary stats chips: `N packs` / `N drives`
- "Manage in Governance →" button (`.km-govern-btn`) — redirects the user to Governance Studio to create or edit TruthPacks. This button is **always visible** in the edit modal.
- Close button (×)

**Tab: TruthPacks** (`#knTpAddedZone`)

Rendered by `renderKnAddedTp(net)` → calls `buildKmAddedRow(tp, 'toggleTpPack')`.

- **Added zone (top half):** Accordion list of TruthPacks currently attached to this network.
  - Each row (`.km-ac`): arrow toggle, book icon, pack name, subtitle (N facts · N claims · N docs), plane chips
  - Expand row → shows plane rows with toggles (functional — not read-only here)
  - Remove button (`×`) → `kmsRemoveWithConfirm(name, 'truthpack', fn)` → shows inline confirm dialog before removing
  - Inline search filters the added list: `<input oninput="filterKnTp(this.value)">`
- **"Add Knowledge Pack" button** → `openTpMarketplace('kn')` → opens [TruthPack Marketplace](#8-truthpack-marketplace)
- **Label:** "N packs added" (`#knAddedLbl`)

**Tab: Shared Drives** (`#knDriveAddedZone`)

Rendered by `renderKnDriveAdded()` → calls `buildKmDriveAddedRow(item, 'toggleKnDrive')`.

Two-zone layout:
- **Added zone:** List of added drives/folders/documents as accordion rows
  - Drive rows: expand to show top-level contents preview (first 4 folders/files) + "Browse contents →" button → opens Drive Preview popup
  - Folder rows: expand to show parent drive name
  - Document rows: expand to show parent drive name
  - Remove button per item
- **Catalog zone (`#knDriveCatalogZone`):** Browse workspace drives inline
  - Each drive: expandable tree → Folder → File → checkbox selection
  - Staged selection: check items → "Add Selected" button → `drvAddStaged('kn')`
  - Staged preview bar appears below showing what's about to be added
  - "Add Drive" button → opens [Drive Marketplace](#9-drive-marketplace) full modal
  - Inline search: `<input oninput="renderKnDriveCatalog(this.value)">`

**Tab: Own Documents** (`#knOwnZone`)

- Drive name: "Private drive — [Network Name]" (`#knOwnDriveName`)
- File list for this network's private drive
- Upload button (V1: stubbed; V1.5: real upload)

**Confirm / Discard bar** (`.kms-bar`)
- Hidden until `kmsMarkChanged('kn')` is called
- **Confirm** → `kmsConfirm('kn')` — saves changes, hides bar
- **Discard** → `kmsDiscard('kn')` — reverts to snapshot taken when modal was opened

---

## 6. Surface 2 — Overview Knowledge Panel (Read-Only)

**Location:** Right column of the Overview dashboard, Widget 3 (`data-pos="3"`).  
**Key rule:** This surface is **strictly read-only.** No add, remove, or toggle operations are possible here. It is a live mirror of the network's knowledge configuration.

### Header
```
[ drag grip ] Knowledge     [ 👁 View only ]  [ Edit → ]
```
- `View only` badge (`.ov-kn-ro-badge`) — always visible, cannot be hidden
- `Edit →` button (`.ov-kn-edit-btn`) → `openKnModal()` — the only action available

### Tab: Packs (`#knPnlTp`, `#ovKnTpZone`)

Rendered by `renderOvKnAddedTp(net, query)`.

- Same accordion rows as the edit modal — but rendered with `readOnly=true`
- **Plane toggles become static chips** — no `<input type="checkbox">`, just `<span>` badges
  - `on` → blue filled badge showing "On"
  - `off` → gray badge showing "Off"
  - `disabled` → muted transparent badge showing "Off" + "off by creator" tag
- **No remove button**
- Inline search: `<input oninput="filterOvKnTp(this.value)">` — filters the accordion list, does not modify data
- Footer: "N packs" label (`#ovKnTpLbl`) + "Edit in Knowledge" button → `openKnModal()`

### Tab: Drives (`#knPnlDrives`, `#ovKnDriveZone`)

Rendered by `renderOvKnDriveAdded(query)`.

- Same drive/folder/doc accordion rows — `readOnly=true`
- No remove button, no add button, no catalog zone
- "Browse contents →" is still present on drive rows → opens Drive Preview popup (view-only, informational)
- Footer: "N drives" label (`#ovKnDrvLbl`) + "Edit in Knowledge" button → `openKnModal()`

### Tab: Documents (`#knPnlOwn`)

- Private drive file list — read-only
- Drive name: "Private Drive — [Network Name]" (`#ovKnOwnDriveName`)
- No upload button, no delete

### Tab State Reset
Every time `openFullView(net)` is called (navigating to a network's Overview), the tabs reset to **Packs** as default. This ensures clean state when browsing between multiple networks.

---

## 7. Surface 3 — Builder Knowledge Modal

**Trigger:** "Knowledge →" button inside the Node Inspector panel → `openBldrKnPanel()` / `openKnModal(ctx='bldr')`

**Context:** Either network-level (global shield) or node-level (specific node selected).

Structurally identical to the Global KN Modal, with these differences:

| Aspect | Global KN Modal | Builder Knowledge Modal |
|--------|----------------|------------------------|
| Context key | `'kn'` | `'bldr'` |
| Added TP state | `tpAddedIds` (shared) | `tpAddedIds` (shared, same pool in prototype; in production: node-scoped) |
| Added drives pool | `knDriveAddedItems` | `driveAddedItems` |
| Staged drives pool | `_drvStagedKn` | `_drvStagedBldr` |
| Toggle functions | `toggleTpPack`, `toggleKnDrive` | `toggleBldrTpPack`, `toggleBldrDrive` |
| Confirm/Discard | `kmsConfirm('kn')` | `kmsConfirm('bldr')` |

The two contexts are **fully isolated** — changes in the Builder modal do not affect the Global KN Modal's state and vice versa.

---

## 8. TruthPack Marketplace

**Trigger:** "Add Knowledge Pack" button in any knowledge tab → `openTpMarketplace(ctx)`  
**DOM ID:** `#tpMktModal`  
**Layout:** Full-screen overlay, 2-column (filter sidebar + content area)

### Filter Sidebar (left, ~220px)

**Show filter** (radio buttons):
- All
- Added
- Not Added

**Sort** (radio buttons):
- A–Z
- Most Used
- Newest

**Category filters** (multi-select toggle buttons):
- Finance, HR, Legal, Sales & Revenue, Customer Service, Operations — plus any custom categories from the catalog
- `toggleTpMktCat(cat, btn)` — adds/removes from `tpMktCategorySet`

**Plane filters** (multi-select toggle buttons):
- Truth / Sandbox / Sources
- `toggleTpMktPlane(plane, btn)` — filters to only show packs that have this plane enabled
- `tpMktPlanesFilter` Set

**Active filter chips** — `renderTpMktChips()` renders a dismissible chip per active filter  
**Clear All** — `clearTpMktFilters()` resets all filters

### Content Area (right)

**Search input** — live filter using `mktFuzzyMatch(text, q)` — matches pack name and description  
**Grid** — `renderTpMktGrid(query)` — renders `.tp-mkt-card` per pack

Each card shows:
- Book icon + pack name
- Category badge (color-coded)
- Plane availability dots (Truth / Sandbox / Sources) — filled = enabled by creator
- Stats: N facts · N claims · N docs
- Pack description (2 lines, truncated)
- **Eye icon button** → `openTpPreview(id)` → opens [TruthPack Preview Popup](#10-truthpack-preview-popup) **without closing the marketplace**
- **Add / Remove button** → `addTpFromMkt(packId)` — adds to the current context, updates button to "✓ Added"

### Detail View

Triggered by clicking anywhere on the card except the eye/add buttons.  
`navigateTpMkt(packId)` → `renderTpMktDetailPanel(packId)`

Shows:
- Breadcrumb: "TruthPacks >" + pack name
- Full description
- Planes section with on/off/disabled state for each plane
- Expandable sections: Facts (list), Claims (list), Documents (list)
- Section search: `filterTpDetailSection(packId)` — filters within the detail view
- Add / Remove button

### Save / Cancel
- Changes are staged until "Save" is clicked → `confirmSaveMkt()`
- Cancel or backdrop → `closeTpMarketplace()` → if changes exist, shows discard confirmation dialog
- `tpMktHasChanges()` compares current added set vs `tpMktInitialAdded` snapshot taken at `openTpMarketplace()`

---

## 9. Drive Marketplace

**Trigger:** "Add Drive" button in the Source Drives tab → `openDriveMarketplace(ctx)`  
**DOM ID:** `#drvMktModal`  
**Layout:** Full-screen overlay, 2-column (filter sidebar + content area)

### Filter Sidebar (left)

Same pattern as TruthPack Marketplace:
- Show: All / Added / Not Added
- Sort: A–Z / Most Items / Newest
- Category multi-select: Governance & Policy, Finance, HR, Sales, Legal, etc.
- Active filter chips + Clear All

### Content Area (right)

**Drive Grid** — `renderDrvMktGrid(query)` — card per drive

Each card:
- Drive icon + drive name
- Category badge
- Owner name + last updated
- Item count (N folders · N documents)
- Description
- **Preview button** → `openDrivePreview(name, desc, key)` → opens [Drive Preview Popup](#11-drive-preview-popup)
- **"+ Add Drive" button** → `addDriveFromMkt(driveId)` — adds the entire drive to the current context

### Detail View

`navigateDrvMkt(driveId, folderPath)` → `renderDrvMktDetailPanel(driveId, folderPath)`

Shows the full folder/file tree for a drive, supporting multi-level navigation:

**Toolbar:**
- Breadcrumb (`drvMktBcNav(idx)`) — navigate back up the folder tree
- Grid / List view toggle (`drvSetView(v)`)
- **AI Summarize button** → `drvAiSummarize(driveId, folderName)` — generates an AI summary of the folder's contents (toast in prototype; real AI call in V1)

**File type filter tabs:**
- All / Documents / Spreadsheets / PDFs / Images

**Grid view:** File cards — type icon, name, size, modified date  
**List view:** Table rows — checkbox, name, type, size, modified date

**Selection:**
- `drvToggleItem(itemId, driveId, isFolder)` — toggle checkbox per item
- `drvToggleAll(driveId)` — select/deselect all visible items
- Clicking a folder navigates into it: `drvItemNav(e, driveId, encodedPath)`

**"Add Selected" button** — `drvAddSelected(driveId)` — adds checked items (drive, folders, or individual documents) to the context. This is the granular selection path.

### Save / Cancel
Same discard pattern as TruthPack Marketplace — `drvMktHasChanges()` / `confirmSaveMkt()` / discard dialog.

---

## 10. TruthPack Preview Popup

**Trigger:** Eye icon on any TruthPack card (marketplace or catalog row) → `openTpPreview(id)`  
**DOM ID:** `#tpPreviewOv`  
**Position:** Floats over the marketplace without closing it. `z-index: 800` (marketplace is `z-index: 700`).

### Content

- Pack name + category badge
- Description text
- **Planes section** — read-only indicator chips for each plane:
  - Truth / Sandbox / Sources — shown as color chips, not toggles
  - `disabled` planes shown grayed out

- **Facts / FAQs section** — collapsible list of all facts in the pack
  - Each fact: index number + text content + optional tags
  - Section count badge

- **Claims section** — collapsible list of all claims
  - Each claim: index + text + confidence indicator

- **Documents section** — collapsible list of all documents
  - Each document: file icon + name + type badge

- **Auto-assignment rules** — if the pack creator configured automatic population rules (e.g., "Add all facts with tag=policy"), those are shown here as read-only tags

- **Add / Remove button** at the bottom — reflects current state for the active context

### Purpose
Users need to inspect pack contents before adding, especially when there are many packs with similar names. The preview gives them full visibility without leaving the browse flow.

---

## 11. Drive Preview Popup

**Trigger:** Eye icon on any drive card → `openDrivePreview(name, desc, driveKey)`  
**DOM ID:** `#drivePrevOv`  
**Position:** Floats over the marketplace, similar z-index stack.

### Root View (`_dpvRenderRoot()`)

- Drive name + description
- Grid of folders: colored folder icon + name + item count chip
- Clicking a folder → `dpvOpenFolder(folderId)` → navigates into it

### Folder View (`dpvOpenFolder()`)

- Breadcrumb bar: Drive name > Folder name — click drive name → `dpvBackToRoot()`
- Document list: file icon (by type) + name + size
- Per-file **"Add" button** → `drvAddItem(itemId, type, name, driveKey, driveName, silent)` — adds this single document to the current context
  - After adding, button flips to "✓ Added" (`.dpv-add-btn.added`) via `_dpvFlipBtn(id, state)`
- **"Add All" button** → `dpvAddAll()` — adds all documents visible in the current folder view

### State Sync
When items are added via Drive Preview, the added state is immediately reflected:
- In the Added zone of the current Knowledge modal
- In the Overview sidebar (via `renderOvKnDriveAdded()`)
- In the staged preview bar if in staged mode

---

## 12. Component Reuse & readOnly Pattern

The entire Knowledge System is built around **one shared component** rendered in different contexts with a `readOnly` flag.

### `buildKmAddedRow(tp, removeCallback, readOnly)`

The single function that renders a TruthPack accordion row. Used in:

| Surface | `removeCallback` | `readOnly` |
|---------|-----------------|-----------|
| Global KN Modal | `'toggleTpPack'` | `false` (default) |
| Builder Knowledge Modal | `'toggleBldrTpPack'` | `false` |
| Overview Knowledge Panel | `'toggleTpPack'` | **`true`** |

When `readOnly = true`:
- Plane rows render static `<span>` badges instead of `<label><input type="checkbox">` toggles
- Remove button (`×`) is not rendered
- No onclick handlers on plane rows

### `buildKmDriveAddedRow(item, removeCallback, readOnly)`

Same pattern for drive/folder/document rows:

| Surface | `removeCallback` | `readOnly` |
|---------|-----------------|-----------|
| Global KN Modal | `'toggleKnDrive'` | `false` |
| Builder Knowledge Modal | `'toggleBldrDrive'` | `false` |
| Overview Knowledge Panel | `'toggleKnDrive'` | **`true`** |

When `readOnly = true`:
- Remove button not rendered
- "Browse contents →" is still rendered (informational, opens Drive Preview)

### Engineering Recommendation
In React, implement this as a single `<TruthPackRow>` component with a `readOnly: boolean` prop. The same component should render in all three knowledge surfaces. Do not create separate read-only and edit-mode components.

---

## 13. State Management

### Per-surface state isolation

Two knowledge pools exist in the prototype, one per modal context:

```javascript
// Source drives
let driveAddedItems   = [];  // builder context
let knDriveAddedItems = [];  // global KN modal context

// Staged (selected but not yet committed)
let _drvStagedBldr = [];
let _drvStagedKn   = [];
```

TruthPack IDs (`tpAddedIds`) are currently shared in the prototype. In production, **each context should maintain its own TP state** — a node-level knowledge config is independent of the network-level config.

### Change Tracking

```javascript
kmsSnapshot(ctx)       // capture current state when modal opens
kmsMarkChanged(ctx)    // show confirm/discard bar
kmsConfirm(ctx)        // save — clear dirty flag, hide bar
kmsDiscard(ctx)        // revert to snapshot, hide bar
```

This pattern must be implemented per context (`'kn'` and `'bldr'` independently). Confirming in the Builder modal must not affect the Global KN modal's dirty state.

### Remove Confirmation

```javascript
kmsRemoveWithConfirm(name, type, fn)
```

All remove operations (TruthPack or drive item) go through this function, which shows an inline confirm dialog (`#rmConfirmDialog`) before executing `fn()`. This prevents accidental removals.

### Marketplace Snapshot

Both marketplaces take a snapshot of the added state when they open:
- `tpMktInitialAdded = [...tpAddedIds]` in `openTpMarketplace()`
- Similar for drive marketplace

`tpMktHasChanges()` diffs current vs initial to decide whether to show the discard dialog on cancel.

---

## 14. Interconnection Between Surfaces

This is the most critical implementation detail.

### Auto-sync: KN Modal → Overview Panel

When the user saves changes in the Global KN Modal, the Overview Panel updates automatically — no polling, no pub/sub, no extra call.

This works because `renderKnAddedTp()` and `renderKnDriveAdded()` call their overview counterparts as side effects:

```javascript
function renderKnAddedTp(net) {
  // ... renders #knTpAddedZone (edit modal)
  renderOvKnAddedTp(net);   // ← also renders #ovKnTpZone (overview sidebar)
}

function renderKnDriveAdded() {
  // ... renders #knDriveAddedZone (edit modal)
  renderOvKnDriveAdded();   // ← also renders #ovKnDriveZone (overview sidebar)
}
```

**In React:** This should be implemented via shared state (Context, Zustand, or Redux slice). Both `<KnowledgeModal>` and `<OverviewKnowledgePanel>` read from the same `network.knowledge` state. When the modal commits changes, the shared state updates and both surfaces re-render.

### Tab State

The Overview Panel's active tab persists during a session but **resets to Packs** each time `openFullView(net)` is called with a new network. This ensures you always see the most relevant tab (TruthPacks) first when switching between networks.

---

## 15. V1 Scope Boundaries

### ✅ In V1

| Feature | Notes |
|---------|-------|
| Global Knowledge Layer (network-level) | Full read/write via KN Modal |
| Three sub-sections: TruthPacks / Shared Drives / Own Documents | All three tabs in all three surfaces |
| TruthPack plane toggle (on/off) | Truth, Sandbox, Sources per pack |
| Disabled planes (set by pack creator) | Cannot be enabled by consumer |
| Add/remove TruthPacks | Via inline catalog + Marketplace modal |
| Add drives, folders, documents | Via inline catalog tree + Drive Marketplace |
| TruthPack Marketplace | Full filter/sort/search, detail view, preview popup |
| Drive Marketplace | Full filter/sort/search, deep folder navigation, item selection |
| TruthPack Preview Popup | Facts, claims, documents, plane state |
| Drive Preview Popup | Folder navigation, per-item add, Add All |
| Overview read-only Knowledge Panel | All three tabs, inline search, auto-sync with modal |
| Change tracking (Confirm/Discard) | Per-context, per-modal |
| Remove confirmation dialogs | All removal flows |
| "Manage in Governance →" button | Redirects to Governance Studio |
| Private Drive per network | Auto-created, shown in Documents tab |

### 🚫 Not in V1 (deferred)

| Feature | When |
|---------|------|
| Node-level knowledge (per-node index in Builder) | V1.5 — same component, different mount point |
| RAG-type node | V1.5 |
| Auto-assignment rules for TruthPacks | V1.5 — pack creator defines rules, system auto-populates |
| Real document upload to private drive | V1.5 — UI stubbed in prototype (shows toast) |
| AI Summarize for drive folders | V1.5 — UI present, backend not yet |
| Contacts & Campaigns Knowledge | V2 — same component adapted |

### 🏗️ Integration Dependencies

| Dependency | Owned by |
|------------|---------|
| TruthPack catalog API | Governance Studio team |
| Drive catalog API | Drive / Storage team |
| Network knowledge save/load | Agentic Studio backend |
| Plane-based retrieval filtering | RAG / Knowledge Retrieval team |
| Private drive auto-creation on network create | Agentic Studio backend |

---

## Appendix: Key UI/UX Rules to Enforce in Code

1. **Never show Add/Remove/Upload buttons in the Overview panel.** The `readOnly` flag must be passed reliably. If it defaults to `false`, the Overview will accidentally become editable.

2. **Disabled planes (`disabled`) can never become `on` or `off`.** The toggle for disabled planes renders as `<input disabled>` or is not rendered at all. The API should reject any attempt to change a disabled plane state.

3. **TruthPacks are all-or-nothing.** You either add the whole pack or you don't. The only granularity is planes. Do not implement item-level selection within a pack at the network level.

4. **Plane state inheritance.** When a pack is added to a network, the default plane states come from the pack creator's configuration (`pack.planes.truth.on`, etc.), not from user preference. The user can override `on→off` or `off→on` for enabled planes only.

5. **Discard always reverts to the snapshot.** `kmsDiscard()` should restore the exact state captured at `kmsSnapshot()`. If the user added 3 packs and discards, all 3 additions are undone. This is not a "save draft" pattern — it's hard revert.

6. **The three-tab structure is non-negotiable.** Same tab order (TruthPacks / Shared Drives / Documents) in every surface. Same tab labels. Same internal component structure. Consistency is intentional — users learn it once and it works everywhere.
