# Integrations — Feature Description

> The Integrations area of Admin Studio (`settings.html`). This is the complete
> description of every surface, what it shows, what a user can do, and how the
> pieces connect. Written after the Browse/Operate unification — there is no
> mode toggle; the studio reads its own state.

---

## What this is

Integrations is where a workspace decides which external systems AIMS-OS is
allowed to use, configures them once, and keeps them healthy. Everything an
admin connects here becomes available downstream to Data Studio (mapping +
sync), Agent Studio (tools), and Workflows.

Two roles see the same area differently — the view is driven by the signed-in
user's permissions (the **Admin view ↔ End-user view** control in the topbar):

- **Admin** — the full governance surface: catalog, detail pages, instances, distribution, requests, audit.
- **End-user** — a reduced surface focused on "what can I use, and what can I request."

There is **no Browse/Operate mode**. Triage (things that need attention) and
discovery (the catalog) live on the same page. The page surfaces urgent work at
the top and the catalog below.

---

## 1. The home page

`#/integrations` — the landing surface. Top to bottom:

### 1.1 Hero

- A headline that reads the live workspace state — e.g. *"Connect your stack to AIMS-OS"* on the marketplace view, or *"13 integrations active in this workspace"* on the already-integrated view.
- A subline with counts (integrations, categories, how many need attention).
- A **search bar** — filters the catalog. On the marketplace view it searches the full catalog; on the already-integrated view it searches only active integrations.
- A **stats strip** — Active connections / Official integrations / Verified partners / Built by your team.
- An **anchor line** — *"Need something the catalog does not have? Request it from the AIMS team →"* (opens the request modal).

### 1.2 Needs your attention band (admin only)

An inline band that appears **only when** the admin has connected integrations
that need a decision. It replaces the old separate "Operate" screen.

- **Header:** `● NEEDS YOUR ATTENTION · N integrations`. The dot pulses amber.
- **Rows:** one per integration needing attention. Each shows the issue status chip (Auth expired / Schema drift / Needs mapping), logo, name, category, usage (calls/day, workflows), the owner avatar, and a **verb-first action button** matched to the issue:
  - Auth expired → **Reauthenticate**
  - Schema drift → **Resolve drift**
  - Needs mapping → **Finish mapping**
- **Sorted by severity** — what's broken now (auth, provider down) surfaces above what's pending (drift, mapping). Even when the list is cut, the most urgent is always visible.
- **Capped at 5 rows.** If there are more, a **"Show all N +X"** button expands the list inline. When expanded, the list scrolls internally (max ~5.5 rows tall) so the band never grows unbounded and pushes the catalog off-screen.
- **Disappears entirely** when nothing needs attention. There is no "0 items" empty state — silence is the success state.
- **Hidden for end-users** — they don't operate the workspace, so the band never renders for them.

### 1.3 Tab strip

Two tabs that switch the body below:

- **✓ Already integrated (N)** — what the workspace has connected.
- **⠿ Marketplace (N)** — the full catalog of what can be added.

Docked to the right of the tabs:

- **+ Request integration** (opens the request modal).
- **+ Build your own** (opens the build chooser; admin only).

---

## 2. Already integrated tab

The lens for "what is my team already using?"

- Connected integrations **grouped by category** (Communication, Productivity & Docs, Data & Analytics, Sales & CRM, etc.).
- Each category block has a colored dot, an uppercase label, and a count.
- Each card shows: status pill, logo, name, vendor, capability chips, and a footer line with instance count and usage (calls/day or last run).
- The card is fully clickable → opens the provider detail page.
- Hero search filters the cards in place; empty categories collapse out.

---

## 3. Marketplace tab

The lens for "what could I add?"

- **Active strip** (when there are connections) — a banner showing how many are connected, up to 5 logos with health dots, and a "View all" link.
- **Featured card** — a curated editorial highlight for one integration.
- **Curated grids** — "Popular in your workspace" and "New from verified partners."
- **Two promo banners** — "Build your own" and "Request from the AIMS team."
- **Browse all** — the full catalog grid with:
  - A sticky toolbar: title + count + search + sort (Popular / A–Z / Recent) + an **All filters** button.
  - An active-filter chips row (dismissable) when any filter is on.
  - The marketplace card grid.

### Marketplace card states

| State | Footer |
|---|---|
| Not connected | **Connect** button |
| Connected (1 instance) | usage (calls/day) or "Connected" |
| Connected (multiple instances) | "N instances · X calls/day" |

Each card also shows a source flag (Private / Partner), a verified checkmark (official), capability chips, and the studios that consume it.

### Empty state (no matches)

