# Settings → Integrations — Design Spec

**Status:** Draft for J.J. review
**Author:** Thomas González
**Date:** 2026-05-19
**Scope:** First section of the new transversal Settings surface in AIMS-OS. Integrations is shared across Governance Studio, Agentic Studio (Workers + Agentic Networks), and Workforce (Comm Hub).

---

## 1. Why this exists

AIMS-OS currently has three studios but no transversal place to administer the workspace. Each studio embeds partial config and that creates duplication, drift, and a governance gap that enterprise buyers will flag (SOC 2, ISO 27001, internal audit).

**Settings** is a new top-level surface in the shell that consolidates workspace-wide and personal configuration. **Integrations** is the first section we build end-to-end because:

- Every studio needs them (Governance ingests, Agentic invokes, Workforce reacts).
- They are the most visible "platform" capability for an enterprise buyer.
- They are the gateway for the Models & Providers, Audit log, and Roles work that comes after.

This spec defines what the v1 of Settings → Integrations looks like, what J.J. is being asked to approve, and what is explicitly out of scope but visible as roadmap.

---

## 2. Product decisions (confirmed in brainstorming)

| Axis | Decision | Rationale |
|---|---|---|
| Scope of v1 | Full enterprise platform: catalog + connection + permissions + audit + marketplace | Differentiator vs. competitors; what J.J. asked for |
| Ownership | Hybrid: Workspace + Personal | Matches Notion/Linear/Slack pattern; required for both corporate control and individual flexibility |
| Capabilities | Four, declared per integration: Tools/Actions · Knowledge sources · Triggers · Channels/Sinks | Covers all three studios' consumption patterns |
| Catalog taxonomy | By business function (11 categories) | What an admin actually thinks in |
| Auth methods | OAuth 2.0 · API key/token · Service account JSON | Covers ~95% of enterprise SaaS |
| Permissions | Connect = Workspace Admin · Use = per studio + roles | Governance without being kafkian |
| Settings IA | Two groups in sub-sidebar: Workspace + Personal | Mirrors the ownership model |
| Observability | Health badges per integration + workspace-wide Audit log (exportable, webhook-streamable) | Meets SOC 2 / ISO 27001 baseline |
| Marketplace sources | AIMS-OS Official · Partner · Private | Real marketplace shape without opening a public submission program in v1 |
| Custom builder | Three ways: Webhook (no-code) · OpenAPI import · Code SDK | Covers admin-only, semi-technical, and dev personas |
| Entry point | Dedicated full-screen surface inside the existing shell, own URL `/settings/...` | Consistent with Slack/Notion/Linear; deep-linkable |
| Deliverable | Navigable `settings.html` prototype + this spec doc | Same pattern as `agentic-studio.html` and `governance-studio.html` |

**Out of scope for v1 (visible as "Coming soon" placeholders so J.J. sees the roadmap):**
Members & Teams · Roles & Permissions · Models & Providers · Security & SSO · Billing & Usage · Notifications · API tokens · Sessions & Devices.

**Out of scope, permanently (or until concrete demand):**
- mTLS / client cert auth
- Basic Auth as an auth method
- Cost-per-integration tracking
- Public open marketplace with third-party submission flow
- RBAC at the per-operation level (e.g., per Slack action)

---

## 3. Shell integration

Settings lives inside the existing AIMS-OS shell. It does **not** replace the shell — the topbar (search, gear, bell, avatar, ws-badge) and the global sidebar (apps: Governance, Agentic, Comm Hub) remain visible.

The shell's `Settings` entry (gear icon and avatar menu) navigates to `/settings/integrations` as the landing section.

**Layout inside `.main` when in Settings:**

