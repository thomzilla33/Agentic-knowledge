# Knowledge System — Agentic Networks V1

**Type:** Feature  
**Priority:** P0  
**Area:** Agentic Studio → Agentic Networks  
**Prototype:** `agentic-studio.html` ✅

---

## Why we're building this

An Agentic Network that runs without grounded knowledge produces generic or incorrect outputs. It doesn't know your company's policies, your pricing rules, your contracts, or your products — it just guesses.

The Knowledge System solves this. It lets teams attach the right information to a network before it runs, so that every decision the network makes is grounded in your actual company knowledge.

The two sources of knowledge in V1 are:

- **TruthPacks** — curated packages of facts, claims, and documents assembled by your knowledge team in Governance Studio. Think of them as pre-approved knowledge kits for specific use cases.
- **Source Drives** — documents and folders from your company's shared drives. You can add an entire drive, a specific folder, or a single document.

---

## Who manages knowledge

There are two distinct roles:

**Knowledge administrators** (in Governance Studio) — they create and maintain TruthPacks. They decide what facts, claims, and documents go into each pack, and they control what confidence levels are available. Network operators cannot change what's inside a pack.

**Network operators** (in Agentic Studio) — they choose which TruthPacks and drives to attach to their network. They can adjust confidence settings per pack within the limits the administrator set. They cannot edit the content of a pack.

---

## How knowledge is structured

Every piece of knowledge in a TruthPack belongs to one of three planes. The plane determines how confident the network should be when using that knowledge:

| Plane | Confidence | What it contains |
|-------|-----------|-----------------|
| **Truth Plane** | 100% | Verified facts and FAQs. The network treats this as absolute truth. |
| **Sandbox Plane** | ~80% | Unverified claims and drafts. The network treats this as likely true but not guaranteed. |
| **Sources Plane** | ~60% | Raw documents and reference material. The network uses this for deeper lookup and citation. |

When a network operator attaches a TruthPack, they can turn each plane on or off — but only within the boundaries the administrator set. If the administrator disabled a plane, it cannot be turned on from Agentic Studio.

---

## The three knowledge sections

Every Agentic Network has a Knowledge panel with three sections, always in this order:

1. **TruthPacks** — the curated packs attached to this network
2. **Shared Drives** — drives, folders, or documents added from the company catalog
3. **Documents** — the network's own private document space (auto-created per network, not shared)

This structure is the same everywhere the Knowledge panel appears, whether you're viewing, editing, or building.

---

## The three places Knowledge appears

### 1. Overview page — read-only

When a user opens a network's Overview, the Knowledge panel is visible in the right column as a summary of what's configured. It shows everything — TruthPacks, drives, plane states — but **nothing can be changed from here.** It is always labeled "View only."

The only action available is "Edit →", which opens the full edit experience.

This is intentional. The Overview is a monitoring surface, not an editing surface. Users should never accidentally change knowledge configuration while they're reviewing a network's performance.

### 2. Knowledge modal — full edit

This is where all knowledge changes happen. It opens from the "Edit →" button on the Overview, and it gives the user full control:

- Add or remove TruthPacks
- Turn planes on or off per pack
- Add drives, folders, or specific documents
- Upload documents to the network's private space

All changes are held in a pending state and only saved when the user clicks Confirm. If they close without saving, they're prompted to discard or go back.

From this modal, users can also jump directly to Governance Studio to create or manage TruthPacks if they have the right permissions.

### 3. Builder panel — edit while building

When a user is building or editing the network graph, they can access the same Knowledge edit experience directly from the Builder. This is the same functionality as the Knowledge modal, just accessible without leaving the Builder.

Changes made in the Builder panel are tracked independently — confirming or discarding there doesn't affect anything in the main Knowledge modal.

---

## User flows

### Adding a TruthPack

1. User opens the Knowledge modal (via "Edit →" on the Overview)
2. Clicks "Add Knowledge Pack" → a marketplace opens showing all available packs
3. User can filter by category, sort, or search by name
4. User clicks the eye icon on any pack to preview its contents — what facts, claims, and documents are inside — without losing their place in the browse experience
5. User clicks "Add" on the desired pack → it appears in the TruthPacks list with the creator's default plane settings already applied
6. User can expand the pack to adjust which planes are active (Truth / Sandbox / Sources), within the limits the creator set
7. User clicks Confirm → changes are saved

### Removing a TruthPack

1. User opens the Knowledge modal
2. Clicks the remove button (×) on a pack
3. A confirmation prompt appears — "Remove [Pack Name]?"
4. User confirms → pack is removed

No pack can be removed without going through the confirmation step.

### Adding a drive or specific documents

