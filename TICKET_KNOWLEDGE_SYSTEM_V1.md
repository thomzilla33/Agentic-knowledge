# [TICKET] Knowledge System — Agentic Networks V1

**Type:** Feature  
**Priority:** P0  
**Product Area:** Agentic Studio → Agentic Networks  
**Design spec:** `KNOWLEDGE_SYSTEM_V1.md`  
**Prototype:** `agentic-studio.html` (E2E tested, 29/29 ✅)  
**Estimated scope:** L (multiple surfaces, shared component system)

---

## Overview

Implement the **Knowledge System** for Agentic Networks in Agentic Studio V1.

The Knowledge System is the mechanism through which an Agentic Network accesses structured context when executing — it defines what the network knows, how confident it is, and which data sources it can reference. It consists of three surfaces (Global KN Modal, Overview panel, Builder modal), two marketplace modals (TruthPack and Drive), two preview popups, and a shared component architecture that must render consistently across all entry points.

The full behavioral and data spec is in `KNOWLEDGE_SYSTEM_V1.md`. This ticket is the implementation plan.

---

## Background & Motivation

Agents and Agentic Networks without grounded knowledge produce generic, hallucinated, or confidently wrong outputs. The Knowledge System solves this by letting teams attach curated TruthPacks and Source Drives to any network before it runs — giving it access to verified company facts, policies, documents, and claims.

The system is designed to be:
- **Universal** — same structure for Agents, Agentic Networks, Workers. Build it once, reuse everywhere.
- **Permission-layered** — pack creators (in Governance Studio) define what planes are available; network operators choose which planes to activate.
- **Read-only at a glance, editable on demand** — the Overview dashboard shows the configuration without allowing accidental changes.

---

## Scope — What Gets Built

### Sub-task 1 — Data Model & API Integration

**Backend contract to implement against:**

```typescript
// GET /networks/:id → includes:
network.knowledge: NetworkKnowledge[]

interface NetworkKnowledge {
  id: string;
  name: string;
  docs: number;
  facts: number;
  claims: number;
  planes: {
    truth:   'on' | 'off' | 'disabled';
    sandbox: 'on' | 'off' | 'disabled';
    sources: 'on' | 'off' | 'disabled';
  };
}

// PUT /networks/:id/knowledge
// Body: { knowledge: NetworkKnowledge[], drives: DriveAddedItem[] }

interface DriveAddedItem {
  id: string;
  type: 'drive' | 'folder' | 'doc';
  name: string;
  driveKey: string;
  driveName: string;
  sub: string;
}

// GET /truthpacks → catalog list
// GET /truthpacks/:id → detail with facts, claims, docs
// GET /drives → catalog list
// GET /drives/:id/tree → folder/file tree
```

**Acceptance criteria:**
- [ ] Network detail response includes `knowledge[]` array
- [ ] `PUT /networks/:id/knowledge` persists TruthPack list + drive items + plane states
- [ ] Private drive is auto-created for every new network (unique ID = network ID)
- [ ] TruthPack catalog endpoint returns `planes.{plane}.enabled` and `planes.{plane}.on` (creator config)

---

### Sub-task 2 — Shared `<KnowledgePanel>` Component

**This is the architectural core.** Build one component used across all three surfaces.

```tsx
<KnowledgePanel
  networkId={string}
  context={'global' | 'builder' | 'overview'}
  readOnly={boolean}
  onSave={(knowledge, drives) => void}
  onDiscard={() => void}
/>
```

**Three tabs (always in this order, always these labels):**
1. TruthPacks
2. Shared Drives
3. Documents

**Acceptance criteria:**
- [ ] Component renders correctly in all three contexts (see Sub-tasks 3, 4, 5)
- [ ] `readOnly={true}` removes all Add, Remove, Upload buttons and converts plane toggles to static display chips
- [ ] `readOnly={false}` shows full edit controls
- [ ] Tab order is always: TruthPacks → Shared Drives → Documents
- [ ] Active tab resets to TruthPacks every time the panel is opened for a new network

---

### Sub-task 3 — Global KN Modal (Edit Surface)

**Trigger:** "Edit →" button in the Overview Knowledge Panel → opens modal  
**Context:** `global`, `readOnly={false}`

**TruthPacks tab:**
- [ ] Accordion list of attached TruthPacks
- [ ] Each accordion row: pack name, subtitle (N facts · N claims · N docs), plane chips collapsed, plane rows expanded
- [ ] Plane rows: Truth / Sandbox / Sources — each with toggle switch, icon, description, confidence level
  - `on` → toggle checked, colored icon
  - `off` → toggle unchecked
  - `disabled` → toggle not rendered / `<input disabled>` + "off by creator" label