```
┌─────────────────────────────────────────────────────────────┐
│ Topbar (global, unchanged)                                   │
├──┬──────────────────┬───────────────────────────────────────┤
│  │ Settings         │                                       │
│  │ ────────────     │                                       │
│G │ Workspace        │                                       │
│l │  General         │      Content area                     │
│o │  Members         │      (the active section,             │
│b │  Roles           │       e.g. Integrations home)         │
│a │ ▸Integrations    │                                       │
│l │  Models          │                                       │
│  │  Security & SSO  │                                       │
│s │  Audit log       │                                       │
│b │  Billing         │                                       │
│  │ ────────────     │                                       │
│  │ Personal         │                                       │
│  │  Profile         │                                       │
│  │  Notifications   │                                       │
│  │  My Integrations │                                       │
│  │  API tokens      │                                       │
│  │  Language        │                                       │
│  │  Sessions        │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

The sub-sidebar uses the same tokens as the global sidebar (`--shell-sidebar-bg`, `--shell-sidebar-border`, `--shell-sidebar-item-*`) so dark/light mode work out of the box.

**Sub-sidebar behaviors:**
- Workspace group is visible to everyone, but Workspace-Admin-only items show a discreet lock icon for non-admins. Clicking them opens a "Permission denied" content page that redirects to Personal.
- Item search (cmd+K within Settings) filters sub-sidebar items in place.
- Dot indicators (amber) for sections with unresolved alerts (e.g., a failing integration).
- Items marked "Coming soon" are visible but disabled with tooltip and date.
- Footer shows workspace switcher (if applicable) and current plan badge.

---

## 4. Integrations home

URL: `/settings/integrations`. Single content area, scrolls vertically. Sticky page header on scroll.

### 4.1 Page header
- H1: **Integrations**
- Subtitle (`--t2`): "Connect external tools to your workspace. Shared across Governance, Agentic and Workforce."
- Right actions: secondary `Audit log →` · primary `+ Add integration` (gradient `--grad`).
- Meta chips below subtitle: `12 connected` · `2 with issues` · `40 available`.

### 4.2 Zone 1 — "Active in your workspace" (Connected)
- Section subtitle: `ACTIVE IN YOUR WORKSPACE` (small caps, weight 600, `--t2`).
- Right-aligned segmented control: `All` · `With issues` · `Recently added`.
- Grid of cards, 3 columns desktop / 1 mobile. Card content:
  - Row 1: logo 28px · integration name · health badge right-aligned (🟢 Healthy / 🟡 Degraded / 🔴 Failed).
  - Row 2: capability chips (`Tools` `Channels` etc.).
  - Row 3: two-column metadata: "Last run: 2 min ago" · "Errors 24h: 0".
  - Row 4 (footer): mini avatar + "Connected by María · 3d ago" · `⋯` menu (View details, Manage permissions, Rotate credentials, Disconnect).
- Card hover: subtle elevation.
- Empty state: "No integrations connected yet" + CTA `Browse the catalog ↓` that scrolls to Zone 2.

### 4.3 Zone 1.5 — Divider
A 1px divider (`--shell-sidebar-border`) with `--bg2` 24px padding above and below.

### 4.4 Zone 2 — "Discover the catalog"
- Section subtitle: `DISCOVER THE CATALOG` + right-aligned search input ("Search 40 integrations").
- **Source tabs** row: `All` · `Official` · `Partner` · `Private` · separator · `+ Build your own` (last is a CTA, not a filter).
- **Filter pills** row below tabs: chips for each business category (toggleable), chip for capability (Tools/Knowledge/Triggers/Sinks), chip for state (Connected/Not connected). Active pills get an inverted style. A `Clear filters` chip appears when any are active.
- Grid of cards, 4 columns desktop / 2 mobile. Smaller than Connected cards:
  - Logo + name + category (`--t2`, 12px).
  - One-line truncated description.
  - Source badge bottom-left: `Official` / `Partner · by Acme` / `Private`.
  - State CTA right: `Connect` button if not connected, `✓ Connected` text label otherwise.

---

## 5. Integration detail

URL: `/settings/integrations/<slug>`. Deep-linkable. Reachable from any catalog card, any Connected card, and from audit log rows.

### 5.1 Breadcrumb + back
`Settings › Integrations › Slack` · `← Back to Integrations`.

### 5.2 Page header
- Row 1: logo 48px · H1 name · source badge.
- Subtitle: vendor + short description.
- If connected: metadata row — `Healthy 🟢` · `Last run 2 min ago` · `Connected by María · 3 days ago` · `OAuth 2.0`.
- If not connected: large CTA `Connect <name>` (gradient) anchored right.
- If connected: right actions `Rotate credentials`; `Disconnect` lives in `⋯` menu.

### 5.3 Tabs (sticky below header)
`Overview` · `Capabilities` · `Permissions` · `Audit`.

If the integration is not connected, all four tabs are visible. Capabilities, Permissions, and Audit show a soft overlay "Connect this integration to manage" with an inline `Connect` CTA. This preserves discoverability without forcing the connect flow.

### 5.4 Tab — Overview (default)
Two columns: main (~70%) + context sidebar (~30%).

**Main column:**
- "About this integration" — long-form description, screenshot of the integration running inside a studio.
- "What you can do with it" — 3 horizontal cards (one per active capability) with icon, title, two lines.
- "Use cases" — bullet list, 3-4 concrete scenarios.
- "Required scopes" — chip list of OAuth scopes the integration will request.

**Context sidebar:**
- Maintainer, version + Changelog link.
- Documentation (external link).
- Support contact.
- Data residency.
- Compliance badges (SOC 2, ISO 27001, GDPR — when applicable).
- Last security review date.

If the integration is **not** connected, the bottom of the main column shows a "Before you connect" panel listing scopes and data access — Microsoft-style consent preview.

### 5.5 Tab — Capabilities
Four collapsible groups, one per capability. Groups for unsupported capabilities render disabled with tooltip "Not supported by this integration".

**Tools / Actions** — tabular list. Columns: name · description · required permission · OAuth scope · enabled toggle. Filter: enabled/disabled/all. Per row `View example call →` opens a side drawer with sample request/response JSON.

**Knowledge sources** — list of indexed sources + `+ Add source`. Each source: name, freshness, size metric, "Re-index now" button.

**Triggers** — list of subscribable events. Each row: event name, sample payload preview, toggle, `Configure trigger` link that opens the workflow builder.

**Channels / Sinks** — list of available destinations. Per destination: delivery config (retry policy, dead-letter destination, rate limit).

### 5.6 Tab — Permissions

**"Available in studios"** section. Three cards horizontal, one per studio:
- Studio logo + name + toggle `Enabled in this studio`.
- When enabled: "Who can use it in this studio" with a roles/groups multi-select (chips with `+ Add role/group`).
- Roles are studio-specific (e.g., `Agent Builders` in Agentic, `Knowledge Curators` in Governance).

**"Personal use"** section. Single toggle: `Allow members to also connect their personal accounts`.

**Sticky save bar** at bottom of content area when there are unsaved changes: `Changes pending · Discard · Save changes`.

### 5.7 Tab — Audit
Pre-filtered view of the workspace audit log, scoped to this integration.

- Header: "Showing audit events for **<name>** · Last 30 days" + `View full audit log →`.
- Local filters: date range · event type · actor.
- Table columns: Timestamp · Event · Actor · Studio · Details · IP.
- Click row to expand inline JSON + `Copy event ID`.
- Top-right `Export CSV`.

---

## 6. Connect flow

When `Connect <name>` is clicked anywhere, a 480px right-side drawer slides in over the current view. ESC, X, or click-outside dismisses.

**Header:** logo + "Connect <name>" + close.

**Step 1 — Choose auth method** (skipped if the integration supports only one):
- Radio cards: `OAuth 2.0` (badge `Most secure`) · `API token` · `Service account JSON`.
- Each card has a one-line pros/cons summary.

**Step 2 — Authenticate** (one of three branches):

| Method | UI |
|---|---|
| OAuth 2.0 | Primary button `Continue to <vendor> →` opens provider OAuth popup. On return, green panel "Connected as <account> · Authorized by <user> · Scope granted: N of N". |
| API token | Single-line input with helper text + external link to provider docs. Button `Test connection` runs a validation call. Optional `Display name for this connection`. |
| Service account | JSON file drop zone. On upload, parsed metadata appears (project, account email). Button `Verify access`. |

**Step 3 — Initial scope:**
- "Where should this integration be available?" — checkboxes for Governance / Agentic / Workforce (all on by default).
- "Who can use it?" — default `Workspace Admins only` with an inline `Configure roles per studio` link to the Permissions tab.
- Toggle "Allow members to also connect their personal accounts" (off by default).

**Step 4 — Confirm:**
- 3-4 line summary of the chosen config.
- `Connect <name>` button (gradient) → toast `<name> connected ✓` + drawer closes + Overview tab refreshes with the new connected state.

**Error handling:** inline red banner inside the drawer with retry button.

---

## 7. Audit log (workspace-wide)

Sibling section of Integrations in the sub-sidebar (`Workspace → Audit log`). Reached also from `Audit log →` link in the Integrations page header and the Audit tab of any integration.

### 7.1 Layout
Datadog/Splunk-style dense table.

**Header:** H1 `Audit log` · subtitle "Workspace-wide events for the last 90 days. Export to CSV or stream via webhook." · right actions `Configure webhook export` · `Export CSV`.

**Sticky filter row:**
- Date range with presets `1d / 7d / 30d / 90d / custom`.
- Event type multi-select: `Integration` `Member` `Role` `SSO` `Billing` `Settings` `Studio`.
- Actor user search.
- Resource search.
- Severity: `Info` `Warning` `Critical`.
- Right side: `Showing X of Y events` counter + `Clear filters`.

**Table:** Timestamp (relative + tooltip absolute) · Severity chip · Event chip · Actor (avatar + name or `Agent: <name>`) · Resource (link) · Studio · IP · `View details ⌄`.

Row click expands inline with raw JSON event + `Copy event ID` + `Copy as cURL`.

### 7.2 Event types shown in the prototype
For integrations specifically:
- `integration.connected`, `integration.disconnected`
- `integration.credentials_rotated`
- `integration.permissions_changed` (with before/after)
- `integration.used_by_agent` (which agent, which action, which scope)
- `integration.health_degraded`, `integration.health_recovered`
- `integration.private_published`

For workspace context (so the log feels real, not integration-only):
- `role.assigned`, `role.removed`
- `sso.login_success`, `sso.login_failed`
- `settings.changed`

### 7.3 Webhook export
`Configure webhook export` opens a drawer with:
- Target URL.
- HMAC secret.
- Event type selection (checkboxes).
- Test ping button.

This is the integration point SIEM teams will use to forward events to Splunk/Datadog.

---

## 8. Build your own (private integrations)

Entry points: `+ Build your own` tab in the catalog source row, `+ New private integration` CTA in the Private tab, and a Quick action in `+ Add integration`.

A method chooser is shown first — three horizontal cards:

| Method | Best for | Time | Level |
|---|---|---|---|
| Webhook builder | Connect an internal endpoint or a SaaS without an SDK | 5–15 min | No-code |
| Import OpenAPI | APIs with OpenAPI/Swagger | 2–5 min | Low-code |
| Code SDK | Complex logic, multi-step orchestration, specialized auth | Hours | Dev |

### 8.1 Webhook builder
Inline wizard with stepper:
1. **Basics** — name, icon, description, vendor, category.
2. **Authentication** — `None / Bearer / API key (header) / Basic / Custom headers`. If Bearer, token input + "Store as secret" checkbox.
3. **Define actions** — list with `+ Add action`. Per action: slug, label, description, HTTP method, URL with `{{variables}}`, request body template, input schema (visual builder), response mapping, `Test action`.
4. **Declare capabilities** — checkboxes for Tool / Knowledge source / Trigger / Sink, with validation warnings when configuration is incomplete.
5. **Test & Preview** — sandbox run + catalog card preview.
6. **Publish** — Visibility fixed to `Private`, per-studio permissions selector, `Publish to workspace`.

### 8.2 Import OpenAPI
Single-page flow:
- Drop zone or URL input for `openapi.json`/`openapi.yaml`.
- `Parse spec` → summary card "Found N endpoints, M schemas, auth = <type>".
- Endpoints table with checkbox per row (default all on). Filter by path or method.
- Side panel: base URL override, common headers, auth type, secrets.
- `Generate integration` → creates an integration with all selected endpoints as Tools, OpenAPI `webhooks` (3.1) auto-mapped to Triggers.
- Final step: name, icon, category, permissions, `Publish to workspace`.

### 8.3 Code SDK
Developer landing page:
- Install commands (`npm install @aims-os/integrations-sdk`, `pip install aims-integrations`).
- TypeScript code example using `defineIntegration` and `tool` primitives.
- "Workspace deployment token" generator.
- CLI deploy command: `aims integrations deploy ./<folder>`.
- "Currently deployed from SDK" — list of privately published integrations with version, last deploy, deployer.
- External link to full docs.

For the v1 prototype, the SDK tab is presentational (no functional flow) — it demonstrates depth to J.J.

---

## 9. Catalog content (taxonomy + integrations to mock)

Eleven business categories. ~40 mocked integrations distributed across them so the catalog feels deep without inventing brands.

| # | Category | Integrations |
|---|---|---|
| 1 | Communication | Slack · Microsoft Teams · Email (SMTP/IMAP) · Twilio |
| 2 | Productivity & Docs | Google Workspace · Microsoft 365 · Notion · Confluence |
| 3 | CRM & Sales | Salesforce · HubSpot · Pipedrive |
| 4 | Ticketing & ITSM | Jira · ServiceNow · Zendesk · Linear |
| 5 | Data & Analytics | Snowflake · Google BigQuery · Databricks · Looker |
| 6 | Storage | Google Drive · SharePoint · Amazon S3 · Box · Dropbox |
| 7 | Dev & Code | GitHub · GitLab · Bitbucket |
| 8 | HR & People | Workday · BambooHR · Rippling · Greenhouse |
| 9 | Finance & ERP | NetSuite · SAP S/4HANA · QuickBooks |
| 10 | Security & Observability | Splunk · Datadog · CrowdStrike |
| 11 | Custom / Build your own | Generic Webhook · REST API connector · Database (Postgres) |

**Identity / SSO providers** (Okta, Microsoft Entra ID, Auth0) live in `Workspace → Security & SSO`, not in the Integrations catalog. Their lifecycle (SCIM, JIT, group sync) is materially different from operational integrations.

**Source distribution in the mock:**
- Official (~30) — top-of-category vendors maintained by AIMS-OS.
- Partner (~7) — 2-3 plausible third parties (e.g., "Workday by Acme HR Connect", "SAP S/4HANA by Mulesoft", "Looker by Tableau Bridge").
- Private (~3) — fictional workspace-built examples ("Internal Billing API", "Customer DB Reporter", "Slack #ai-ops monitor").

**State distribution in the mock:**
- Connected (~12) — surfaced in Zone 1 with a healthy mix: several Healthy, 1-2 Degraded, 1 Failed.
- Not connected (~28) — the rest of the catalog.

**Sample capability declarations (illustrative):**
- Slack: Tools · Triggers · Channels
- Salesforce: Tools · Knowledge sources
- Google Drive: Knowledge sources
- Snowflake: Knowledge sources · Tools
- Jira: Tools · Triggers
- GitHub: Tools · Triggers · Knowledge sources
- Datadog: Triggers · Channels

---

## 10. Personal Integrations

Route: `Settings → Personal → My Integrations`. Same shell, same component library, three deliberate differences so the user knows the scope is theirs.

### 10.1 Differentiators
- Page header includes the user's avatar next to the title: "My Integrations · Visible only to you".
- Accent color uses the existing softer Personal accent rather than `--grad` to differentiate from workspace surfaces.
- Persistent badge `Personal scope` with tooltip "Connections here are only available to you and don't affect the workspace."

### 10.2 What appears
- Only integrations where the workspace admin enabled `Allow members to connect personal accounts`.
- Integrations not enabled for personal connect appear in the catalog but disabled, with tooltip "Your admin hasn't allowed personal connections for this integration."
- No `Custom / Build your own` category (members don't author private integrations).

### 10.3 Layout
Same Zone-1 / Zone-2 split as the workspace home, but the cards are simpler:
- Connected card: logo · name · account ("maria.gonzalez@gmail.com") · capability chips · "Connected · 12 days ago" · `⋯` (View activity, Disconnect).
- Discover card: same as workspace catalog but no permissions UI.

### 10.4 Detail page
Two tabs only — `Overview` and `Your activity`. Permissions tab is omitted (not applicable). Audit tab is replaced by a self-only activity timeline (last 30 days, no admin filters, no CSV export).

### 10.5 Connect flow (personal)
Same drawer as workspace, **without Step 3 (initial scope)**. Personal connections inherit the workspace-defined scope for that integration.

---

## 11. States and edge cases

### 11.1 Empty states
| Surface | Copy |
|---|---|
| Workspace Integrations, none connected | Hero illustration + "No integrations connected yet" + "AIMS-OS is more powerful when your tools talk to it" + `Browse the catalog ↓` |
| Personal, none connected | "You haven't connected any personal accounts" + top 3 suggested + `See what's available` |
| Catalog filtered to zero | "No integrations match these filters" + `Clear filters` + "Looking for something specific? `Request an integration →`" |
| Audit log filtered to zero | "No events match these filters. Try widening the date range." |
| Build your own, no private published | "No private integrations yet" + 3 method cards |

