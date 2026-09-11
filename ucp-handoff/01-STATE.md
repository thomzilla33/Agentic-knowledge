# 01 - Current state

## Source of truth

| | What it is | Status |
|---|---|---|
| **Live prototype** | https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts | **This is the reference.** All 21 tickets point here |
| Historical build, list | https://thomzilla33.github.io/Agentic-knowledge/ucp-contacts.html | A record of where this started. Superseded |
| Historical build, experiment | https://thomzilla33.github.io/Agentic-knowledge/ucp-entity-workspace.html | A record of where this started. Superseded |
| Figma | https://www.figma.com/design/ZC49wFfu7IA9orIF6SGKdr/Unified-Customer-Profile?node-id=7292-253451 | Entity header and base layout |
| Visual handover | https://claude.ai/code/artifact/06448a5c-ae51-45a4-9f81-cd193dcc44be | A six-step walkthrough of the prototype |
| **Intelligence and Knowledge brief** | https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a | **For Lex and JJ.** Why those two tabs are a different kind of problem |
| Screenshots | `screenshots/` in this folder | Seven captures from the live prototype, used in every ticket |

---

## What happened to our work

Our code reached the design system repository (`cachilupis/aims-os-design-system`) and is deployed on Vercel. I verified it by exact strings in the bundle: `No people on this account`, `publishes a different set of facets`, `Account owner`, `Headquarters`, `Employment` - all ours.

But someone carried it considerably further. What is deployed today, verified by rendering it rather than by reading the bundle:

| What we left | What is on Vercel today |
|---|---|
| List with 3 types | ENTITIES rail with **5**: Customers 7, Employees 4, Companies 5, Policies 2, Assets 2 |
| Overview plus studio tabs | **Overview, Activity, Intelligence, Knowledge**, plus **People** on companies |
| - | Activity with chips `All / Communications / Notes / Events / Tasks`, status and period filters, grouped by day, with a per-row AI summary |
| - | A `KNOWLEDGE` widget on Overview: 5 Truth / 3 Sandbox / 3 Sources |
| - | `CONNECTIONS` including assets (`AST-2290 Service loaner`, `AST-2314 Diagnostic rig`) |
| - | Intelligence with `SUGGESTIONS - 3 - Sorted by impact x urgency` and the **`Held`** state |

A record's header reads: `Renewal in 28 days - 11 facts - 4 stores - 41 open - Tier 1`.

> **Method note.** The session proxy cannot reach Vercel with a headless browser. I pulled the assets with `curl` and served them on a local port to render them. Everything above was seen on screen, and the screenshots in `screenshots/` were captured that way.

---

## The two unresolved inconsistencies

Both are in the live prototype, on the same record. Close them with whoever carried it forward before engineering builds.

### 1. Sources vs Drives: the same plane with two names

The Overview's `KNOWLEDGE` widget calls the third section **Sources**. The Knowledge tab calls it **Drives**.