- [ ] Remove button (×) on each row → shows confirm dialog before removing
- [ ] Inline search — filters the accordion list live
- [ ] Empty state: "No Knowledge Packs added yet. Click Add Knowledge Pack to browse the library."
- [ ] "Add Knowledge Pack" button → opens TruthPack Marketplace (Sub-task 6)
- [ ] "N packs added" label updates dynamically

**Shared Drives tab:**
- [ ] Accordion list of added drives/folders/documents
  - Drive rows: expand to show top 4 folder/file contents preview + "Browse contents →" button → opens Drive Preview popup
  - Folder rows: show parent drive name in subtitle
  - Document rows: show parent drive name in subtitle
  - Remove button per item → confirm dialog
- [ ] Inline catalog zone: expandable drive tree (Drive → Folder → File) with checkboxes
  - Check items → staged preview bar appears: "N items selected · Add Selected"
  - `drvAddStaged()` commits staged items to the Added zone
- [ ] Inline search filters both Added and Catalog zones
- [ ] "Add Drive" button → opens Drive Marketplace (Sub-task 7)

**Documents tab:**
- [ ] Drive name: "Private drive — [Network Name]"
- [ ] File list for this network's private drive
- [ ] Upload button (V1: shows "Coming soon" toast; do not implement upload in V1)

**Confirm / Discard bar:**
- [ ] Hidden on open
- [ ] Appears as soon as any change is made (add/remove pack, toggle plane, add/remove drive)
- [ ] **Confirm** → saves to API (`PUT /networks/:id/knowledge`) → hides bar → syncs Overview panel
- [ ] **Discard** → reverts all changes since modal was opened → hides bar
- [ ] "Manage in Governance →" button always visible in header → redirects to Governance Studio

**Acceptance criteria:**
- [ ] All items above checked
- [ ] Backdrop click closes modal (if no unsaved changes) or shows discard confirmation (if changes exist)
- [ ] After save, the Overview panel reflects the new state without page reload

---

### Sub-task 4 — Overview Knowledge Panel (Read-Only Surface)

**Location:** Right column of the Overview dashboard, sticky, spans full height  
**Context:** `overview`, `readOnly={true}`

**Header:**
- [ ] "Knowledge" title
- [ ] "👁 View only" badge — always visible, cannot be conditionally hidden
- [ ] "Edit →" button → opens Global KN Modal

**TruthPacks tab:**
- [ ] Same accordion rows as edit modal — plane rows render static `<span>` chips instead of toggles
  - `on` → blue filled chip "On"
  - `off` → gray chip "Off"
  - `disabled` → muted chip "Off" + "off by creator" tag
- [ ] No remove button
- [ ] Inline search — live filter (does not modify data, only filters the visible list)
- [ ] "N packs" label in footer
- [ ] "Edit in Knowledge" button in footer → opens Global KN Modal

**Shared Drives tab:**
- [ ] Same accordion rows — no remove button, no catalog zone, no add button
- [ ] "Browse contents →" still present on drive rows → opens Drive Preview popup (informational)
- [ ] "Edit in Knowledge" button in footer

**Documents tab:**
- [ ] Private drive file list — read-only
- [ ] Drive name: "Private Drive — [Network Name]"
- [ ] No upload button

**Acceptance criteria:**
- [ ] Zero interactive edit controls present in this panel at any point
- [ ] Panel state updates automatically when the KN Modal saves (shared state, no polling)
- [ ] Inline search works without modifying the underlying data
- [ ] Tab resets to TruthPacks when navigating to a different network's Overview

---

### Sub-task 5 — Builder Knowledge Modal

**Trigger:** "Knowledge →" button in the Node Inspector → opens modal  
**Context:** `builder`, `readOnly={false}`  
**Structurally identical to the Global KN Modal**, with one key difference:

- State is **isolated** from the Global KN Modal — changes here do not affect the global knowledge config and vice versa
- In V1: operates on the network-level knowledge (same data) — node-level scoping is V1.5
- Confirm/Discard tracks changes independently from the Global modal

**Acceptance criteria:**
- [ ] All acceptance criteria from Sub-task 3 apply
- [ ] Adding/removing a pack in the Builder modal does NOT trigger the Global modal's dirty state
- [ ] Discarding in one modal does NOT affect the other modal's pending changes

---

### Sub-task 6 — TruthPack Marketplace

**Trigger:** "Add Knowledge Pack" button → `openTpMarketplace(ctx)`  
**Layout:** Full-screen overlay, 2-column (filter sidebar + content grid)

**Filter sidebar:**
- [ ] Show: All / Added / Not Added (radio)
- [ ] Sort: A–Z / Most Used / Newest (radio)
- [ ] Category multi-select toggle buttons (from catalog API)
- [ ] Plane filter: Truth / Sandbox / Sources (multi-select)
- [ ] Active filter chips — each dismissible
- [ ] "Clear All" resets all filters