### 11.2 Loading states
Skeleton shimmer using `--shell-sidebar-item-icon-bg`, matching the pattern already in `agentic-studio.html`.

### 11.3 Error states
- Connected card showing `Failed`: tooltip "Token expired · last error: 401 Unauthorized" + inline CTA `Rotate credentials`.
- Global red banner when ≥3 integrations fail simultaneously: "Multiple integrations are failing. [View audit log]".
- Rate-limited: `Rate limited` chip on the card with backoff tooltip.

### 11.4 Permission denied (non-admin lands on a Workspace section)
- Sub-sidebar Workspace items render with lock icons.
- Content area: "You need Workspace Admin to manage workspace integrations. [Go to your personal integrations →]".

### 11.5 What's new indicators
- Amber dot on `Integrations` sub-sidebar item when there are unresolved alerts or a newly added integration in the last 7 days.
- `New` tag (green) on catalog cards added in the last 14 days.
- `Updated` tag (blue) on cards with a new version available.

### 11.6 Roadmap visible
Sub-sidebar items not built in v1 still render, disabled, with tooltips:
- Members & Teams — "Coming Q3 2026"
- Roles & Permissions — "Coming Q3 2026"
- Models & Providers — "Coming Q4 2026"
- Security & SSO — "Coming Q3 2026"
- Billing & Usage — "Coming 2027"
- Notifications, API tokens, Sessions & Devices — "Coming 2026"