A search icon, a headline, and three escape routes: **Request {term}**, **Clear filters**, **Or build it yourself**.

---

## 4. Filters slideout

Opened by **All filters** on the catalog toolbar. Slides in from the right.
Uses **draft-then-apply** — changes don't take effect until you click Apply;
closing or pressing Esc discards the draft.

Five collapsible sections:

- **Category** (multi-select)
- **Capability** (multi-select)
- **Connection state** — Connected / Not connected (multi-select)
- **Used in studio** — Governance / Agentic / Workforce (single-select)
- **Source** — Official / Partner / Private (single-select)

Footer: **Apply changes** (shows a `+N` pending count) and **Cancel**.

---

## 5. Request integration

A modal for asking the AIMS team to build an integration the catalog doesn't
have. Opened from the hero anchor, the home button, or the empty search state.

Five sections in one scroll:

1. **Who is asking** — requester (auto), department, scope (this tenant / org-wide).
2. **What you're connecting** — integration name, vendor, website URL.
3. **What you want to do** — business intent (textarea), action types (Read / Write / Push).
4. **Data sensitivity** — PII / Financial / Compliance (No / Maybe / Yes each).
5. **Priority and scale** — priority (Low / Medium / High / Critical, each described) and estimated users.

Footer: **Cancel** + **Submit request →**.

On submit, the user sees a confirmation with a ticket number and ETA, and links
to the Requests inbox. The request appears immediately in that inbox for admins.

---

## 6. Build your own

Opened from **+ Build your own**. A chooser with four methods:

| Method | Best for | Build time | Status |
|---|---|---|---|
| **Webhook builder** | Internal endpoints, REST APIs | 5–15 min | 6-step wizard (full) |
| **Import OpenAPI** | APIs with an OpenAPI spec | 2–5 min | Single-screen flow (full) |
| **From spreadsheet** | One-off CSV / XLSX datasets | 30 sec | Preview stub (v2) |
| **Code SDK** | Complex custom logic | hours | Reference / docs screen |

### Webhook builder (6 steps)

1. **Basics** — name, description, category, icon.
2. **Authentication** — None / Bearer / API key / Basic / Custom headers.
3. **Define actions** — each becomes a tool agents can call.
4. **Declare capabilities** — Tools / Knowledge / Triggers / Delivery.
5. **Test & Preview** — simulated test call + a preview of the catalog card.
6. **Publish** — confirmation summary; the integration is added as Private.

### Import OpenAPI

Upload a spec or paste its URL → AIMS parses it and lists the endpoints to
expose as tools (with toggles) → **Generate integration**.

### Code SDK

Install commands (npm / pip), a TypeScript example, deploy CLI commands, and a
list of SDK-deployed integrations.

### Publish lifecycle

Anything built here moves through **Draft → Staged → Published**, with named
approvers, "Remind approvers," "Publish anyway," and "Re-stage." Official
catalog integrations skip this — only built-in-house connectors go through it.

---

## 7. Provider detail

Reached by clicking any integration. A *provider* is the integration as a whole
(Salesforce, Snowflake). Header: logo, category, health, last run, auth method,
who connected it; actions Ask AI / Rotate credentials / Disconnect (or
**Connect** if not connected).

Tabs depend on the view:

**End-user (2 tabs):** Overview · Capabilities
**Admin (5 tabs):** Overview · Capabilities · Instances · Usage · Activity

- **Overview** — instances summary (Connected / Need attention / Capabilities active), a "Used in Studios" panel (Governance / Agentic / Workforce), the description, an integration-details sidebar, and "What you can do with it."
- **Capabilities** — the catalog of everything the integration ships with, grouped into Tool / Data Sync events / Data Sync routing, each with a description and OAuth scope. Read-only at this level; a counter shows "Active in X of Y instances." Clicking opens a detail drawer.
- **Instances** — every deployed instance with status, capability count, last run, owner; a **+ Add another instance** button.
- **Usage** — where the integration is consumed: stat tiles for Workflows / Agents / Networks / Widgets, plus a searchable consumer list.
- **Activity** — provider-level lifecycle events with actor and timestamp; links into instances for execution logs.

### Connected vs. not connected

| Element | Connected | Not connected |
|---|---|---|
| Health badge, last-run, owner pills | shown | hidden |
| Right-side action | Rotate / Disconnect | **Connect {name}** |
| Publish card | shown if Draft/Staged/Published | hidden |
| Instances / Usage / Activity tabs | populated | empty states with a Connect CTA |

---

## 8. Instance detail

Reached from the Instances tab. An *instance* is one deployment of a provider in
one workspace, with its own credentials and capability toggles. The header
(logo, name, instance ID, status, AIMS-managed/BYOK chip, last run, connected
by; Ask AI / Rotate / Disconnect) is sticky across all six tabs.