**Content grid:**
- [ ] Card per TruthPack: name, category badge, plane dots, facts/claims/docs counts, description (2 lines)
- [ ] **Eye button** → opens TruthPack Preview Popup (Sub-task 8) without closing the marketplace
- [ ] **Add / Remove button** per card — updates immediately, "✓ Added" state when added
- [ ] Live search (fuzzy match on name + description)

**Detail view:**
- [ ] Breadcrumb: "TruthPacks >" + pack name
- [ ] Full description, planes section (read-only display), expandable Facts / Claims / Documents sections
- [ ] Search within detail sections
- [ ] Add / Remove button

**Save / Cancel:**
- [ ] Changes staged until "Save" confirmed
- [ ] Cancel with unsaved changes → discard confirmation dialog
- [ ] On save → added packs appear in the KN Modal's added zone immediately

**Acceptance criteria:**
- [ ] All filter combinations work correctly
- [ ] A pack that is already added shows "✓ Added" on open
- [ ] Pack added via marketplace appears in the accordion list with correct plane defaults (inherited from creator config)
- [ ] Plane defaults are set from `pack.planes.{plane}.enabled` and `pack.planes.{plane}.on` — not hardcoded

---

### Sub-task 7 — Drive Marketplace

**Trigger:** "Add Drive" button → `openDriveMarketplace(ctx)`  
**Layout:** Full-screen overlay, 2-column (filter sidebar + content area)

**Filter sidebar:**
- [ ] Same filter pattern as TruthPack Marketplace (Show / Sort / Category / chips / Clear All)

**Drive grid:**
- [ ] Card per drive: name, category badge, owner, item count, description
- [ ] **Eye button** → opens Drive Preview Popup (Sub-task 9)
- [ ] **"+ Add Drive" button** → adds entire drive to context

**Detail view (folder navigation):**
- [ ] Breadcrumb — supports multi-level folder navigation
- [ ] Grid / List view toggle
- [ ] File type filter tabs: All / Documents / Spreadsheets / PDFs / Images
- [ ] Checkbox selection per file/folder — `drvToggleItem()` / `drvToggleAll()`
- [ ] Clicking a folder navigates into it (breadcrumb updates)
- [ ] **"Add Selected" button** → adds checked items (drives, folders, or individual documents)
- [ ] **AI Summarize button** → V1: toast stub "Generating summary..."; V1.5: real AI call

**Save / Cancel:**
- [ ] Same discard pattern as TruthPack Marketplace

**Acceptance criteria:**
- [ ] User can add an entire drive, a specific folder, or an individual document
- [ ] Each added item appears as a separate row in the Drives tab with correct type icon and parent drive label
- [ ] Navigating folders does not lose the selection state of items in other folders

---

### Sub-task 8 — TruthPack Preview Popup

**Trigger:** Eye icon on any TruthPack card (marketplace or catalog row)  
**Position:** Floats over marketplace, `z-index` above marketplace modal

- [ ] Pack name + category badge
- [ ] Description
- [ ] Planes — read-only display (same chip style as Overview panel)
- [ ] Collapsible sections: Facts / Claims / Documents — each shows full list from `GET /truthpacks/:id`
- [ ] Auto-assignment rules section (read-only, if configured)
- [ ] Add / Remove button (reflects current state, functional)
- [ ] Close button — closes popup only, marketplace stays open

**Acceptance criteria:**
- [ ] Opening the preview does not close or blur the marketplace
- [ ] Add/remove action in preview is reflected immediately in the marketplace grid card state
- [ ] Works from both marketplace grid view and detail view

---

### Sub-task 9 — Drive Preview Popup

**Trigger:** Eye icon on any drive card  
**Position:** Floats over marketplace

- [ ] Drive name + description
- [ ] **Root view:** folder grid — icon, name, item count chip
- [ ] Clicking folder → navigates into it (breadcrumb appears)
- [ ] **Folder view:** document list — type icon, name, size
  - Per-file "Add" button → adds individual document to context → button flips to "✓ Added"
  - "Add All" button → adds all documents in current view
- [ ] Back to root via breadcrumb

**Acceptance criteria:**
- [ ] Navigation state is independent from the marketplace navigation state
- [ ] Items added via popup appear immediately in the Drives accordion list
- [ ] "✓ Added" state persists if user navigates away and back to the same folder

---

### Sub-task 10 — Remove Confirmation Dialog

Shared across all removal flows in the Knowledge System.

