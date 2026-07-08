# AIMS-OS Integrations — Demo Guide

> Walkthrough of the prototype, the mental model behind it, and how to use it.
> Live: **https://thomzilla33.github.io/aims-integration/**
> Design spec: [`spec.md`](spec.md)

---

## 1. What this is

The **Settings → Integrations** surface for AIMS-OS. It's the place where workspace admins connect external tools (Slack, Salesforce, Snowflake, GitHub, etc.) and configure how agents, workflows, and studios consume them.

This prototype implements the model described in the internal engineering brief by Thomas González (SVP Engineering) and Edgardo Sierra (Chief Architect). The shape of the UI deliberately mirrors the shape of the backend so that nothing gets lost in translation.

**Status:** Design prototype, not production code. All data is mocked in-memory.

---

## 2. Quick start

```
Open  →  https://thomzilla33.github.io/aims-integration/
Click →  the "Integrations" card on the Prototype Hub
```

You land on the marketplace home with 40 mocked integrations.

**5-minute demo path:**

1. `#/integrations` — Marketplace home with hero, studio filter, active strip, featured, popular, partners, browse-all
2. `#/integrations/s3` — Provider with **3 instances** (the brief's classic example: Production / Dev / Analytics)
3. `#/integrations/s3/instances/s3-analytics` — Per-instance page with **5 tabs** (Basic Info / Capabilities / Auth / Logs / Audit) and a **Helix Data Studio handoff** banner
4. `#/integrations/slack` — Click **`✨ Ask AI`** (cyan-purple gradient, top right) to talk to the integration's AI Assistant
5. `#/integrations/slack` → tab **Permissions** → click `+ Add role` on any studio card — see the role picker popover

---

## 3. Mental model — the four building blocks

The brief is clear: **mixing these up in the UI is the single biggest risk of this feature.** Keep them straight.

| Concept | What it is | UI surface |
|---|---|---|
| **Vendor** | The company that owns the software (Google, AWS, Atlassian) | Implicit in the catalog; vendor logos appear under provider name when a vendor owns multiple |
| **Provider** | A specific product from a vendor (Drive, Sheets, Gmail are 3 providers from Google) | One card per provider in the **Marketplace** |
| **Capability** | What a provider can do (Tool, Data Sync, MCP) | Chips on the card + groups on the Capabilities tab |
| **Instance** | One specific activation by the customer. Same provider can be activated N times (S3 Production, S3 Dev, S3 Analytics) | The **Active in your workspace** strip + the **Instances** section on the provider detail + the **per-instance pages** at `#/integrations/{slug}/instances/{id}` |

**Test of understanding:** "Slack" is a *provider*. "Slack Technologies" is the *vendor* that owns Slack. "Slack — AIMS Workspace" is an *instance*. "send_message" is a *capability* (specifically a Tool capability) of that instance.

---

## 4. The 3 capability types

Every capability on every provider falls into one of three buckets. The UI for each is different.

| Type | What it does | Where it ends up | Example |
|---|---|---|---|
| **Tool** | An action agents invoke synchronously | Used inside Agentic Studio, agents, agentic networks | `slack.send_message`, `jira.create_issue` |
| **Data Sync** | A continuous feed of events from the external system | Used inside Helix Data Studio for mapping & ingestion | `salesforce.new_customer`, `s3.object_created` |
| **MCP** | A bundle of tools exposed via the Model Context Protocol standard | Same as Tool — but **each tool inside the MCP can be activated individually** (governance happens per-tool, not per-bundle) | `github.repos` (6 tools), `github.actions` (5 tools) |

A 4th type (agent-style integrations) is coming eventually — out of scope for v1.

### How MCP is different from other platforms

Most platforms treat an MCP as a toggle (on/off the whole bundle, including its 200 tools). **AIMS-OS treats each MCP tool as if it were a regular tool.** When you activate an MCP capability, AIMS connects to it, asks it to describe itself, stores the tool list in our tables, and lets the customer activate each tool individually. Agents only see what the customer has activated — not the whole MCP. See it in action: `#/integrations/github` → tab `Capabilities` → scroll to **"MCP — Granular tool activation"**.

---

## 5. Lifecycle — the 5 moments

Each is a different screen in this prototype.

### 5.1 Browse the Marketplace
**URL:** `#/integrations`

Catalog with:
- **Hero** — workspace-level search across all 40 integrations
- **Category strip** — quick-pick by business function
- **Studio filter pills** — `All studios · Governance · Agentic · Workforce` (filters every section below)
- **Active in your workspace** — strip of currently-connected integrations with health dots
- **Featured this week** — one prominent provider
- **Popular** — 6 most-used in your workspace
- **New from verified partners** — 3 partner-built providers
- **Build your own** — purple promo (labeled v2 Preview, out of scope for v1)
- **Browse all** — sticky toolbar (source tabs + categories + capability + state filters) and the full grid below

### 5.2 Activate — the 6-step wizard
Triggered by clicking `Connect` on any unconnected integration.

| Step | Purpose |
|---|---|
| 1 | **Name your instance** + AIMS-managed vs BYOK choice (when provider supports multi-tenancy) |
| 2 | **Authentication method** — pick from the patterns this provider supports |
| 3 | **Authenticate** — form renders from the chosen pattern's schema (no custom code per provider) |
| 4 | **Choose capabilities** — toggle which Tools / Data Sync / MCP you want enabled on this instance |
| 5 | **Initial scope** — which studios + role chips can use this instance |
| 6 | **Confirm** — review + activate |

The wizard component is shared by every provider. What changes is the auth form (rendered from schema) and the capability list (from the provider's record).

### 5.3 Manage the instance
**URL:** `#/integrations/{slug}/instances/{instanceId}` (e.g. `#/integrations/s3/instances/s3-prod`)

Five tabs, each with a distinct purpose:

| Tab | Content |
|---|---|
| **Basic Info** | Instance ID, display name, auth mode (BYOK/AIMS-managed), auth method, region, who activated, when. Health snapshot. Action-needed banner if state is partially configured (e.g. Helix mapping pending) |
| **Capabilities** | Grouped by type (Tool / Data Sync / MCP) with per-item toggles. MCP capability drills into per-tool granular activation |
| **Authentication** | Renew, rotate, or replace credentials inline without re-running the wizard |
| **Logs** | Every execution that used this instance — table with actor, action, studio, latency, errors |
| **Audit** | Every config change on this instance — separate from execution logs |

### 5.4 Use from Agentic Studio
Not part of this prototype (lives in the Agentic Studio app). The model: workflow builder picks an *instance* first, then sees only the active capabilities on that instance. The platform enforces the governance at the source.

### 5.5 Use from an agent or chat
Same pattern as 5.4. Agent owner picks from what the workflow allows, which is a subset of what the integration allows.

---

## 6. The 3-layer cascading governance

This is one of the most important pieces of the model — it's what Mike asked for after the early MCP experiment.

**See it:** any integration detail → tab **Permissions** → top card "Cascading governance · 3 layers"

| Layer | Who decides | What they decide |
|---|---|---|
| **1. Integration level** | Workspace Admin | The **maximum** set of capabilities this integration can ever do, anywhere in the platform. Turning off `create_user` here means no agent in the entire tenant can ever invoke it. |
| **2. Workflow / Network level** | Workflow builder | Which of Layer 1's active capabilities this specific workflow can use. **Cannot exceed Layer 1.** |
| **3. Agent / Chat level** | Agent owner | Which of the workflow's capabilities a specific agent can use. **Cannot exceed Layer 2.** |

Each layer is a subset of the one above. Admins who want permissive setups leave everything on at Layer 1; admins who want restrictive setups turn things off and downstream owners simply cannot use them.

---

## 7. Multi-tenant vs Bring-Your-Own-Key

Every provider has a `multiTenant` flag. The wizard adapts accordingly.

| Flag value | What the wizard shows | Example |
|---|---|---|
| `multiTenant: true` | Two options on step 1: **AIMS-managed** (we provision a tenant-isolated subaccount, billed through AIMS) or **BYOK** (your own account, billed by the provider) | Twilio, Mandrill, Slack |
| `multiTenant: false` | BYOK only. Message: "provider does not support multi-tenancy" | Amazon S3, GitHub, Snowflake |

The product team doesn't need to know how multi-tenancy works per provider. The flag does the work.

---

## 8. The 5 authentication patterns (UI Schema rendered)

Every authentication method is a generic pattern implemented once. The provider record says which method(s) to use; the wizard renders the right form from its schema. **No Salesforce-specific auth code, no Jira-specific auth code, no S3-specific auth code.**

| Pattern | When | Example providers |
|---|---|---|
| **OAuth 2.0** | Most secure, supported by modern SaaS | Slack, Google, Microsoft, GitHub |
| **API token** | Pasted key for services without OAuth | Snowflake, Datadog, OpenAI |
| **Service account JSON** | Server-to-server with key file | Google Cloud, Firebase, BigQuery |
| **Username + password → token** | Legacy systems; we exchange credentials for a refreshing token | Workday, internal LDAP-style APIs |
| **Per-user authentication** | Tool added once at workspace level, but each end user authenticates individually. Tool calls run under user's identity | Google Drive (personal mode), Microsoft 365 |
| **Manual / multi-step checklist** | The "ugly" provider case — external steps, sometimes with a video walkthrough | SAP, on-prem connectors |

**See them all:** open Connect on different providers
- `slack` (OAuth + API key)
- `gdrive` (OAuth + Service + Per-user)
- `workday` (Basic + OAuth)
- `sap` (Manual + OAuth) — this one is the worst-case checklist UI

---

## 9. Studio-aware UX

Studios (Governance / Agentic / Workforce) are first-class visual citizens everywhere:

| Where | What it shows |
|---|---|
| **Home — studio filter pills** | Quick lens to show only integrations enabled in one studio |
| **Active strip — corner dots on avatars** | Mini colored dots on each connected integration showing which studios actively use it |
| **Marketplace cards — studio chips** | 3 mini chips per card. States: **active** (used + glow), **idle** (enabled but unused), **disabled** (dashed outline) |
| **Detail page — Used in section** | 3 horizontal cards (Governance / Agentic / Workforce) with real usage metrics per studio ("47 calls/day · 3 agents", "1,247 tables · updated 4h ago", "Not enabled") |

This answers the two implicit questions an admin always has: *"Where is this integration being used?"* and *"How much?"*

---

## 10. Workspace integrations vs Personal integrations

Two distinct sections in the sub-sidebar.

|  | **Integrations** (Workspace) | **My Integrations** (Personal) |
|---|---|---|
| Who manages | Workspace Admin | Any user |
| Who pays / owns credentials | The company | You, with your personal account |
| Who uses it | Every agent/workflow in the workspace, subject to permissions | Only you, in your session |
| Example | Corporate Slack workspace, GitHub org | Your personal Gmail, your personal Drive |
| Audit | Workspace-wide audit log | Your own personal activity feed only |

Admins can block personal integrations for security. If your admin doesn't allow personal Gmail to be connected, the entry shows as "Not allowed by admin" in My Integrations.

---

## 11. AI Assistant

Every integration detail page has a **`✨ Ask AI`** button (top right, cyan-purple gradient).

It's not a primary chat surface like in other studios — Integrations is a configuration surface, so the AI assistant is on-demand. Clicking opens a side drawer with:

- A greeting that knows the integration context (name, health, scopes, active capabilities)
- Pre-fab prompt chips
- Streaming character-by-character responses (contextual to that integration)
- 8 contextual answer patterns:
  - "How do I connect this securely?" → recommends OAuth + minimal scopes
  - "What can agents do with this?" → real tool list with code
  - "Show recent activity & issues" → reads audit log + diagnoses
  - "What permissions are needed?" → least-privilege analysis
  - Follow-ups: suggest workflow / compare alternatives / show use cases / best practices

---

## 12. Helix Data Studio handoff

Activating a Data Sync capability **opens the pipe** but does NOT start data flowing. The customer needs to verify the field mapping in Helix Data Studio.

**See it:** `#/integrations/s3/instances/s3-analytics` — this instance is in `partially_configured` state because its Helix mapping hasn't been verified. Click the amber **"Open in Helix Data Studio →"** button to see a mocked Helix mapping drawer with pre-loaded field mappings (src JSONPath → AIMS schema field, with confidence levels).

This handoff is described in §8 of the engineering brief. The drawer here is a stub — the real Helix Data Studio app would render this more richly.

---

## 13. Role / Group picker

When configuring permissions, you can scope an integration to specific roles or groups within each studio.

**See it:** any integration detail → tab **Permissions** → click `+ Add role` on any studio card.

The popover has 3 sections:
- **All members (permissive)** — single option to grant to everyone in that studio (with a "Broad" warning chip)
- **Studio roles** — roles defined inside that specific studio (e.g. Agent Builders, Workflow Admins for Agentic)
- **Workspace groups** — teams that span studios (Sales Pod, Engineering, AI Research)

Member counts on every row answer "how broad is this grant?" before you click. Significant expansions (>15 people total) trigger an amber warning chip.

---

## 14. Status vocabulary

Every instance has one of five states (engineering brief §13.4):

| State | Meaning | Color |
|---|---|---|
| `fully_configured` | Everything works, data flows | Green |
| `partially_configured` | Connected but waiting on something (e.g. Helix mapping pending) | Amber |
| `auth_failed` | Credentials rejected | Red |
| `token_expired` | API key or OAuth token expired, needs renewal | Red |
| `provider_down` | The provider's API is unavailable | Red |

---

## 15. Build your own (v2 Preview)

The Marketplace also lets workspaces add their **own private providers** — give it a name, an icon, declare events/tools/MCPs, pick an auth method, publish to your tenant.

**Three paths:**
- **Webhook builder** — no-code wizard for endpoint-based integrations
- **OpenAPI import** — paste a Swagger spec, auto-generate tools
- **Code SDK** — TypeScript/Python for complex logic

**Important:** Per the engineering brief §11, this is **explicitly out of scope for v1.** It's labeled "Preview · v2" in the prototype. The same UI is designed to serve both AIMS-curated providers and customer-built providers eventually.

---

## 16. What's mocked vs what would be real backend

| Component | Status in this prototype |
|---|---|
| Catalog of 40 providers | Mocked in JS — would come from a `providers` table |
| Instances per provider | Mocked in `PROVIDER_INSTANCES` — would come from a `provider_instances` table per tenant |
| Audit events | Mocked array — would be a real audit log table |
| Execution logs | Mocked array — would be production telemetry |
| Studio usage metrics | Mocked in `STUDIO_USAGE` — would be real telemetry from agent invocations |
| MCP tool discovery | Mocked in `MCP_TOOLS` — would call the MCP server's `list_tools` |
| Helix Data Studio mapping | Mocked drawer — would be a deep-link into the real Helix app |
| AI Assistant responses | 8 hardcoded contextual patterns — would call a real LLM with integration context |
| Auth flows (OAuth popup, etc.) | Simulated with setTimeout — would hit real provider OAuth endpoints |
| Brand logos | Iconify CDN (real assets) + colored-monogram fallback |

---

## 17. Coverage vs the Engineering Brief

The internal brief by Thomas González + Edgardo Sierra has 13 main sections + 6 product questions. This prototype covers:

| § | Concept | Status |
|---|---|---|
| §1 | Mental model | ✅ |
| §2 | Vendor → Provider → Capability → Instance | ✅ (Google + Atlassian split into sub-providers) |
| §3 | Three types: Tool / Data Sync / MCP | ✅ |
| §4 | MCP granular tool activation | ✅ |
| §5.1 | Browse Marketplace | ✅ |
| §5.2 | Activation 6-step wizard | ✅ |
| §5.3 | Per-instance management (Basic / Caps / Auth / Logs / Audit) | ✅ |
| §5.3 | Logs ≠ Audit | ✅ |
| §6 | 3-layer cascading governance | ✅ (visualization) |
| §7 | Multi-tenant vs BYOK | ✅ |
| §8 | Helix Data Studio handoff | ✅ (drawer + mapping mock) |
| §9 | 5 authentication patterns | ✅ |
| §10 | UI Schema rendering | ✅ (declared, with hint in wizard) |
| §11 | Customer-added providers | ✅ (labeled v2 Preview) |
| §13.3 | Editorial "what this unlocks" | ✅ (Snowflake + Slack) |
| §13.4 | Status vocabulary | ✅ |
| §13.5 | Counting usage on card view | ✅ |
| §13.6 | Wizard for ugly auth (manual checklist) | ✅ |

**Open product questions** (not implementation gaps):
- §13.1 — Final naming (we still use "Integrations" as the marketing term, but the technical model uses Vendor/Provider/Capability/Instance internally)
- §13.2 — Linking pattern to Helix Data Studio (we propose drawer + pre-loaded mapping; brief leaves open until Helix UX lands)

---

## 18. Demo script (5-7 minute walkthrough)

For demoing to a stakeholder, navigate in this order:

1. **`#/integrations`** — Show the marketplace. Hover over a few studio filter pills to show the lens. Point out the studio chips on cards.
2. **Click on `Snowflake`** — Detail page with vendor narrative. Show the **Used in** cards (1,247 tables in Governance, 8 queries/day in Agentic, Not enabled in Workforce). Tab **Permissions** → show the 3-layer governance visualization.
3. **Back to `#/integrations` → click `Amazon S3`** — Show the **3 instances** (Production / Dev / Analytics). Point out that the brief's classic example is shipped exactly as described.
4. **Click on `Amazon S3 — Analytics`** — Per-instance page. Show all 5 tabs briefly. Highlight the **amber action-needed banner** about Helix mapping. Click **"Open in Helix Data Studio →"** — show the mapping drawer with confidence chips.
5. **Click the `✨ Ask AI` button** on any integration. Click a suggested prompt (e.g., "What can agents do with this?"). Show the streaming contextual response.
6. **Browse to `#/integrations/sap`** — Click `Connect`. Walk through the **6-step wizard**: naming, then choose `Manual / multi-step checklist` to show the worst-case auth UX with external steps and video walkthrough link.
7. **Tab Permissions** on any integration → click `+ Add role` on a studio card. Show the **role picker popover** with member counts and "Broad" warning on the "All members" option.

That covers the architectural model + the polish layer + the AI moments + the worst-case auth + governance + the differentiated handoff.

---

## 19. Orchestration update (May 2026)

After a working session with Mike Dullea (founder), the prototype was rotated around an explicit thesis:

> Integrations is the **control plane** for an agentic data infrastructure, not just a marketplace.
> Data Studio (Thomas) does the deep field mapping. Integrations orchestrates the lifecycle, surfaces system truth, and gatekeeps usage.

### 3 decisions locked

**1. Browse and Operate coexist with a mode toggle in the topbar.**
Browse is the marketplace surface (discovery, partners, BYO). Operate is the orchestration surface (status, needs attention, setup progress). Same data, different framing. End users default to Browse; admins default to Operate.

**2. Gatekeeping is graduated, not binary.**
- *Warn:* card surfaces a warning, workflows still work
- *Require ack:* workflow author has to acknowledge a banner on click, logged in audit
- *Block:* CTA is visibly disabled with a tooltip explaining why

The gate level is decided by criticality of the broken signal (auth blocks, mapping requires ack, drift warns), not by a `% mapped` metric.

**3. Persona split: Admin view vs End-user view, with a visible toggle.**
Admin sees everything (audit, mapping, schema versions, request inbox). End user sees a stripped-down catalog with only the basics. The toggle lives in the topbar next to the workspace badge.

### Status taxonomy

8 states grouped into 3 visual buckets, surfaced as a single tier-1 chip on each card.

| Bucket | States | Color |
|---|---|---|
| Working | `active`, `ready` | green |
| Needs Attention | `needs_mapping`, `schema_drift`, `auth_expired`, `auth_failed`, `rate_limited`, `provider_down` | amber / red |
| Inactive | `not_connected`, `paused`, `draft` | gray |

Each card shows only the bucket chip. The specific state is surfaced inside the detail page (gate banner + setup progress bar).

### Where to see it in the live prototype

1. Open the prototype. Click **Operate** in the topbar mode toggle. The home becomes a triage view with a Needs Attention tab as the default.
2. Click any row to open the detail. A yellow or red **gate banner** explains the action required.
3. Below the breadcrumb, a horizontal **setup progress bar** shows `Connect → Map → Validate → Publish` with the current step pulsing.
4. Click the **persona pill** in the top-right to toggle End-user view. Audit log and audit tabs disappear from the navigation.
5. Switch back to **Browse** to see the original marketplace. Cards now show a single status bucket chip in the top-right corner.

### Data Studio rebrand

The sub-sidebar now has a dedicated **Data Studio** section containing:

- **Connections** (the surface this prototype builds out, the former "Integrations")
- **Tables** (coming soon, will host Thomas's table definitions)
- **Field mappings** (coming soon, the auto-map + custom-flag UI)
- **Schema versions** (coming soon, history per table)
- **Requests** (live, see below)

Breadcrumbs are now `Settings > Data Studio > Connections > [integration]` instead of the previous `Settings > Integrations > [integration]`. The Browse home hero gained a `Data Studio · Connections` eyebrow that frames the marketplace as one of Data Studio's surfaces, not a standalone product.

This locks the architectural decision from the founder session: **Integrations is the control plane of Data Studio, not a sibling**. Thomas's field mapping engine lives in Data Studio; this prototype is what hands off to it.

### Connect → Map (wizard step 6 of 7)

The activation wizard is now **7 steps** instead of 6. A new step `Map fields` sits between Initial scope and Confirm. It implements Mike's "peanut butter cup" handoff: AIMS auto-maps the standard fields it recognizes, then asks the customer to resolve the custom ones.

Visible sections in the new step:

- **Auto-mapped (N fields)** — collapsible, defaults closed because no action is needed. Shows count with a green checkmark.
- **Needs your attention (N custom fields)** — expanded. Per Mike's Salesforce custom-objects scenario, each row offers three radio options:
  - *Accept AI suggestion* (with a confidence chip: high / med / low)
  - *Create new field* in your AIMS schema, with a derived name preview
  - *Skip this field*
  Salesforce demo includes `pink_fluffy_slippers__c`, `abcd_classification__c` (no suggestion) and `rep_quota_attainment_pct__c` (92% match suggestion).
- **Open Data Studio CTA** — for users who want the full mapping experience, jumps to the Helix drawer.

The Confirm step (now step 7) shows the mapping summary: `N auto-mapped, M custom resolved, K skipped`.

### Request inbox (Mike's "8000 employees" reality)

A new surface for requesting integrations the catalog does not have, with a managed services queue on the other side.

Two entry points:

1. **Catalog home** has a second promo card (amber) below the Build your own promo: "Need something custom? Request it from the AIMS team."
2. **Sub-sidebar** under Data Studio has a **Requests** item with a yellow alert dot when there are pending reviews.

The request form has 5 sections that mirror what Mike sketched in his Claude artifact:

1. Who is asking and for whom (requester, department, scope, business owner)
2. Business intent (free-text use case)
3. Source system (integration name, vendor, action types: read / write / push)
4. Data sensitivity (PII / financial / compliance — radio: no / maybe / yes)
5. Timeline + scale (urgent / 2 weeks / quarter / no rush, # of users)

Submit goes to a confirmation screen with a generated ticket ID, then back to the inbox.

The inbox itself is a queue view with KPI counts (Pending, Quoted, In progress, Delivered), tabs for filtering, and one row per request. Each row shows:

- Status chip with bucket-tinted color
- Priority tag (High priority when urgent)
- Integration name + truncated business intent
- Vendor + action types + PII / financial flags
- Requester avatar + dept + age
- Quoted price + ETA (when applicable)
- Per-status CTA (Review / Approve quote / Track progress / View delivery / View notes)

Mock data ships with 6 requests in different states (pending, quoted, in progress, delivered, rejected) including pricing examples ($2,800 to $18,500) per Mike's "$52,000 for a workflow" framing.

### Spreadsheet as a first-class source

Per Mike's "Ford sends us a spreadsheet every Monday" example:

- **Spreadsheet** is now a featured AIMS-OS card in the Data category of the catalog. Auth method is `manual / multi-step checklist` (drop file or set up an email rule).
- **Build your own** now has a 4th method card titled **From spreadsheet** alongside Webhook, OpenAPI, and Code SDK. Best for "one-off datasets, vendor weekly reports".

These cover the long tail of data sources that don't have an API but matter to the workflow.

---

## 20. Data Studio — onboarding wizard

> Lives in `data-studio.html`. Spec: [`OnboardingFlow.md`](OnboardingFlow.md). Adapted from the standalone `OnboardingFlow.jsx` artifact described in `OnboardingFlow_Documentation.pdf`.

This is the **first-run experience** for Data Studio. A fresh visitor (no localStorage) lands directly on the empty state with a strong CTA to connect their first data source.

### 1-minute demo path

The fastest way to see everything we built:

1. Open **`data-studio.html`**. Sidebar bottom → **"Take the guided tour"**.
2. A 13-step popover walks through: empty state → wizard open → all 6 wizard steps → Done → fresh connection on the dashboard.

### Manual walkthrough

For demoing without the tour:

1. **Empty state.** Hero with 6-step preview + floating cards. Primary CTA "Connect your first source".
2. **Wizard opens.** Centered modal, 960px wide, 6-step progress bar. Resumable: close at any time and re-open continues where you left off.
3. **Step 1 Category.** 7 cards (CRM, project tools, data, marketing, support, custom API, files). Each shows live count of connectors.
4. **Step 2 Connector.** Filtered grid with Popular/Recommended badges and auth method chips.
5. **Step 3 Sign in.** Six auth flavors (OAuth, API key, service account, basic, manual, file upload, email-to-inbox). Each has its own UI. **Inline validation** before submit. Three-state machine: idle → connecting → connected.
6. **Step 4 Preview.** Read-only checkpoint. 4 stat tiles + table of every detected field with type and sample value. Per-connector realistic sample data (HubSpot shows `properties.firstname`, BigQuery shows `event_timestamp`, etc.).
7. **Step 5 Field matching.** AI confidence pills (green ≥90, blue 75-89, amber <75). Bulk "Accept all high-confidence" banner. **Quarantine pattern** for fields with no AI match — held aside with amber stripe and "no AI match" chip, never silently included.
8. **Step 6 Refresh schedule.** 4 cadence cards (Real-time / Hourly / Daily / Manual). Real-time auto-disabled for connectors without webhook support. Incremental sync shows only when timestamp fields are mapped. Recap card at the bottom.
9. **Done screen.** Hero with checkmark, 5-row recap, **3 cross-studio cards**: Build agent tools (Agent Studio), Set who can access (Admin Studio), Add another source.
10. **Click Open Dashboard.** Modal closes. The freshly-created connection appears at the **top of the connections list** with "just now" as last sync.
11. **Click the fresh card.** Opens a synthetic detail page built from your wizard inputs — same code path as the demo connections, with a green banner "X is live — Created via setup".

### Demo controls (sidebar bottom)

| Control | What it does |
|---|---|
| **Take the guided tour** | Launches the 13-step popover walkthrough. |
| **Reset to first time setup** | Wipes wizard state + lastCompleted, returns to empty state. |
| **Show errors** (toggle) | When ON, the next Connect attempt fails with a realistic error message. Cycles through timeout / denied / rate_limit (OAuth), invalid_key (API key), IAM missing (service account), 404 / 401 (manual), malformed_data (file upload). |

### Key features built

| Feature | Where to see it |
|---|---|
| Resumable | Close the modal at step 3 → re-open from "Resume at step 3 of 6" CTA in the empty state |
| AI confidence pills | Step 5 — three colors per confidence range |
| Quarantine over silent inclusion | Step 5 with HubSpot or Asana (both have fields with conf=0) — see the amber banner and parked rows |
| Error states | Toggle "Show errors" in the sidebar → reach step 3 → click Connect → see the error banner with Dismiss + retry path |
| Inline field validation | Step 3 with API key (type "abc") or Service account (paste invalid JSON) — inline error before submit |
| Cross-studio bridges | Done step → 3 cards. "Build agent tools" goes to agent-tools.html, "Set who can access" goes to settings.html |
| Synthetic detail page | After finishing, click the fresh card at the top of the connections list |
| Telemetry | DevTools console + `window.AIMS_DEBUG = true` → see 21 events fire as you walk through |
| Step transitions | Every step body fades+slides on Next/Back. Cards stagger. Reduced motion respected. |

---

## 21. Stack

Zero-dependency vanilla HTML / CSS / JS. ~4.5k lines in a single file. All state in-memory.

- **Brand logos:** Iconify CDN (`logos` set, full color) with monogram fallback
- **Icons:** Inline SVG, no icon library
- **Fonts:** Inter (system fallback)
- **Routing:** Hash-based (`#/integrations/{slug}/instances/{id}`)
- **State:** Plain JS objects (no React, no framework)

This was deliberate — the prototype is meant to be inspectable, hackable, and shareable as a single static asset.

---

*This file documents the design prototype, not the production implementation. For the engineering brief that defines the backend model, contact Thomas González (SVP Engineering) or Edgardo Sierra (Chief Architect).*

## 22. What's new since the May 2026 founder session

Sections 19-21 captured the orchestration thesis sprint. Everything below
landed after — and is in the public prototype.

| Sprint | Surfaces added | Spec / commit ref |
|---|---|---|
| Data Studio · Tables | Library + detail (split layout, 6-tab rail, per-field inspector with 4 sub-tabs, auto-versioning, custom field defs, multi-source) | Tasks #93-98 · ~Tables Phase 1-3 + Prio 1+2 + 6 quick wins |
| Data Studio · Templates | Library + create + detail tree editor + 4-tab rule inspector + sandboxed expression evaluator + cascade preview + versions + apply-to picker | Tasks #99-103 · Templates Phase 1-5 |
| Tenant onboarding | 8-step welcome flow (3 phases) at `#/onboarding` with first-run gating + skip path + return-to-onboarding from wizard | Tasks #104-105, F1-F3 |
| Mike thesis closure | Field Mappings surface (`#/mappings`) + Schema Versions surface (`#/schema`) | Tasks #106-107 |
| Shell alignment | `agentic-studio.html` imported as canonical reference + `docs/SHELL_PATTERN.md` spec + topbar/left-nav normalization | Tasks #112-113 |
| View improvement sweep | 12 surfaces aligned to canonical hero pattern (heroes, cards, tabs, modal, content panels) | Tasks #117-127 |
| Iconography hygiene | All emoji-as-icons replaced with SVG (Templates group icons, onboarding hero, auth methods, audit actors, AI chips) | Tasks #111, design critique pass |
| Mike thesis fix | Admin default mode → Operate (was Browse) | Task #128 |

---

## 23. Data Studio · Tables surface

> Lives in `data-studio.html`. Spec adapted from `TableDefinitions_Documentation.pdf` (Option B — no industry presets, multi-source as documented extension).

The destination layer for everything that comes through Connections. A Table
is a structured set of rows that agents can query, fed by **one or more
connections** (e.g. `customer` from HubSpot + Salesforce).

### Where to see it

- Sidebar → **Tables** (formerly badge "Soon", now live)
- Library at `#/tables` shows the new hero with KPI cards (Tables / Total rows / Errors) + filter pills + per-source filter chips + grid
- Click any card to land on the detail page

### What the detail does

Split layout: **field list on the left**, **6-tab right rail**:

- **Field** (default) — per-field inspector with 4 sub-tabs
  - **Basics:** display name, data type, primary key, nullable, indexed, description
  - **Validation:** declared validations + add new rule (regex, enum, range, etc.)
  - **Transformation:** transforms applied at ingest (lower, trim, format), drag-to-reorder
  - **Custom:** values for tenant-defined custom field defs
- **Sync** — per-source state (status, last sync, events/hr, errors), pause/resume/trigger now, retention controls, sparkline of last 10 sync durations
- **Conn** — source connections feeding this table, per-source actions (Re-auth, Remove from table)
- **Used by** — mock template references using this Table×Field (populated from `MOCK_TEMPLATE_LINES`)
- **Versions** — auto-versioning with 2.5s debounce, restore with backup, schema diff modal before restore
- **Custom fields** — tenant-defined custom field defs (text / number / select / boolean, scoped to fields or both)

### What's wired end-to-end

- Search within fields (with U<n> usage flag)
- Drag-to-reorder transformations
- Schema diff between versions (added / removed / modified columns)
- Cascade preview when deleting a field that's referenced
- Sync timing sparkline
- Telemetry: `tables_detail_viewed`, `field_inspector_*`, `sync_*`, etc.

### What's still open (engineering team)

Documented in commit messages — bulk ops on fields, field categorization,
per-field sync history, retention controls in UI, real ingestion engine,
backend persistence.

---

## 24. Data Studio · Templates (rule packs)

> Re-anchored from the original `TableDefinitions` spec (which described composite financial reporting templates) to a model that fits AIMS-OS: **reusable validation + transformation rule packs**. Sites → workspaces, composite lines → rules, source mapping → applied Table×Field list.

### Where to see it

- Sidebar → **Templates**
- Library at `#/templates` shows the canonical hero (Packs / Applied / Custom / Unapplied KPI cards) + search + 4 system seed packs

### Three seed packs

| Pack | Domain | Rules |
|---|---|---|
| Email & contact data quality | Contact | Format checks, normalization, disposable email filter |
| Currency & financial values | Financial | Non-negative, sanity bound, decimal rounding |
| PII & data privacy | Privacy | SSN/CC detection, redaction |
| Starter pack | General | Empty skeleton with one example rule |

### What you can do

- **Library:** filter by source (System / Cloned / Custom) + domain · search · delete (with safety rails) · click any card to open
- **Create:** starting-point picker (clone a system pack or build from scratch) + name + description + domain
- **Detail editor:** split layout with **recursive tree** (groups → rules) on the left and **4-tab rail** on the right
  - **Inspect** (when a node is selected): rule editor with 4 sub-tabs
    - **Basics:** name, description, ruleType (Validation/Transformation/Enrichment) segmented, severity (Err/Warn/Info), applies-to field type, enabled toggle, tags
    - **Expression:** mono textarea with live structural validator (balanced parens, recognized functions, `value` reference required) + collapsible functions reference panel
    - **Examples:** sample values seeded per field type, each evaluated against the expression via sandboxed `new Function(...)`. Pass/fail for validations, output preview for transformations.
    - **Custom:** tenant-defined custom field def values per rule
  - **Versions:** auto-version on every mutation (debounced 2.5s), restore with backup, full timeline
  - **Usage:** list of {tableName, fieldName} where the pack is applied + 2-step "Apply to a field" picker that reads from real `getAllTables()` output
  - **Settings:** custom field defs CRUD (text / number / select / boolean, scoped to rule / group / both)

### What's clean

- System packs are read-only — Clone & edit CTA in the header creates a custom copy
- Modal system replaces all browser `confirm()` calls
- Delete a group with children shows cascade preview (the affected sub-nodes)
- Telemetry on every meaningful action

---

## 25. Mike thesis closure — Field Mappings + Schema Versions

Two surfaces Mike asked for in the May 2026 session that were left as
`renderPlaceholder()` stubs. Built and shipped.

### `#/mappings` — Cross-connection field mappings

> Tenant-wide aggregation of the wizard step 6 "peanut butter cup" handoff.

- Walks `DS_CONNECTIONS` + `obState.lastCompleted` and flattens every source field across every connection into a unified inventory
- 5 buckets: auto / needs review / accepted / custom (created) / skipped
- KPI strip with semantic tints
- Search by source field, target field, or connection
- Filter pills by status + per-connection sub-pills
- Grouped by connection (Salesforce / Stripe / GitHub / etc.)
- **Resolve** action on each "Needs review" row → opens drawer with 3 radio options (Accept AI suggestion with confidence, Create new field, Skip)
- Decisions persisted to `aims_ds_field_mapping_decisions` + mutated in-memory `DS_CONNECTIONS[slug].events[i].custom[j].decision`

### `#/schema` — Schema versions timeline

> Tenant-wide aggregator of every Table version captured anywhere in the system.

- Reads from `tableVersions[tableName]` (populated by the Tables Phase 3+ auto-versioning system)
- Flat timeline newest-first, grouped into Today / Yesterday / This week / This month / Older
- KPI strip: Total versions / This week / This month / Tables touched
- Filter by date range + per-table filter pills (auto-built)
- Search by label / table / author
- Click any row → navigates to that Table's detail with the Versions tab pre-selected for one-click restore

---

## 26. Tenant onboarding — the 8-step welcome

> Lives at `#/onboarding` in `data-studio.html`. Replaces the previous placeholder. The flow is the first thing a fresh tenant sees on first run.

### The flow

**Phase 1 — Tenant setup (first-run only):**

1. **Welcome** — step list preview + "Have ready" checklist
2. **Organization** — name, primary industry, size, primary contact (name / role / email) with email-format validation
3. **Starter setup** — pick from 4 cards: Data-quality first / Governance first / Agentic first / Minimal
4. **Workspace grouping** — pick strategy (by department / region / function / flat) + tag chips editable

**Phase 2 — Per workspace:**

5. **Workspace profile** — name, group, region, owner contact
6. **Connect data** — opens the existing 6-screen Connect Data wizard inline (Category → Connector → Auth → Preview → Mapping → Sync). On Done, returns to onboarding step 6 with success state.
7. **Apply templates** — reads real Tables from `getAllTables()`, suggests real Templates from `tplLibrary` via field-name heuristics with confidence scoring. Accept actually mutates `tpl.appliedTo`.

**Phase 3:**

8. **Done** — hero with summary stats + 4 next-step cards (Add another workspace, Open Data Studio, Open Admin Studio, Invite team [disabled])

### Add-workspace flow

Skips Phase 1 — starts at step 5 (Workspace profile) and runs 4 steps.

### First-run gating (F1)

A fresh user landing on `#/templates` or `#/tables` is auto-redirected to
`#/onboarding`. The landing has a "Skip — I'll explore on my own" CTA that
sets `tonbState.skipped = true` and never gates again.

### Wizard return-to-onboarding (F2)

The Connect Data wizard's Done screen shows a primary "Continue tenant
onboarding →" CTA when launched from the onboarding flow (instead of the
default "Open Data Studio dashboard"). Closing the wizard modal mid-Done
also routes back to `/onboarding`.

### Tour (F3)

The Data Studio guided tour (sidebar "Take the guided tour") now walks
through 18 steps including the 4 new surfaces and the tenant onboarding
landing.

---

## 27. Design system alignment

After May 2026, the prototype drifted: each studio reinvented its shell,
~50 pill/tag/badge classes accumulated, and heroes used inconsistent
spacing and colors. This sprint pulled it back together.

### Source of truth: agentic-studio.html

The canonical AIMS-OS shell pattern lives in `agentic-studio.html`
(imported from the internal CLAUDE mirror in this sprint). Spec is
documented in [`docs/SHELL_PATTERN.md`](SHELL_PATTERN.md) — covers
sidebar (52→220px collapsible with labels), topbar (ctx-menu, gear-menu,
notif-menu, avatar-menu primitives), CSS variables (`--shell-*`),
theming, and a migration checklist.

### View improvement sweep (12 surfaces)

Every prominent hero / card / tab / modal aligned to the same DS palette:

| Layer | Surfaces aligned |
|---|---|
| Heroes (8) | Operate (Admin), Integration detail (Admin), Templates library (Data), Connections home (Data), Requests inbox (Admin), Tables library (Data), Field Mappings (Data), Schema Versions (Data) |
| Cards | Marketplace integration cards (`.mkt-card`) |
| Tabs | Generic `.tabs` / `.tab` primitive |
| Content | Integration detail Overview tab (capability cards, used-in list, side kv panel) |
| Modal | Connect Data wizard modal |

Consistent tokens applied across all 12:

- **Color palette:** `#34d39c` (ok) · `#fbbf24` (warn) · `#7ed3f7` (cyan accent) · `#cda5ff` (purple) · `#ff7d7d` (red) · `--t3` (idle)
- **Alphas:** 0.04 / 0.06 / 0.08 / 0.28 for backgrounds / borders / tinted surfaces
- **Green pulse dot:** `#10b981` + `0 0 0 2px rgba(16,185,129,0.18)` ring — used for "Updated just now" timestamps
- **Title scale:** 26-28px hero, 24px detail
- **Primary CTA gradient:** amber for "Resolve N issues →" / cyan for "+ New"

### Iconography hygiene

The earlier design-critique pass removed every emoji-as-UI-icon:

- 10 Templates group icons (💰📊👥🏢...) → SVG stroke 14×14
- Onboarding hero ✨ + 🎉 → branded SVGs
- Sync history ✓ / ✕ → SVG check/cross
- 6 auth method icons in wizard step 2 → SVG (lock / key / doc / user / users / clipboard)
- 8 AI assistant suggestion chips → SVG
- aria-label added to icon-only buttons

Emojis in conversational content (AI chat bodies, toasts) intentionally
kept — they're text content, not icons.

### Mike thesis fix — admin default mode

`docs/DEMO.md` section 19 said *"End users default to Browse; admins
default to Operate."* The implementation was defaulting everyone to
Browse. Fixed: fresh admin now lands on Operate (triage view, "N need
attention" hero) on first run. Explicit user choice via localStorage is
always respected.

---

## 28. Extended demo script v2 (10-12 minutes)

Updated walkthrough including the new surfaces.

1. Open `index.html` → click **Data Studio** card → land on `#/onboarding`
   (if no `aims_ds_tenant_onboarding_v1` in localStorage)
2. Walk through 8 onboarding steps:
   - Welcome → Organization → Starter setup → Workspace grouping →
     Workspace profile → Connect data ("Continue with mock data") →
     Apply templates → Done
3. From Done → click **"Open Data Studio"** → land on `#/connections`
4. Browse: cards in Active state, click **Salesforce** → connection detail
5. Sidebar → **Tables** → click `customer` → see split layout with right rail
   - Click any field → inspect across 4 sub-tabs
   - Versions tab → see auto-versioning timeline
6. Sidebar → **Templates** → click `Email & contact data quality` (read-only system pack) → **Clone & edit →**
   - Rename via inline click → edit description
   - Click any rule → 4 sub-tabs (Basics / Expression / Examples / Custom)
   - Examples tab: see real pass/fail evaluation
   - Usage tab → **Apply to a field** → 2-step picker → apply
7. Sidebar → **Field mappings** → see cross-connection inventory
   - Filter to "Needs review" → click **Resolve** on any custom field
   - Pick "Accept AI suggestion" → confirm
8. Sidebar → **Schema versions** → see the timeline aggregating all Table
   edits made today, grouped by Today / Yesterday / This week
9. Switch to **Admin Studio** via the studio switcher dropdown (top-left)
10. Click **Operate** in the topbar mode toggle (admin default) — see
    "N need attention" hero + KPI cards + primary CTA "Resolve N issues →"
11. Click the primary CTA → filter to needs-attention bucket → click a row
    → integration detail with the new eyebrow row + pill meta
12. Top-right **gear icon** — toggle theme dark/light

End result: every surface in the prototype touched in 12 minutes.

---

*Last updated: 2026-05-29*
*Working tree: 18+ commits since the May 2026 founder session covering
Tables, Templates, Tenant onboarding, Field Mappings, Schema Versions,
shell alignment, 12 view improvements, iconography normalization, and
the admin default mode fix.*