- **Basic Info** — health snapshot (Status / Last run / Errors 24h), "About this instance," a configuration card (ID, display name, auth mode, auth method, region, activated by), and a Quick actions sidebar.
- **Authentication** — the auth method (OAuth / API token / Service account) with an identity & attribution callout, a connection-details card, method-specific actions (Re-authenticate / Test / Rotate / Revoke), and the other methods the provider supports.
- **Capabilities** — per-instance toggles. Every capability the provider supports, grouped into Tools / Data Sync / MCP, each a card with description, key, "View example," and an on/off switch. This is the screen that decides what Data Studio and agents see.
- **Access** — who can reach this instance: Workspaces (where), People, and Groups, each with counts and remove controls, plus an "Add people or groups" picker.
- **Logs** — execution logs (one row per tool call) with Date / Status / Studio filters, search, CSV export, and pagination.
- **Audit** — the governance trail (who changed which capability, auth, permission) with filters and pagination.

---

## 9. Requests inbox

`#/requests` — a Gmail-style inbox for the integration requests submitted via
the request modal.

- **Header:** total count + "N waiting on you."
- **Status tabs:** All / Pending / Quoted / In progress / Delivered / Rejected, each with a count.
- **Search** (⌘K) by vendor, requester, scope.
- **Bulk bar** (when rows selected): Approve / Reject / Reassign.
- **Each row:** status chip, priority tag, requested integration, a preview of the business intent, action-type and compliance tags, requester avatar + age, quote/ETA, and quick actions (Approve / Reject / Assign) + an Open chevron.
- **Empty states** for "no results in this view" and "no search matches."

---

## 10. Cross-cutting behaviors

### Status system

Every integration's state is derived (`deriveStatus`) and grouped into three
buckets: **Working** (green), **Needs attention** (amber), **Disconnected /
inactive** (grey). The same color and label vocabulary appears everywhere — the
attention band, the card chips, the detail health badge — so a status reads the
same wherever you see it. Eight states map into the three buckets (e.g. auth
expired, schema drift, needs mapping → needs attention).

### Severity ordering

Within needs-attention, items are ranked: auth failed → auth expired → provider
down → rate limited → schema drift → needs mapping. The attention band and any
"X need attention" count use this so the most urgent always surfaces first.

### Permission-driven view

The Admin ↔ End-user control changes what renders — sidebar items, detail tabs,
the attention band, and per-card actions (Connect vs. Request access). The page
reads the role at render time; there is no separate "mode" to switch.

### Scale handling

The attention band caps at 5 rows and offers "Show all" with internal scroll, so
the home stays usable whether 1 or 50 integrations need attention. The catalog
grid filters and sorts; the requests inbox paginates; instance logs/audit
paginate.

### Cross-studio handoffs

- Data Sync capabilities link to Data Studio for mapping.
- A "Used in Studios" panel and the Usage tab link to the consuming agents/workflows/widgets.
- Auth issues surface a "fix in Admin Studio" path from wherever they're hit.

---

## 11. What is intentionally not here

- **Browse / Operate mode toggle** — removed; unified into one page.
- **A standalone Operate screen** — replaced by the inline attention band.
- **Spreadsheet connector wizard** — preview stub, deferred to v2.
- **End-user access to instance detail, Distribution, Workspaces, Users, Audit** — admin-only surfaces; end-users get a reduced view.

---

## 12. Where to look in the code

| Surface | Function (`settings.html`) |
|---|---|
| Home (marketplace) | `renderHome` |
| Home (already integrated) | `renderIntegratedHome` |
| Attention band | `attentionBandHTML` / `toggleAttnBand` |
| Catalog cards | `mktCardHTML` / `homeIntegratedCardHTML` |
| Filters slideout | `renderFiltersSlideout` |
| Request modal | `ensureRequestModal` / `openRequestModal` |
| Build chooser + methods | `renderBuildChooser` / `renderBuildWebhook` / `renderBuildOpenAPI` / `renderBuildSDK` |
| Provider detail | `paintDetail` + `detailOverview` / `detailCapabilities` / `detailInstances` / `detailUsage` / `detailProviderActivity` |
| Instance detail | `renderInstanceDetail` + `instanceBasicHTML` / `instanceAuthHTML` / `instanceCapsHTML` / `instanceAccessHTML` / `instanceLogsHTML` / `instanceAuditHTML` |
| Requests inbox | `renderRequestsInbox` / `requestRowHTML` |
| Status derivation | `deriveStatus` / `bucketOf` / `STATUS_META` |