- [ ] Triggered by any remove button (TruthPack row, drive/folder/doc row)
- [ ] Shows: "Remove [item name]?" + item type label
- [ ] Confirm → executes removal, marks modal as changed
- [ ] Cancel → dismisses dialog, no action

**Acceptance criteria:**
- [ ] No item can be removed without going through this dialog
- [ ] Dialog is inline (not a separate modal) — renders inside the Knowledge panel

---

## Acceptance Criteria — System Level

These must pass before the feature is considered done:

- [ ] **Read-only enforcement:** Zero add/remove/upload/toggle controls are accessible from the Overview Knowledge Panel. The `readOnly` prop must be tested explicitly.
- [ ] **TruthPacks are atomic:** There is no UI path that allows selecting individual facts, claims, or documents within a TruthPack from the network level. Only the whole pack can be added or removed.
- [ ] **Plane `disabled` state is unbreakable:** A plane marked `disabled` by the creator cannot be turned on by any user interaction, including direct API calls. The API must validate and reject attempts to set a `disabled` plane to `on` or `off`.
- [ ] **Context isolation:** Changes in the Builder Knowledge Modal do not affect the Global KN Modal's pending state, and vice versa. Confirmed separately.
- [ ] **Auto-sync:** Saving in the Global KN Modal updates the Overview panel without page reload.
- [ ] **Consistent tab structure:** All three knowledge surfaces show the tabs in the same order (TruthPacks / Shared Drives / Documents) with the same labels.
- [ ] **Tab reset:** The Overview panel resets to the TruthPacks tab every time a different network is opened.
- [ ] **Discard is hard revert:** Discarding changes in a modal brings the state back exactly to what it was when the modal was opened — not a "last saved" state.
- [ ] **Change tracking is binary:** The Confirm/Discard bar appears only when at least one change has been made. It disappears after either confirming or discarding.
- [ ] **"Manage in Governance" is always present** in the edit modal header, regardless of user permissions. The redirect behavior (or disabled state for users without governance access) is handled by the Governance Studio team.

---

## Out of Scope (V1)

| Feature | Target |
|---------|--------|
| Node-level knowledge (per-node index in Builder) | V1.5 |
| RAG-type node | V1.5 |
| TruthPack auto-assignment rules (dynamic population) | V1.5 |
| Real document upload to private drive | V1.5 |
| AI Summarize for drive folders (functional) | V1.5 |
| Contacts / Campaigns Knowledge panel | V2 |

---

## Dependencies

| Dependency | Team | Blocking? |
|------------|------|-----------|
| `GET /truthpacks` catalog endpoint | Governance Studio BE | Yes — Sub-tasks 6, 8 |
| `GET /truthpacks/:id` detail endpoint | Governance Studio BE | Yes — Sub-task 8 |
| `GET /drives` + `GET /drives/:id/tree` | Drive/Storage BE | Yes — Sub-tasks 7, 9 |
| `GET /networks/:id` includes `knowledge[]` | Agentic Studio BE | Yes — Sub-task 3, 4 |
| `PUT /networks/:id/knowledge` | Agentic Studio BE | Yes — Sub-task 3 |
| Private drive auto-creation on network create | Agentic Studio BE | Yes — Sub-tasks 3, 4 |
| Governance Studio URL for "Manage in Governance" redirect | Governance Studio FE | No — can stub with toast |
| Plane-based retrieval filtering | RAG / Inference team | No — FE can ship independently |

---

## Sub-task Breakdown for Sprint Planning

| Sub-task | Complexity | Depends on |
|----------|-----------|-----------|
| ST-1: Data Model & API integration | M | Backend team |
| ST-2: Shared `<KnowledgePanel>` component shell + tab structure | M | ST-1 |
| ST-3: Global KN Modal (edit) | L | ST-2 |
| ST-4: Overview Knowledge Panel (read-only) | M | ST-2, ST-3 |
| ST-5: Builder Knowledge Modal | S | ST-3 (reuse) |
| ST-6: TruthPack Marketplace | L | ST-1 |
| ST-7: Drive Marketplace | L | ST-1 |
| ST-8: TruthPack Preview Popup | M | ST-6 |
| ST-9: Drive Preview Popup | M | ST-7 |
| ST-10: Remove Confirmation Dialog | S | ST-2 |

**Recommended build order:** ST-1 → ST-2 → ST-10 → ST-3 → ST-4 → ST-5 → ST-8 → ST-6 → ST-9 → ST-7

---

## Reference

- Full behavioral spec: `KNOWLEDGE_SYSTEM_V1.md`
- Full prototype spec (all views): `FEATURE_REVIEW.md`
- Interactive prototype: `agentic-studio.html`
- E2E tests: `/tmp/aims-e2e/tests/overview.spec.ts` (29 tests, all passing)
