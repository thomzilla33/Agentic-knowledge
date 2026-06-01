# Admin Studio · Integrations Marketplace — Filter Spec

> Handoff document for Michael / engineering. Final list of filters that ship in the Marketplace catalog and the contract each one expects from the backend.
>
> Per Edgardo's feedback (1:52): *"cuando ya vaya a entregar, ya se tenga muy claro qué filtros va a usar — que los filtros que aparezcan sean filtros necesarios y son posibles."*
>
> Status: ✅ Spec finalized · Prototype ready in `settings.html#/integrations`

---

## Where filters live

The Marketplace home (`#/integrations`) uses a single **Filters Slideout** triggered by the **All filters** button on the catalog toolbar. The slideout follows the Figma DS pattern at [node 14341-62310](https://www.figma.com/design/v6rmYKA2zmyXWOahlxLOeI/Design-System---AIMS-OS?node-id=14341-62310).

| Where | Component | Purpose |
| --- | --- | --- |
| `#catalogToolbar` | Compact inline bar | Search + Sort + Active filter chips + **All filters** trigger |
| `#fsPanel` | Right slideout (440 px) | All filter groups, draft-then-apply semantics |

**Behavior:**
- Opening the slideout snapshots current filter state into a draft.
- Toggling options mutates only the draft.
- **Apply filters** commits the draft to live state and re-renders the catalog.
- **Cancel** / ESC / overlay click discards the draft.
- **Clear all** in the footer resets the draft to empty.
- Each active filter renders as a removable chip in the inline toolbar above the catalog grid.

---

## Filter groups (5)

### 1. Category · multi-select
Selectable list of high-level integration categories.

| Key | Label |
| --- | --- |
| `communication` | Communication |
| `productivity` | Productivity & Docs |
| `crm` | CRM & Sales |
| `ticketing` | Ticketing & ITSM |
| `data` | Data & Analytics |
| `storage` | Storage |
| `dev` | Dev & Code |
| `hr` | HR & People |
| `finance` | Finance & ERP |
| `security` | Security & Observability |
| `custom` | Custom / Build your own |

**Source:** `CATEGORIES` constant. Single `category` field per integration. **Backend contract:** filter integrations whose `category` is in the selected set.

### 2. Capability · multi-select
Filters integrations by which capability TYPES they expose. Aligned with the engineering brief §3 taxonomy (Tool / Data Sync / MCP).

| Key | Label | Description |
| --- | --- | --- |
| `tool` | Tool | Synchronous actions agents can invoke. |
| `data_sync` | Data Sync | Continuous events fed into Helix Data Studio for mapping & ingestion. |
| `mcp` | MCP | Model Context Protocol bundle — granular per-tool activation. |

**Source:** `CAP_TYPES` constant. **Backend contract:** filter integrations where `i.capabilities` contains any selected type. Note: integrations may declare multiple types.

### 3. Connection state · multi-select
Filters by whether the integration has at least one instance connected today.

| Key | Label | Logic |
| --- | --- | --- |
| `connected` | Connected | `instancesOf(slug).length > 0` |
| `not_connected` | Not connected | `instancesOf(slug).length === 0` |

**Backend contract:** join against per-tenant instances; filter on instance count.

### 4. Used in studio · single-select
Filters integrations that are exposed in the selected downstream studio.

| Key | Label | Color |
| --- | --- | --- |
| `governance` | Governance | `#05DF72` |
| `agentic` | Agentic | `#A78BFA` |
| `workforce` | Workforce | `#2B7FFF` |

**Source:** `STUDIO_META`. **Backend contract:** filter by `i.studios[selected] === true`. Per Edgardo, studio scoping is now per-instance — provider-level `studios` is a derived rollup ("at least one instance enabled in this studio").

### 5. Source · single-select
Filters by who maintains the integration.

| Key | Label | Description |
| --- | --- | --- |
| `official` | Official | Built & maintained by AIMS |
| `partner` | Partner | Third-party verified |
| `private` | Private | Built by your workspace team |

**Source:** `i.source` field. **Backend contract:** equality match.

---

## Inline toolbar controls (stay in the header, not in slideout)

These are not in the slideout because they should always be visible (high-frequency):

### Search · free text
Searches `i.name`, `i.vendor`, `i.desc`. Case-insensitive. Debounced 200ms on the backend; client-side filter on the prototype.

### Sort · single-select
Header segmented control. Default: **Popular**.

| Key | Label | Logic |
| --- | --- | --- |
| `popular` | Popular | Stable order from server (currently catalog file order) |
| `alphabetical` | A–Z | Lexicographic on `i.name` |
| `recent` | Recent | Newest connected first; never-connected at the end |

**Backend contract:** server-side sort accepted as a query param. Client falls back to in-memory sort on the loaded catalog.

---

## Active filter chips

When any filter is active, the inline toolbar renders a row of chips ABOVE the catalog grid:

- Each chip shows the active value (e.g. "Slack", "Connected", "Studio: Governance").
- Chip has an X to remove that single filter inline (no need to open slideout).
- "Clear all" link appears with a counter (e.g. "Clear all 4").
- The All filters trigger shows `+N` badge with active count.

---

## What is NOT a filter

These were proposed but explicitly NOT shipped:

| Idea | Why not |
| --- | --- |
| Filter by auth method (OAuth, API key, …) | Low signal — admins rarely care which auth method an integration uses when browsing. Available on the integration detail page. |
| Filter by vendor (e.g. "Google", "Microsoft") | Categories already group these well enough. Vendor logo is visible on every card. |
| Filter by capability count | Noise — total count of capabilities isn't a useful purchasing decision. |
| Filter by date connected | Sort by Recent already covers this need. |

---

## Visual reference

```
┌── Catalog toolbar (inline) ──────────────────────────────────────┐
│  Browse all  (43)   [search...]   Popular | A-Z | Recent | All filters [+3] │
│  Slack ✕   Connected ✕   Governance ✕   Clear all 3              │
└───────────────────────────────────────────────────────────────────┘
                                                          
                              ┌── Filters slideout ──────────────┐
                              │  Filters · 3 active        ✕    │
                              │ ─────────────────────────────── │
                              │  CATEGORY   3                   │
                              │  ☐ Communication                │
                              │  ☑ Productivity & Docs          │
                              │  ☐ CRM & Sales                  │
                              │  …                              │
                              │ ─────────────────────────────── │
                              │  CAPABILITY    1                │
                              │  ☑ Tool                         │
                              │  ☐ Data Sync                    │
                              │  ☐ MCP                          │
                              │ ─────────────────────────────── │
                              │  CONNECTION STATE   1           │
                              │  ☑ Connected                    │
                              │  ☐ Not connected                │
                              │ ─────────────────────────────── │
                              │  USED IN STUDIO    0            │
                              │  ☐ Governance                   │
                              │  ☐ Agentic                      │
                              │  ☐ Workforce                    │
                              │ ─────────────────────────────── │
                              │  SOURCE   0                     │
                              │  ☐ Official                     │
                              │  ☐ Partner                      │
                              │  ☐ Private                      │
                              │ ─────────────────────────────── │
                              │  Clear all   Cancel  Apply +3   │
                              └─────────────────────────────────┘
```

---

## Acceptance criteria for handoff

- [ ] All 5 groups render in the slideout with the keys above.
- [ ] Active chips render in the inline toolbar above the grid.
- [ ] **Apply** commits the draft; **Cancel**/ESC/overlay click discards.
- [ ] **Clear all** resets every filter in one click.
- [ ] Search + Sort stay inline (always visible).
- [ ] Combining filters performs an AND across groups, OR within multi-select groups.
- [ ] Empty result renders the "Request integration" CTA pre-filled with the search term.
- [ ] Filter state is encoded in the URL query string (e.g. `?cat=crm,dev&src=official`) for shareable links.

---

**Last updated:** 2026-06-01 · Sprint E (Edgardo handoff)
