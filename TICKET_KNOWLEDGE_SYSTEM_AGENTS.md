# Knowledge System — Agents V1

**Type:** Feature  
**Priority:** P0  
**Area:** Agentic Studio → Agents  
**Reference:** Knowledge System for Agentic Networks (same structure, new surface)  
**Status:** Design proposal — new surface to be designed

---

## Context for the designer

The Knowledge System already exists and is fully defined for Agentic Networks. The structure, the rules, and the mental model are identical for Agents — same three sections, same TruthPack planes, same confidence logic.

What needs to be designed is **where and how this system appears inside the Agent experience** — which surfaces show it, which are editable, which are read-only, and how a user flows through it when configuring an Agent.

This document gives you everything you need to design those surfaces from scratch.

---

## Why Agents need the same Knowledge System

An Agent without grounded knowledge operates on generic training data. It doesn't know your company's products, policies, pricing, contracts, or procedures — it invents answers that sound plausible.

Attaching knowledge to an Agent means it can answer questions, make decisions, and take actions based on your actual company information — not guesses.

The exact same knowledge that can be attached to an Agentic Network can be attached to an Agent. They share the same catalog, the same TruthPacks, and the same drives. The difference is the surface they live in.

---

## The Knowledge structure — identical to Agentic Networks

Every Agent has a Knowledge section with three sub-sections, always in this order:

### 1. TruthPacks
Curated knowledge packages assembled by your knowledge team in Governance Studio. Each pack contains facts, claims, and documents grouped around a specific topic or use case (e.g. "Finance Playbook 2024", "HR Policies 2026", "Sales GTM Playbook").

When you attach a TruthPack to an Agent, you inherit the configuration the pack creator set. You can adjust which planes are active — but only within the limits the creator defined.

### 2. Shared Drives
Documents and folders from your company's shared drives. You can attach an entire drive, a specific folder inside it, or individual documents. Anything added here is accessible to the Agent when it needs to reference or retrieve information.

### 3. Own Documents (Private Drive)
Every Agent gets its own private document space, automatically created when the Agent is created. Documents uploaded here belong exclusively to this Agent — no other Agent, Network, or Worker can access them. This is the place for Agent-specific materials: custom instructions, private reference files, agent-specific templates.

---

## The TruthPack plane system — confidence levels

Every TruthPack organizes its knowledge into three planes. The plane determines how the Agent treats that information when it uses it:

| Plane | Confidence | What it means in practice |
|-------|-----------|--------------------------|
| **Truth Plane** | 100% | The Agent treats this as absolute fact. Used for definitive answers and grounded decisions. |
| **Sandbox Plane** | ~80% | The Agent treats this as likely true. Used for exploratory responses or when dealing with evolving information. |
| **Sources Plane** | ~60% | The Agent uses this as reference material. Used for citations, background context, and deep lookups. |

### The rules of the plane system

**The pack creator decides what planes exist.** In Governance Studio, when someone builds a TruthPack, they choose which planes are active and what the defaults are. An Agent operator cannot change this — they can only work within what the creator enabled.

**Three possible states per plane:**

- **On** — this plane is active for this Agent. The Agent can use it.
- **Off** — this plane exists in the pack but is currently disabled on this Agent. The operator chose to turn it off.
- **Disabled by creator** — this plane was never enabled by the pack creator. No one in Agentic Studio can turn it on. It appears grayed out and labeled "off by creator."

**What the operator can do:**
- Turn `on` → `off` for any plane the creator enabled
- Turn `off` → `on` for any plane the creator enabled
- Nothing with `disabled` planes

**Why this matters for design:**
The plane toggle UI needs three distinct visual states — not just on/off. The disabled state must be clearly non-interactive and self-explanatory.

---

## The two roles

**Knowledge administrators** — they work in Governance Studio. They create TruthPacks, define what's inside them, and set which planes are available and what the defaults are. Agent operators cannot override their decisions.