Clicking a placeholder shows a standard "This section is coming soon" page with a short description and an optional "Notify me when this ships" input.

---

## 12. Visual system

Reuses existing tokens and components from the shell:
- Colors: `--bg`, `--bg2`, `--sb`, `--t1`, `--t2`, `--grad`, `--shell-sidebar-*`, `--shell-topbar-*`.
- Radii: `--r6`, `--r8`, `--r12`.
- Cards: same elevation and border styling as agentic-studio cards.
- Modals/drawers: extends the `.aims-modal-*` patterns; drawer is a new variant (`.aims-drawer`) that slides from the right.
- Tabs: same component as workspace-settings tabs.
- Chips: same as global search filter pills.
- Buttons: same as gear-menu and agentic CTAs.
- Both dark and light themes work out of the box.

No new icon system is introduced. Integration logos use the same lockup as the existing app switcher logos (28px in Connected cards, 24px in catalog cards, 48px in detail header).

---

## 13. Deliverable for J.J.

1. **`settings.html`** standalone prototype, following the same construction pattern as `agentic-studio.html` and `governance-studio.html`:
   - Fully wired sub-sidebar with Workspace and Personal groups.
   - Integrations home with Connected zone (~12 cards) and Discover zone (~40 cards across the 11 categories).
   - Functional source tabs (`All / Official / Partner / Private / + Build your own`).
   - Functional filter pills.
   - Integration detail page with all four tabs.
   - Connect drawer with all three auth method branches (mocked).
   - Audit log page with mocked events.
   - Build your own — Webhook wizard (functional UI, mock save), OpenAPI import (functional UI, mock parse), Code SDK (presentational).
   - Personal Integrations home + detail (simpler version).
   - Roadmap placeholders for every "Coming soon" section.