1. User opens the Knowledge modal → goes to the Shared Drives tab
2. Option A — Browse inline: A catalog of available drives appears directly in the panel. The user can expand each drive to see folders and files, check the ones they want, and click "Add Selected."
3. Option B — Open Drive Marketplace: A full-screen browse experience with filters, folder navigation, grid/list views, and the ability to navigate deep into folder structures. The user can add an entire drive, a specific folder, or individual documents.
4. User can also click the eye icon on any drive to preview its contents before adding.
5. Added items appear in the Drives tab list. Each item (drive, folder, or document) shows as a separate entry.

### Adjusting plane settings on a TruthPack

1. User opens the Knowledge modal → TruthPacks tab
2. Clicks on an attached pack to expand it
3. Sees three rows: Truth Plane, Sandbox Plane, Sources Plane
4. Each row shows a toggle switch
   - If the creator enabled the plane: the toggle works — user can turn it on or off
   - If the creator disabled the plane: the toggle is grayed out and labeled "off by creator" — no interaction possible
5. User changes a setting → Confirm/Discard bar appears
6. User clicks Confirm → saved

### Searching within the Knowledge panel

Every tab in both the edit modal and the read-only Overview panel has an inline search. It filters the visible list in real time. Searching never deletes or removes anything — it only narrows what's displayed.

---

## Key behaviors

**The Overview panel is always read-only.** There is no way to add, remove, or toggle anything from the Overview. This is a hard rule, not a permission — even admins cannot edit from this surface. All edits require opening the modal explicitly.

**TruthPacks are all-or-nothing.** You add or remove the whole pack. You cannot cherry-pick individual facts or claims from inside a pack at the network level. The only granularity available is turning planes on or off.

**Plane states are inherited from the creator.** When you add a TruthPack, it comes with the configuration the knowledge administrator set. You can adjust within those limits, but you can never unlock a plane the administrator disabled.

**Discarding is a hard undo.** If a user opens the Knowledge modal, makes changes, and then clicks Discard — everything goes back to exactly what it was when they opened the modal. No partial saves, no "last saved" fallback.

**The private drive is exclusive.** Every network gets its own document space that no other network or agent can access. Documents uploaded here live only on this network.

**Changes in the modal reflect instantly on the Overview.** When a user saves in the Knowledge modal, the Overview panel updates immediately to show the new state — no page refresh needed.

**The three tabs are always in the same order.** TruthPacks → Shared Drives → Documents. This never changes regardless of which surface the user is on. Consistency is intentional — users learn the pattern once.

---

## What's in scope for V1

- Knowledge panel on the Overview (read-only, all three tabs)
- Knowledge modal (full edit, all three tabs)
- Knowledge panel in the Builder (full edit, all three tabs)
- TruthPack Marketplace (browse, filter, search, add/remove)
- TruthPack Preview popup (inspect contents before adding)
- Drive Marketplace (browse, filter, deep folder navigation, granular selection)
- Drive Preview popup (navigate folders, add individual documents)
- Plane on/off controls per TruthPack (within creator limits)
- Remove confirmation dialogs on all removals
- Confirm/Discard flow with pending state
- "Manage in Governance →" shortcut in the edit modal
- Network private drive (shown in Documents tab, read and display)
- Auto-sync between edit modal and Overview panel

---

## What's not in scope for V1

| Feature | Why deferred |
|---------|-------------|
| Document upload to private drive | Requires file handling infrastructure — UI is present but inactive in V1 |
| Per-node knowledge (individual nodes having their own knowledge) | Same component, just mounted differently — V1.5 |
| RAG node (a node that queries knowledge as a step in the workflow) | Depends on per-node knowledge — V1.5 |
| TruthPack auto-assignment rules | Logic lives in Governance Studio — V1.5 |
| AI Summarize for drive folders | Backend not ready — V1.5 |
| Knowledge on Contacts and Campaigns | V2 — same component, different context |

---

## What success looks like

A user can open any Agentic Network, see exactly what knowledge it has access to and at what confidence level, add or remove TruthPacks and drives, adjust plane settings, and save — all without leaving Agentic Studio. The experience is fast, clear, and impossible to accidentally edit from the wrong surface.

The knowledge configuration the user sets here directly determines what information the network can access when it runs. This is the connective tissue between the knowledge your team maintains in Governance Studio and the automated processes that use it.

---

## Reference files

- Full behavioral spec (technical): `KNOWLEDGE_SYSTEM_V1.md`
- Engineering ticket (technical): `TICKET_KNOWLEDGE_SYSTEM_V1.md`
- Full prototype spec: `FEATURE_REVIEW.md`
- Interactive prototype: `agentic-studio.html`