Resolution according to the canon (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`): the **plane** is called *Sources*; the *Source Drives* are the container, folders and documents from the company's shared drives, that feeds it. Which means **the Overview is right and the tab is misnamed.**

Recorded as blocking in ARP-1419 and tracked as its own decision ticket, ARP-1425.

### 2. The assistant was made generic

Our `assistantLabel` prop produced `Ask about this company` on companies. In the live prototype the button reads `Ask about this entity` on every type; the per-type variant does not appear in the bundle.

It may be a deliberate simplification. It is not documented anywhere, so ask rather than assume.

---

## What is real and what is mocked

| | Status |
|---|---|
| All prototype data | **Mocked.** Fixtures in the design system repo |
| The entity types | Mocked, but the model that publishes them is real |
| Permissions and masking | Simulated with `VIEWER_SCOPES`, a fixed array of three scopes |
| AI summaries and suggestions | Fixed text. There is no engine behind them |
| The `Held` state | Real UI behaviour, governance policy **unconfirmed** |
| Pagination, filters, search | Real, over the fixtures |
| Create via stepper | A panel with fields; the step-by-step stepper **does not exist yet** |

---

## State in Jira

**Boulder:** [ARP-375 - Universal Entity Profile](https://aims-os.atlassian.net/browse/ARP-375) - *Selected for Development*, renamed on 2026-09-11, previously "Unified Contact Profile".

All 21 descriptions were rewritten on 2026-09-11 into the five-section template that Work Queues uses (ARP-927 and its children), so both trees read as one house style. The full text is in [`07-TICKETS-FOR-DELIVERY.md`](07-TICKETS-FOR-DELIVERY.md).

| Key | Ticket | Type | Version |
|---|---|---|---|
| [ARP-1406](https://aims-os.atlassian.net/browse/ARP-1406) | List: entity list, pagination and creation | Feature | v2.0 |
| [ARP-1409](https://aims-os.atlassian.net/browse/ARP-1409) | List by type | Version | v2.0 |
| [ARP-1410](https://aims-os.atlassian.net/browse/ARP-1410) | Pagination | Version | v2.0 |
| [ARP-1411](https://aims-os.atlassian.net/browse/ARP-1411) | Create via stepper | Version | v2.0 |
| [ARP-1412](https://aims-os.atlassian.net/browse/ARP-1412) | Access & Permissions: List | Version | v2.0 |
| [ARP-1407](https://aims-os.atlassian.net/browse/ARP-1407) | Profile: tab contract, Overview and Activity | Feature | v2.0 |
| [ARP-1413](https://aims-os.atlassian.net/browse/ARP-1413) | Tab contract and industry extension | Version | v2.0 |
| [ARP-1414](https://aims-os.atlassian.net/browse/ARP-1414) | Overview | Version | v2.0 |
| [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) | Activity | Version | v2.0 |
| [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) | Notes | Version | v2.0 |
| [ARP-1417](https://aims-os.atlassian.net/browse/ARP-1417) | Access & Permissions: Profile | Version | v2.0 |
| [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) | Intelligence and Knowledge - **Lex and JJ** | Feature | v2.1 |
| [ARP-1418](https://aims-os.atlassian.net/browse/ARP-1418) | Intelligence, the tab | Version | v2.1 |
| [ARP-1419](https://aims-os.atlassian.net/browse/ARP-1419) | Knowledge, the tab | Version | v2.1 |
| [ARP-1420](https://aims-os.atlassian.net/browse/ARP-1420) | Access & Permissions | Version | v2.1 |
| [ARP-1421](https://aims-os.atlassian.net/browse/ARP-1421) | Inference engine (new) | Version | v2.1 |
| [ARP-1422](https://aims-os.atlassian.net/browse/ARP-1422) | Claims pipeline (new) | Version | v2.1 |
| [ARP-1423](https://aims-os.atlassian.net/browse/ARP-1423) | Decision: the `Held` state (new) | Version | v2.1 |
| [ARP-1424](https://aims-os.atlassian.net/browse/ARP-1424) | Decision: inference leakage (new) | Version | v2.1 |
| [ARP-1425](https://aims-os.atlassian.net/browse/ARP-1425) | Decision: Sources vs Drives (new) | Version | v2.1 |
| [ARP-1426](https://aims-os.atlassian.net/browse/ARP-1426) | Decision: claim promotion (new) | Version | v2.1 |

A note on the issue type. Jira's hierarchy here is Boulder (level 3), Feature (level 2), Version (level 1), Story or Bug (level 0). The level-1 type is called Version in Jira and "Sub Feature" in conversation. When creating one, always pass `Version`.

**Links created:** ARP-1407 *blocks* ARP-468; each Access and Permissions companion *relates to* its Feature.

**Status.** ARP-1406, ARP-1407 and ARP-1408 have moved from Backlog to "Draft Boulder"; the other eighteen are still in Backlog. Nobody moved them by hand from this side, so either an automation fires on edit or someone is working the board. Worth confirming. None of the 21 is estimated, deliberately: they do not enter a sprint until the team estimates them and the items in [`06-OPEN-ITEMS.md`](06-OPEN-ITEMS.md) are closed.

**Pre-existing tickets I did not touch:**

| Key | What it is | Note |
|---|---|---|
| ARP-376 | UCP v1, facelift | Done |
| ARP-468 | Feature, *Selected for Development* | Has **8 sub-features** of its own (ARP-502 to ARP-510) |
| ARP-520 | Feature, `{Test}`, Backlog | Has **7 sub-features** of its own (ARP-521 to ARP-527). **Not an empty duplicate** - it is a cleaner breakdown than ARP-468's. See `06-OPEN-ITEMS.md` |