**Agent operators** — they work in Agentic Studio. They choose which TruthPacks to attach to an Agent, decide which planes to activate (within the creator's limits), add drives and documents, and manage the Agent's private document space.

---

## Where Knowledge appears in the Agent experience

This is where the design work needs to happen. Based on the Agentic Networks pattern, the Knowledge System should appear in at least two places inside the Agent experience:

---

### Surface A — Agent detail / overview page (read-only)

When a user opens an Agent to review or monitor it, the Knowledge configuration should be visible as a summary — but **nothing should be editable from this surface.**

This surface exists so users can quickly understand what an Agent knows without being able to accidentally change it while reviewing its performance or history.

**What it should show:**
- The three tabs: TruthPacks / Shared Drives / Documents
- All attached TruthPacks with their current plane states (on/off/disabled) shown as static labels, not interactive controls
- All attached drives, folders, and documents
- The private drive name: "Private Drive — [Agent Name]"
- A clear visual signal that this view is read-only (equivalent to the "View only" badge in the Agentic Networks design)
- A single action: "Edit →" that takes the user to the edit surface

**What it should NOT show:**
- Add buttons
- Remove buttons
- Upload buttons
- Plane toggles

---

### Surface B — Agent editor / configuration (editable)

When a user is creating or editing an Agent, Knowledge should be a fully editable section — either as a tab in the Agent configuration view, or as a panel/modal accessible from it.

This is the surface where all knowledge changes happen.

**What it should allow:**

**TruthPacks tab:**
- See all currently attached TruthPacks
- Expand each pack to see its planes and toggle them on/off
- Search the attached list
- Add a new TruthPack (opens the TruthPack Marketplace)
- Remove an attached TruthPack (with a confirmation step)
- Jump to Governance Studio to create or manage packs ("Manage in Governance →")

**Shared Drives tab:**
- See all attached drives, folders, and documents
- Browse available drives inline and check items to add
- Open the Drive Marketplace for a full browsing experience
- Remove attached items (with confirmation)

**Documents tab:**
- See and manage the Agent's private document space
- Upload documents (V1: this may be stubbed — see scope section)

**All changes must be held in a pending state** and only saved when the user explicitly confirms. If they close or navigate away without saving, they should be asked whether to save or discard.

---

## Key behaviors — same rules as Agentic Networks

These apply identically to Agents:

**Read-only surfaces are always read-only.** There is no scenario in which Add/Remove/Toggle controls appear on the Agent detail/overview page. This is a hard rule, not a permission setting.

**TruthPacks are all-or-nothing.** You attach or detach the whole pack. You cannot select specific facts, claims, or documents from inside a pack. The only granularity is planes.

**Disabled planes cannot be enabled.** If the pack creator disabled a plane, it cannot be turned on from Agentic Studio, regardless of the user's role.

**Discard is a hard undo.** If a user makes changes and then discards, the state returns exactly to what it was when they opened the editor. No partial saves.

**Every Agent has its own private drive.** Created automatically when the Agent is created. Not shared with any other entity in the system.

**The three tabs are always in the same order.** TruthPacks → Shared Drives → Documents. This is the same across all entities in the system — Agents, Networks, Workers. Users learn it once and it works everywhere.

---

## User flows to design for

### Attaching a TruthPack to an Agent

1. User opens the Agent editor / configuration
2. Goes to the Knowledge section → TruthPacks tab
3. Clicks "Add Knowledge Pack" → TruthPack Marketplace opens
4. User browses by category, searches by name, or uses filters
5. User can click the eye icon on any pack to preview its contents (facts, claims, documents) before adding — without losing their browse position
6. User clicks "Add" → pack appears in the attached list with the creator's default plane settings
7. User can expand the pack to adjust planes within the creator's limits
8. User saves the Agent configuration

### Browsing what an Agent knows (without editing)

1. User opens the Agent detail page
2. Knowledge section is visible with the "View only" indicator
3. User can browse all three tabs and search within them
4. User can expand TruthPack rows to see which planes are active
5. User can expand drive rows to see what's connected
6. No changes possible — "Edit →" button takes them to the editor if they need to make changes

### Adding specific documents from a drive

1. User is in the Agent editor → Shared Drives tab
2. User can browse drives inline (catalog tree) or open the full Drive Marketplace
3. In the marketplace, user can navigate into specific folders, select individual files, and add only what the Agent needs
4. Added items appear as individual entries in the Shared Drives list

### Removing a TruthPack

1. User opens the Agent editor → TruthPacks tab
2. Clicks remove (×) on an attached pack
3. Confirmation prompt: "Remove [Pack Name]?"
4. Confirms → pack removed, Confirm/Discard bar appears
5. Saves or discards the change

---

## The TruthPack Marketplace — what the designer needs to know

This is the browsing experience that opens when the user clicks "Add Knowledge Pack." It needs to support:

- **Browsing** — a grid of available packs with name, category badge, plane availability indicators, and content counts (N facts · N claims · N docs)
- **Filtering** — by category, by plane availability, by whether the pack is already added or not
- **Sorting** — A–Z, most used, newest
- **Searching** — live text filter on name and description
- **Previewing** — an eye icon on each card opens a preview popup showing the full contents of that pack (facts listed, claims listed, documents listed) without closing the marketplace
- **Adding** — a button per card, updates to "✓ Added" once clicked

The marketplace also has a detail view for each pack — clicking the card (not the eye or add button) opens the full pack detail: description, plane configuration, complete lists of facts, claims, and documents.

---

## The Drive Marketplace — what the designer needs to know

This opens when the user clicks "Add Drive." It needs to support:

- **Browsing** — a grid of available drives with name, owner, item count, and description
- **Filtering and sorting** — same pattern as TruthPack Marketplace
- **Previewing** — eye icon per drive opens a preview where the user can navigate into folders and see what's inside before committing
- **Granular selection** — inside the detail view, users can navigate folder hierarchies and select individual files, specific folders, or entire drives
- **Adding at any level** — add the whole drive, a folder, or a single document. Each becomes a separate entry in the Shared Drives list.

---

## What's in scope for V1

- Knowledge section on the Agent detail/overview page (read-only, all three tabs)
- Knowledge section in the Agent editor (fully editable, all three tabs)
- TruthPack Marketplace (browse, filter, search, add/remove, preview popup)
- Drive Marketplace (browse, filter, folder navigation, granular selection, preview popup)
- Plane on/off controls per TruthPack (within creator limits)
- Private drive shown in Documents tab
- Confirm/Discard flow with pending state
- Remove confirmation on all removals
- "Manage in Governance →" shortcut
- Auto-sync between editor and detail page when saved

---

## What's not in scope for V1

| Feature | Why deferred |
|---------|-------------|
| Document upload to private drive | Requires file infrastructure — UI can show the section but upload is inactive |
| Auto-assignment rules for TruthPacks | Set in Governance Studio, not Agentic Studio — V1.5 |
| AI Summarize for drive folders | Backend not ready — V1.5 |
| Node-level knowledge within an Agent's internal workflow | V1.5 |

---

## Design decisions that need to be made

These are open questions the designer should resolve before development starts:

1. **Where does Knowledge live in the Agent editor?** As a dedicated tab alongside other Agent settings (e.g. Instructions, Tools, Knowledge, Settings)? Or as a side panel that slides in? The Agentic Networks prototype uses a modal — for Agents, a tab may feel more natural since the Agent editor is already a multi-section experience.

2. **How prominent is the Knowledge section on the Agent detail page?** In Agentic Networks, it's a full right-column widget. For Agents, it may be a collapsible section or a tab depending on how many other things are shown on that page.

3. **What does the empty state look like?** When an Agent has no TruthPacks and no drives attached — what does the user see? It needs to clearly communicate that knowledge is optional but beneficial, with a direct path to add something.

4. **How do you communicate confidence levels to non-technical users?** The planes (Truth / Sandbox / Sources) carry a confidence percentage — this should be explained clearly in the UI for users who aren't familiar with the concept. Tooltips, inline descriptions, or an onboarding moment.

---

## Relationship to Agentic Networks

The Knowledge System is the same product feature across all entities in AIMS-OS. The component should be built once and adapted to each surface — not rebuilt from scratch.

| What's the same | What changes |
|-----------------|--------------|
| Three sub-sections (TruthPacks / Shared Drives / Documents) | Where the panel appears in the UI |
| TruthPack plane system (on/off/disabled) | The container (tab vs modal vs panel) |
| Read-only vs edit distinction | The entity name in the private drive label |
| TruthPack Marketplace | How it connects to the rest of the entity's configuration |
| Drive Marketplace | — |
| Confirm/Discard flow | — |
| Remove confirmation | — |

This means the design for Agents should feel immediately familiar to anyone who has already used the Knowledge System in Agentic Networks — same mental model, same interaction patterns, adapted to the Agent context.

---

## Reference files

- Product ticket for Agentic Networks (same system, completed): `TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`
- Full behavioral spec: `KNOWLEDGE_SYSTEM_V1.md`
- Interactive prototype (Agentic Networks implementation): `agentic-studio.html`