2. **This spec doc** — committed alongside the prototype for reviewers who want decision context.

---

## 14. Risks and open questions

| Risk / question | Mitigation or owner |
|---|---|
| Forty mocked integrations risks scope creep if every detail is bespoke | All cards share one template; only ~3 detail pages are hand-tuned (Slack, Snowflake, a Private one). The rest render from the same template with different data. |
| Webhook builder wizard could balloon into a real product without backend | v1 saves to in-memory state; "publish" is mocked. State is preserved for the duration of the prototype session. |
| Permissions UI implies a real role model that doesn't exist yet | Spec calls out that Roles & Permissions are "Coming soon"; the prototype uses hardcoded role names ("Agent Builders", "Knowledge Curators") as illustrative chips. |
| Audit log on the page header link might suggest workspace-wide audit is built — it isn't yet beyond integration events | Audit log page mocks events for integrations specifically + a small set of representative workspace events. Subtitle clarifies "Last 90 days". |
| J.J. may push on cost tracking / billing | Spec explicitly defers; visible as roadmap. |
| J.J. may push on third-party submission marketplace | Spec explicitly defers; Partner badge in v1 represents AIMS-curated partners only. |
| The current shell (`agentic-studio.html`) has a `workspace-settings` modal with a placeholder `integrations` tab | The new Settings surface replaces that modal. The gear menu and avatar menu entries that today open the modal should route to `/settings/integrations`. The modal is deleted in the migration. |

---

## 15. Next steps after approval

1. Spec doc reviewed and approved by Thomas, then by J.J.
2. Implementation plan written (next skill: `superpowers:writing-plans`).
3. Prototype built in `settings.html` following the plan.
4. Internal walkthrough with J.J. with this spec doc as the supporting narrative.
