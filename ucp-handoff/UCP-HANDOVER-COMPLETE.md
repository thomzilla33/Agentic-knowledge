# UCP - Universal Entity Profile: complete handover

**Author:** Thomas Gonzalez. **Date:** 2026-09-11. **Boulder:** [ARP-375](https://aims-os.atlassian.net/browse/ARP-375)

Everything needed to pick the Universal Entity Profile up where it was left: what is built, where it lives, why each decision was made the way it was, all 21 Jira tickets in full, and what is still open.

This single file is the whole package. The same content is split across seven files in `ucp-handoff/` on branch `claude/ucp-vista-actualizada-431vm5` of `thomzilla33/agentic-knowledge`.

**Live prototype:** https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts

---

## Before anything else

1. **The live prototype is not our GitHub Pages build.** It is deployed on Vercel and someone carried it further than our branch. All 21 tickets point there, and each one embeds the screenshot of the surface it describes.
2. **Today's delivery (UCP v2.0)** covers Contacts, Employees and Companies: the list, pagination, creation via stepper, and the two mandatory profile tabs.
3. **Intelligence and Knowledge are the real open work**, and they belong to **Lex Paniagua and Julian Johnston**. Unlike Overview and Activity they have nothing to read from: they need an inference engine and a claims pipeline that did not exist in the tree. Four decisions block the build, and each is now its own ticket.
4. **21 tickets** under ARP-375, none estimated. All 21 descriptions follow the five-section template Work Queues uses.
5. **One question is open for the team:** which of ARP-468 or ARP-520 is live.

---

## Contents

| # | Section | What it holds |
|---|---|---|
| 1 | [Current state](#1-current-state) | Where everything is today: prototypes, repos, branches, Jira. What is real and what is mocked. The two unresolved inconsistencies |
| 2 | [Decisions and why](#2-decisions-and-why) | Every product decision with the argument holding it up, including the ones that were reversed |
| 3 | [The 21 tickets](#3-the-21-tickets-and-why-each-one-exists) | Each ticket's Jira key, its level in the hierarchy, and why it exists |
| 4 | [Edgardo Sierra's review](#4-edgardo-sierras-review) | 40 observations, of which exactly one changed anything in the UCP |
| 5 | [Technical replication](#5-technical-replication) | How to rebuild the prototype on another branch, and the design system rules you will hit |
| 6 | [Open items](#6-open-items) | What is still open, with the name of whoever can close it |
| 7 | [Delivery pack](#7-delivery-pack-all-21-tickets-in-full) | All 21 tickets in full, in the Work Queues template. **This is the section for JJ and Lex** |

Screenshots referenced throughout live in `ucp-handoff/screenshots/` and are embedded in every Jira ticket.


---

# 1. Current state

### Source of truth

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

### What happened to our work

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

### The two unresolved inconsistencies

Both are in the live prototype, on the same record. Close them with whoever carried it forward before engineering builds.

#### 1. Sources vs Drives: the same plane with two names

The Overview's `KNOWLEDGE` widget calls the third section **Sources**. The Knowledge tab calls it **Drives**.

Resolution according to the canon (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`): the **plane** is called *Sources*; the *Source Drives* are the container, folders and documents from the company's shared drives, that feeds it. Which means **the Overview is right and the tab is misnamed.**

Recorded as blocking in ARP-1419 and tracked as its own decision ticket, ARP-1425.

#### 2. The assistant was made generic

Our `assistantLabel` prop produced `Ask about this company` on companies. In the live prototype the button reads `Ask about this entity` on every type; the per-type variant does not appear in the bundle.

It may be a deliberate simplification. It is not documented anywhere, so ask rather than assume.

---

### What is real and what is mocked

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

### State in Jira

**Boulder:** [ARP-375 - Universal Entity Profile](https://aims-os.atlassian.net/browse/ARP-375) - *Selected for Development*, renamed on 2026-09-11, previously "Unified Contact Profile".

All 21 descriptions were rewritten on 2026-09-11 into the five-section template that Work Queues uses (ARP-927 and its children), so both trees read as one house style. The full text is in [section 7](#7-delivery-pack-all-21-tickets-in-full).

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

**Status.** ARP-1406, ARP-1407 and ARP-1408 have moved from Backlog to "Draft Boulder"; the other eighteen are still in Backlog. Nobody moved them by hand from this side, so either an automation fires on edit or someone is working the board. Worth confirming. None of the 21 is estimated, deliberately: they do not enter a sprint until the team estimates them and the items in [section 6](#6-open-items) are closed.

**Pre-existing tickets I did not touch:**

| Key | What it is | Note |
|---|---|---|
| ARP-376 | UCP v1, facelift | Done |
| ARP-468 | Feature, *Selected for Development* | Has **8 sub-features** of its own (ARP-502 to ARP-510) |
| ARP-520 | Feature, `{Test}`, Backlog | Has **7 sub-features** of its own (ARP-521 to ARP-527). **Not an empty duplicate** - it is a cleaner breakdown than ARP-468's. See section 6 |

---

# 2. Decisions and why

Every decision with the reason that holds it up. If anyone wants to reverse one, this is the argument they have to knock down.

---

### A. Profile architecture

#### The tab strip is a contract, not a screen

It is defined **once** and every published entity receives it: `Overview / Activity / Intelligence / Knowledge`, plus industry modules at the end.

**Why:** the alternative is someone deciding by hand which tabs each type gets. With three types that holds; with vehicles, dealerships, policies, assets and whatever each industry brings, it does not. And it produces profiles that navigate differently by type, which is exactly the problem a *unified profile* exists to solve.

**Consequence:** adding a fifth base tab is a contract change, not a feature. And this **blocks ARP-468**: you cannot build the widget canvas without knowing where it lands.

#### Overview is the only customisable tab

The other three are fixed.

**Why:** Overview answers "what should I be looking at here", and that changes with each person's work. Activity, Intelligence and Knowledge answer questions with a single correct answer - what happened, what the AI inferred, what we are sure of. Customising those only produces incomplete versions of the truth.

#### Industry modules go after Knowledge, never interleaved

**Why:** if a pack can insert itself among the base tabs, a user working two industries sees two different navigations. A stable order is worth more than local relevance.

#### Each Overview widget loads and fails on its own

**Why:** a canvas that waits on the slowest widget feels broken even when it works. And a failing widget must not take the screen with it: the user can still work with the rest.

#### The type's own widget goes before the studio widgets

**Why:** it answers "what is this". That reads before "how sure are we about this".

---

### B. Naming

#### Activity (this view) vs Audit (the governance one)

They are named differently because they are different things, with different audiences.

| | Activity | Audit |
|---|---|---|
| Answers | What is happening with this entity? | Who changed what, when, from where? |
| Read by | whoever works the record | compliance and security |
| Contains | communications, notes, events, tasks | system events with IP, session ID, before and after |

**Why Activity was not renamed to Timeline, History or Log:** **pending tasks** break every past-tense candidate. An assigned task is not history, it is work. A past-tense name lies about a quarter of its content.

**What Edgardo said** - "always leave Activity last" - refers to the **audit log**, not to this view. Confirmed by reading the surrounding transcript. The recommendation is to rename *that one* to Audit so the two stop colliding.

#### `Next Best Action`, not `AI Read`

**Why:** *AI Read* describes who produced it. *Next Best Action* describes what to do with it. The user does not need to know a model wrote it; they need to know what comes next.

**A deliberate edge case:** with no next best action, **there is no card**. Not empty, not filled with placeholder text. The absence is the signal - if there were something to do, it would be there.

#### The tag for the `person` type reads **Customer**, not "Person"

**Why:** it describes what the record is in the business, not what kind of object it is in the data model.

#### The module is called **Universal Entity Profile**

ARP-375 was renamed on 2026-09-11 from "Unified Contact Profile" to **"Universal Entity Profile"**.

**Why:** the module stopped being about contacts - the live prototype already lists policies and assets.

**Why that name and not another:** four variants were in circulation, and the decision was to converge on the one the team had already chosen rather than invent a fifth.

| Name | Where it lived |
|---|---|
| Unified **Contact** Profile | ARP-375, the docs in this repo |
| Unified **Customer** Profile | the Figma file, `AUDIT.md` |
| **Universal Entity** Profile | **ARP-468 and ARP-520**, the platform tickets |
| **UCIH** | inside the body of ARP-375's description |

ARP-468 is titled literally `UCP v2 - Universal Entity Profile Foundation`. That is the team's most recent decision, and it is what we converge on.

**The `UCP` acronym stays.** All 21 tickets keep their `UCP v2.0 /` prefix, exactly as ARP-468 already does. Changing it to `UEP` would cost 22 edits, orphan ARP-376 (`UCP v1`) and misalign ARP-468, which is not ours. The name and the acronym can diverge at no cost - they already do.

> **Discarded:** "Unified Entity Profile", which was this package's first proposal. It kept the "U" for Unified but introduced a fourth name, different from the one ARP-468 and ARP-520 already used. Converging was worth more than keeping the adjective.

> **Unresolved:** the body of ARP-375 calls the module **"UCIH"**, an acronym that appears nowhere else. Left untouched - it is someone else's text and may mean something we do not know.

#### Sources is the plane; Source Drives is what fills it

The canon's three planes: **Truth** (100%, verified facts), **Sandbox** (around 80%, pending claims), **Sources** (around 60%, raw documents).

**Why it matters:** the live prototype confuses them - the Overview says *Sources* and the tab says *Drives*. The canon rules: the plane is Sources, and the Source Drives are the folders and documents from the company's shared drives that feed it. See [section 1](#1-current-state) and ARP-1425.

---

### C. List and filters

#### Filters are per type, with counts

Each type publishes its own set of facets: a customer filters by account, an employee by department, a company by industry. Chosen by **frequency of use**, per `docs/FILTERS_SPEC.md`.

#### An option with zero results is disabled, not removed

**Why:** an option that disappears tells the user it does not exist. A disabled one with a zero count tells them it exists and their current filter emptied it. The second is information; the first is noise.

#### Changing type clears the filters and says so

**Why:** facets are not the same across types. Dragging a "department" filter into a list of companies produces results nobody asked for. They are cleared - and the clearing is stated, so the user does not think the filter is still applied.

#### Never an empty state and pagination at the same time

A design system rule. They are two contradictory messages: "there is nothing here" next to "page through it".

#### The CTA names what it will create

*Create New Customer / Employee / Company*, following the active type. Not a generic *Create*.

---

### D. Permissions and governance

#### A governed record is listed, marked. It is not hidden

**Why:** the record's existence is rarely the secret; its values are. Hiding it stops the user knowing it exists and asking for access. Marking it tells them which permission would open it.

#### Disabled with a tooltip, not hidden

Hiding is reserved for **three cases**: purchases, billing, and platform-level irreversible actions.

> **This decision reverses an earlier one of mine.** I had argued the create button should be hidden without permission, "because creating is not an action worth advertising to someone who cannot do it". That is wrong: creating a record is none of the three cases. The ticket audit caught it and it was corrected in ARP-1411 and ARP-1412. **If anyone proposes hiding it again, this is the argument they have to knock down.**

#### Tooltip copy is written once

It lives in ARP-1412 and ARP-1417. **Why:** without canonical copy, each developer invents their own and the platform ends up with five wordings for the same thing.

#### A permission that cannot be verified is translated into what the user sees

Never `deny by default` as an acceptance criterion. QA cannot build a test out of security jargon.

> Not this: "When the permission cannot be verified, nothing executes - deny by default."
> This: "When the platform cannot confirm a user's permissions, the user sees no record content and sees a message explaining that they should retry or contact their administrator."

The behaviour is the same. The difference is that the second is verifiable.

#### A governed value is masked inside the widget; the widget stays visible

**Why:** hiding the whole widget tells the user less than they need. They see the field, its label, that it is locked, and which permission opens it.

> **A real bug this prevented:** in one version of the prototype a vehicle's price was masked in the header and **visible** in the commercial widget. The cause was that each surface declared masking on its own. It was unified: both now derive from the same predicate (`viewerScopes.ts`), so granting the scope uncovers both or neither.

---

### E. Delivery scope

#### Only Contacts, Employees and Companies

**Why:** they are the three types that exist in production today. The rest arrive with the type platform (ARP-468), and pulling them in now forces us to build the type catalogue before we have a profile that works.

#### Intelligence and Knowledge are created now, and are no longer tagged as a later round

**Why:** if only the Overview and Activity tickets exist, somebody will build a two-tab profile and believe they are finished. The tickets exist so the contract reads complete from the board.

The `[Next Round]` tag was removed on 2026-09-11: this is active work for Lex and JJ. Priority stays at P2 so it does not compete with the v2.0 delivery.

#### The delivery is structured as Features under the existing Boulder

No new Boulder was created. **Why:** ARP-375 is already the UCP's Boulder and already has ARP-376 (v1, Done) hanging off it. A new Boulder would split the module's history in two.

**Separately, and unresolved:** ARP-468 and ARP-520 are two different breakdowns of the same platform, with 8 and 7 sub-features respectively. One of the two is surplus. If their blocks also deserve to be Features, the parent would have to be a Boulder - but that is a size judgement, not a mandatory correction: today they are `Version`, which is legal. See [section 6](#6-open-items).

#### The ticket template follows Work Queues

All 21 descriptions were rewritten into the five-section template that ARP-927 and its children use: Prototype Link, User Story, Description, Scope and Acceptance Criteria, Parent Feature Reference. Features add a Sub Feature Breakdown and point at a Parent Boulder.

**Why:** two canonical templates were in circulation, the five-section one from the `jira-arp-ticket-creator` skill and a thirteen-section one from `aims-os-prd-to-tickets`. Work Queues settles it: the five-section one is the house standard, and ours was the outlier. Same tree, one reading experience.

---

### F. Smaller interface decisions, with their reason

| Decision | Why |
|---|---|
| The entity header is pinned on scroll | Otherwise the user loses sight of whose record they are reading |
| The row menu opens to the left | It was clipping against the right edge |
| Avatars for customers and employees; an icon for companies | A company has no face |
| The next-best-action card is the size of its text | A fixed-height card with two lines inside reads as a layout error |
| The type catalogue is a dropdown with a search field, not a slide-out | A slide-out to pick from a list is disproportionate. "See all" opens a marketplace-style modal |
| "Browse all N types" is pinned to the foot of the dropdown | The one row that leads somewhere else was the one you had to scroll to find |
| The studios are still called "studios" | Edgardo proposes renaming them to **Apps**. Unresolved - see [section 4](#4-edgardo-sierras-review) |

---

# 3. The 21 tickets, and why each one exists

**21 tickets** under the Boulder [ARP-375 - Universal Entity Profile](https://aims-os.atlassian.net/browse/ARP-375), none estimated. The 15 originals from 2026-09-11, plus 6 created the same day on finding that the tree covered nothing that feeds Intelligence and Knowledge.

The full text of all 21, in the template they now carry, is in [section 7](#7-delivery-pack-all-21-tickets-in-full).

### The ARP hierarchy, so nobody gets it wrong creating more

```
Boulder   (level 3)   <- ARP-375
  Feature (level 2)   <- ARP-1406, ARP-1407, ARP-1408
    Version (level 1) <- what we call "Sub Feature". NOT the product version
      Story / Bug (level 0)
```

**A Feature cannot contain another Feature.** Its children can only be `Version`. When creating one through the API, always pass `Version`; "Sub Feature" is rejected.

### Product versions

| Version | Contents | Status |
|---|---|---|
| UCP v1 | ARP-376, facelift | Done |
| **UCP v2.0** | ARP-1406 and ARP-1407 with their children, 11 tickets | **This delivery** |
| UCP v2.1 | ARP-1408 with its children, 10 tickets | Active, P2 |
| - | ARP-468, type platform, canvas, widgets, packs | Separate |

**Labels:** `ucp-v2-0` on the eleven, `ucp-v2-1` on the ten, `access-permissions` on the three companions, `decision` on the four decision tickets.

---

## Feature 1 - [ARP-1406](https://aims-os.atlassian.net/browse/ARP-1406) - List

> **Why it exists:** the unified profile has no front door. Without a list to open a record from, the profile is a screen nobody reaches.

#### [ARP-1409](https://aims-os.atlassian.net/browse/ARP-1409) - List by type
The list, and the point any profile is opened from. **Why it is its own ticket:** it concentrates the rules for what a row shows and how a governed record is marked, decisions that apply to every type.

#### [ARP-1410](https://aims-os.atlassian.net/browse/ARP-1410) - Pagination
**Why it is its own ticket:** it carries a rule that breaks on its own if buried inside the list ticket - never an empty state and pagination together - and a reset that has to fire at four different points (type, filter, sort order, page size).

#### [ARP-1411](https://aims-os.atlassian.net/browse/ARP-1411) - Create via stepper
**Why it is its own ticket:** it is the only creation flow and has its own error model (nothing entered is lost).
**Corrected in review:** the criterion said "goes to the list **or** to the profile" - QA cannot decide which. It now goes to the new record's profile. And the create button moved from hidden to **disabled with a tooltip**.
**Open items:** the stepper frames, duplicate detection, confirmation on cancel.

#### [ARP-1412](https://aims-os.atlassian.net/browse/ARP-1412) - Access & Permissions
**Why it exists:** no Feature enters a sprint without its companion. This is where the platform's **canonical tooltip copy** lives.

---

## Feature 2 - [ARP-1407](https://aims-os.atlassian.net/browse/ARP-1407) - Profile: tab contract, Overview and Activity

> **Why it exists:** it fixes the tab contract every published entity receives, and delivers the two mandatory tabs.
> **Blocks [ARP-468](https://aims-os.atlassian.net/browse/ARP-468)** - you cannot build the canvas without knowing where it lands.

#### [ARP-1413](https://aims-os.atlassian.net/browse/ARP-1413) - Tab contract and industry extension
Not a screen: it is the component every profile screen mounts. **Why it is its own ticket:** it is the piece that blocks ARP-468, and mixing it into Overview would hide that dependency.
**Open item:** what happens when industry modules overflow the width.

#### [ARP-1414](https://aims-os.atlassian.net/browse/ARP-1414) - Overview
The configurable dashboard. **Depends on ARP-468** for the canvas and widget runtime; this ticket defines the behaviour on top of that canvas.
**The best of the set** per the audit, with no open items. What saves it is that states are specified per widget, not per screen.

#### [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) - Activity
Communications, notes, events and tasks in one thread.
**Why the criteria close per activity kind:** the four sources will not be ready at once. The ticket allows phased delivery without being left half-done.
**Open item, and it carries design weight:** pending tasks are not the past. Mixing them into a chronological thread puts two reading modes together. Proposal: pin them above. **It is the only open item that changes the design of a mandatory tab** - close it first.

#### [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) - Notes
> **The most fragile piece of the delivery.** It is the profile's only write flow, and the prototype only covers how notes are **read**, not how they are **written**.

**Corrected in review:** criterion 2 depended on an open item inside the same ticket (does the field disappear or is it disabled for a non-owner?). Closed: **disabled with a tooltip**.
**Still missing:** the design of the composer. It cannot be estimated without that.

#### [ARP-1417](https://aims-os.atlassian.net/browse/ARP-1417) - Access & Permissions
Who sees each tab, who assembles their Overview, who writes notes. With the profile's tooltip copy.

---

## Feature 3 - [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) - Intelligence and Knowledge

> **Owners: Lex Paniagua and Julian Johnston.** [Dedicated brief](https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a) - read it before picking up any child.

**Why this is the real open work:** Overview and Activity **read** sources that already exist. Intelligence and Knowledge need something to **produce** their content first, and that does not exist. In the prototype it is fixed text.

> **Scope change, 2026-09-11.** The original version of this Feature said "this Feature shows them, it does not produce them" and left the engine and the pipeline **outside every ticket in the tree**. That left the two tabs with no way to exist: anyone picking up ARP-1418 or ARP-1419 would build a mock-up and be unable to close it. Scope was widened and the two missing tickets were created.
>
> The `[Next Round]` tag also came off all four titles: this is active work, not backlog. Priority stays at P2 so it does not compete with the UCP v2.0 delivery.

### What produces the content - the two that were missing

#### [ARP-1421](https://aims-os.atlassian.net/browse/ARP-1421) - Inference engine (new)
Produces the five insight kinds - summary, signals, tags, next-best actions, deductions - each with confidence and provenance. **Two requirements that are not obvious:** the engine runs with the viewer's scope (what it cannot read, it cannot infer), and inference is **reproducible** - an insight that changes without the data changing is a bug.

#### [ARP-1422](https://aims-os.atlassian.net/browse/ARP-1422) - Claims pipeline (new)
Populates the three planes and moves claims between them, one way only: **Sources to Sandbox to Truth**, leaving a trail at each step. **The central question that today has no written answer anywhere:** what makes a fact "verified" - who or what attests, and with what evidence.

### The tabs

#### [ARP-1418](https://aims-os.atlassian.net/browse/ARP-1418) - Intelligence
The presentation. All AI output grouped into one tab instead of one per insight kind. Carries the prototype's **`Held`** state, which withholds a suggestion while showing the reason.

#### [ARP-1419](https://aims-os.atlassian.net/browse/ARP-1419) - Knowledge
The three planes with their declared confidence. Carries the Sources-vs-Drives inconsistency written in as blocking.

#### [ARP-1420](https://aims-os.atlassian.net/browse/ARP-1420) - Access & Permissions
Who sees each insight and each plane, with the tooltip copy written out.

### The four decisions, now each with its own ticket

They used to live buried in *Open questions* sections, where nobody closes them. In the order that constrains the rest:

| Ticket | Decision | Why it matters |
|---|---|---|
| [ARP-1424](https://aims-os.atlassian.net/browse/ARP-1424) | **Inference leakage** | The only one that, resolved badly, produces a security incident rather than a UX bug. A summary can reveal a masked field without ever showing it. It changes the engine's architecture |
| [ARP-1423](https://aims-os.atlassian.net/browse/ARP-1423) | Is `Held` policy or an engine rule? | Determines **which ticket builds it**. Undecided, it gets built twice or not at all |
| [ARP-1426](https://aims-os.atlassian.net/browse/ARP-1426) | Where is a claim promoted to Truth? | Defines whether Knowledge has a write flow. Today the answer is "Governance Studio only" **by omission, not by decision** |
| [ARP-1425](https://aims-os.atlassian.net/browse/ARP-1425) | Sources vs Drives | The canon already resolves it; it remains to confirm with whoever carried the prototype forward |

---

### What was corrected before publishing

The ticket audit found violations that were **systemic** - repeated across several tickets, not isolated slips:

| # | Violation | Where | Correction |
|---|---|---|---|
| 1 | `deny by default` as an acceptance criterion | all 3 companions | Rewritten in terms of what the user sees |
| 2 | Create CTA hidden without permission | ARP-1411, ARP-1412 | Disabled with a tooltip |
| 3 | Disabled controls with no tooltip copy | all 3 companions | Canonical copy written into the companions |
| 4 | Implementation language (*its own store*, *does not render*, *stream not connected*) | 4 places | Translated into user language |
| 5 | A criterion with "or" - not testable | ARP-1411 | One single outcome chosen |
| 6 | Screen states dodged (*"not applicable"*, *"see sub features"*) | ARP-1410, ARP-1408 | Specified |
| 7 | A criterion that depended on an open item in the same ticket | ARP-1416 | The item was closed |

**Left uncorrected on purpose:** none of the 21 is estimated. That is the team's call, not mine.

---

### The two competing templates, now resolved

Two canonical templates were in circulation, both declared locked:

| | `jira-arp-ticket-creator` | `aims-os-prd-to-tickets` |
|---|---|---|
| Feature | 6 sections: Prototype Link, User Story, Description, Scope, Sub Feature Breakdown, Parent Boulder Reference | 13 sections |
| Version | 5 sections: Prototype Link, User Story, Description, Scope & Acceptance Criteria, Parent Feature Reference | 13 sections |

The 21 tickets were first written in the thirteen-section format, because that is what `aims-os-ticket-reviewer` audits against.

**Work Queues settles it.** ARP-927 and its children, ARP-929 among them, follow the five-section template exactly. That is the house standard, and ours was the outlier.

**All 21 descriptions were converted on 2026-09-11.** Nothing engineering needs was dropped: the screen states, the canonical tooltip copy, the edge cases, the items still to be defined and the decisions each live inside Description or Scope and Acceptance Criteria rather than in numbered sections of their own. Every ticket also carries its prototype link and the screenshot that shows it.

### Corrections applied on 2026-09-11

Three titles were created with an escaped ampersand (`Access &amp; Permissions`, visible as literal text). Corrected on ARP-1412, ARP-1417 and ARP-1420.

---

# 4. Edgardo Sierra's review

**Source:** transcript "Diseño de Administración y Permisos", 2026-09-03.
**Scope:** the review is of the **Admin Console**, not of the UCP. Of his 40 observations, **exactly one changed anything in the UCP** - and it is already resolved. The rest touch the UCP distantly or not at all.

> The transcript is in Spanish. Every quotation below is translated; the wording is mine, the point is his.

---

### The one thing that changed the UCP

#### "Always leave Activity last" made us see we had two views with the same name

Edgardo is talking about the **audit log**, the auditing component he wants identical on every surface. Our Activity tab is a different thing: an entity's communications, notes, events and tasks.

**Result:** our view stays **Activity**; the governance one is renamed **Audit**. Recorded in ARP-1407 and ARP-1415. **Closed.**

---

### What applies to the UCP later

#### The audit log is designed once and replicated identically

> "It has to look exactly the same everywhere. So you design it in one place and it replicates everywhere else."

The day an entity has an audit view, **it is not designed again** - the same component is mounted. The only thing that changes by context is the filters that cannot be removed.

His fixed columns: time, user, action type, resource, description, result, and **source**. Source matters because not everything comes from the UI - it may come through the API.

**The UCP has no audit view in this delivery.** This is information for when it does, not an open item.

---

### Three things that looked like they touched the UCP and do not

> I marked these as high risk on a first pass. Checked against what actually went into the published tickets, none of the three carries that weight. It is written down here so nobody raises them as blockers again.

#### App-level permissions, in two steps

> "Before I can give you permission on the Data Studio, somebody has to have given you access to the Data Studio."

**Why this is not a problem:** our companions describe what each role sees **inside** the UCP. If a prior module-access permission is also needed, that is a prerequisite line in the companions, not a redesign of the role model.

#### Privileges are not hierarchical

> "You can be a Tester on an agent and not have permission to chat with it day to day."

**Why this is not a problem:** ARP-1412's Role Templates are declared sets, not a ladder:

> Sales (Customers and Companies), Service (all three), People Ops (Employees), Read-only (all three, without creating)

People Ops does not overlap Sales. Nothing inherits from anything. Edgardo's point is already satisfied.

#### *Who has access*, per resource

> "Google has that and it is called Who has access. They are functions that are very hidden, but they are very important for an administrator."

**Why this is not a problem:** all three companions explicitly exclude per-record permissions under *Not in this release*. It is a decided non-goal, not an oversight. It remains urgent **for the Admin Console**, which is what he was talking about.

---

### Summary

| Observation | Bearing on the UCP |
|---|---|
| Activity vs audit log | **Closed** - ARP-1407 and ARP-1415 |
| The audit log is designed once | Applies when the UCP has an audit view. It does not |
| App-level permissions | A prerequisite line, if it applies |
| Non-hierarchical privileges | Already satisfied |
| Who has access, per resource | A declared UCP non-goal. Urgent for the Admin Console |
| The other 35 observations | Admin Console. Nothing to do with the UCP |

---

### The full review, as he gave it

Grouped by the surface he was looking at. [cross-cutting] marks what he himself called cross-cutting functionality - it has to exist in two places or it is useless.

### OV - Overview
*He approved almost all of it: connected integrations, active users and billing stay as they are.*

**OV-1.** Add to the Overview which apps are active, alongside integrations and users.
> "Here I would say put something about studios. Which studios are active?"

### US - User list
*Two substantive changes, the naming and the user types, and three layout ones.*

**US-1.** Rename the **Role** column to **User type**. It is not a role, and confusing the two breaks the model.
> "You have to keep in mind that this is not a role. This is a user type."

**US-2.** Limit the tenant's user types to `Admin`, `Owner` and `Member`. `Super Admin` is reserved for the internal back office.
> "Super Admin is reserved for us. In our own back office we will be able to create Super Admins."

**US-3.** Add per-user quick actions in a three-dot menu: reset password, deactivate user.
> "You do not have to put them here as buttons, it could be a three-dot menu here."

**US-4.** Add the **Department** column.

**US-5.** Use the empty space: cards, or individual columns (name, email) instead of everything packed into one block.
> "I do not mind the user list being a table, but let us use the space better so it does not look so empty."

### PF - User profile
*The most rewritten section. The structural change is that permissions are entered through the app, not directly.*

**PF-1.** Enter permissions **through the app**: access to the app is granted first, permissions within it after.
> "Before I can give you permission on the Data Studio, somebody has to have given you access to the Data Studio."

**PF-2.** Separate **viewing** permissions from **granting** them: a read-only tab and a separate action that opens editing.
> "Through permissions I can control that you can see a user's permissions, but you cannot change their permissions."

**PF-3.** In the read-only view, a switcher between showing only what is granted and showing everything.
> "It could be a switcher that says show only permissions, or show all permissions."

**PF-4.** In the editing view, show where each permission comes from but allow granting it directly to the user, without touching the role.
> "I am getting the permission from two places. The engine resolves it. If they take the role away from me, I keep the permission."

**PF-5.** Opening an app from the profile should not leave the profile: the user's area stays and only the right-hand area changes, with a breadcrumb.
> "You do not have to do what Jira does and throw you out of the profile. It would be as if the screen were split."

**PF-6.** Inside the app: Permissions, Groups, Roles and Activity tabs, plus Grant / Remove / Disable access actions.

**PF-7.** Reorder the tabs to `Apps`, `Roles`, `Groups`, `Resources`, `Security`, `Activity`.
> "Always leave Activity last."

**PF-8.** Add the **Resources** tab - it does not exist today. [cross-cutting]

**PF-9.** Let the administrator edit the profile information. Today there is no way.
> "What you are missing is a way to edit this information. The whole user profile is editable by the administrator."

**PF-10.** Widen the user actions: suspend access, remove, reset password, **reset MFA** (distinct from the password) and update user.

**PF-11.** In the roles and groups tab, allow adding and removing from the profile, with the catalogue of available roles.
> "Instead of going to the role, opening members and removing you there, here I say take me out of that role."

### RL - Roles
*He approved the structure. What is missing is traceability of who granted what, and the same read-and-edit split.*

**RL-1.** In the role's members, show **who** granted access and **when**.
> "Who gave access to this role, and when? Right here."

**RL-2.** A button to remove the member from the role, as well as deactivating them.

**RL-3.** The same read-only and editing split for the role's permissions.

**RL-4.** Allow editing the role's name and description, top right.

**RL-5.** Replace the permission tabs with small cards.
> "Instead of tabs, you can make them little cards like these, a bit smaller."

**RL-6.** Add the audit tab - the same component used everywhere. [cross-cutting]

**RL-7.** The role's Overview is optional: it does not add much.
> "Honestly, having an Overview here is not that important."

### GR - Groups
*The same as roles, plus the resources tab.*

**GR-1.** Show who granted access to the group and when.

**GR-2.** Allow **temporary deactivation** as well as removal.
> "So you do not have to remove them, it could be like deactivating them temporarily."

**GR-3.** Group tabs: `Members`, `Resources`, `Settings`, `Activity`. [cross-cutting]

**GR-4.** Allow editing the group's name and description.

### AP - Apps and studios
*His thesis: the studios are independent applications joined by a router, and the UI should feel that way.*

**AP-1.** Consider renaming **Studios** to **Apps**.
> "I think the word studios is going to cause confusion."

**AP-2.** A distinct icon per app and more visual prominence, so they feel like independent applications.
> "So it feels like a set of independent apps joined into a single router."

**AP-3.** In the app's profile, see **who has access** - the mirror of the user's view. [cross-cutting]
> "Just as I can see, as a user, which studios I have access to, the studios view should show who has access to that studio."

**AP-4.** Distinguish **Disable Studio** (global, for everyone) from removing one user's access.
> "This one is general, meaning turn it on for everybody. The other one is removing a user's access to the studio."

### AU - Audit log
*Defined once and replicated on every surface. The only thing that changes by context is the filters that cannot be removed.*

**AU-1.** Fixed columns: **time, user, action type, resource, description, result and source**.

**AU-2.** Include **source**. Not everything will come from the UI.
> "The source will not necessarily only be UI. It could have been through the API, for example."

**AU-3.** Per-event detail for forensic auditing: permission granted, user ID, specific resource, IP, session ID and the before and after.
> "So it was Sebastian, but this IP is not normally his IP, so they probably hijacked it."

**AU-4.** Fixed filters: resource, action, user, time, result and source. The description is found with the search box.

**AU-5.** Allow reading the full description, not just in the tooltip.

**AU-6.** Design it once and replicate it identically.
> "It has to look exactly the same everywhere. So you design it in one place and it replicates everywhere else."

**AU-7.** An export button.

### RS - Resources
*It does not exist yet and it is the only thing he flagged as urgent: the backend is already on its way from the data team.*

**RS-1.** A new **Resources** tab on users and groups: resource type, name, who granted access, when, and a remove button.
> "We have to pick this up again so it is not forgotten, please, because the data team is already finishing the backend to control that."

**RS-2.** **Who has access**, per resource, as a view separate from Share.
> "Google has that and it is called Who has access. Amazon has it too. They are functions that are very hidden, but they are very important for an administrator."

**RS-3.** On the agent, an administration view outside the Playground: Activity, Who has access, Settings and versions.

### CO - Sharing resources
*The privilege model is already defined by the backend. What is missing is the sharing UI reflecting it.*

**CO-1.** Allow selecting **several privileges** when sharing, not just one.
> "What matters is that I can select multiple privileges. I can say you can edit and you can view."

**CO-2.** Privileges are **not hierarchical**. They do not inherit viewer to editor to owner; they are mini-roles that may or may not overlap.
> "You can be a Tester on an agent and not have permission to chat with it day to day."

**CO-3.** AIMS OS creates the privileges underneath. The user only sees them by name, with an explanation of what they enable.
> "He has no reason to know which permissions he is granting. We can put here what this permission lets you do."

**CO-4.** Permission descriptions that are not superfluous, with a detail slide-out.
> "This platform is not for administrators. The automotive industry are not technical people, it is someone who was put in charge of administering something."

---

# 5. Technical replication

How to rebuild the prototype on another branch, and the design system rules you will run into.

---

### The two repositories

| Repo | What it is | Access |
|---|---|---|
| `cachilupis/aims-os-design-system` | **The design system.** The prototype's code lives here and Vercel deploys from here | Push controlled by CODEOWNERS |
| `thomzilla33/agentic-knowledge` | This repo. Documentation, GitHub Pages builds and the patches | Ours |

**Working branch:** `claude/ucp-vista-actualizada-431vm5` in `agentic-knowledge`.

---

### Recommended path: start from the code that is already deployed

The live prototype is **already on the design system's `main`**. To work on top of it:

```bash
git clone https://github.com/cachilupis/aims-os-design-system.git
cd aims-os-design-system
npm install
npm run dev          # open with ?proto=proto-thomas-ucp-contacts
```

This is the correct path. What follows is archaeology only.

### Alternative path: apply our patches

These are useful if someone wants to see **what we contributed** separately from what others added. They live in `ucp-ds-screens/` in this repo, generated against design system commit `9d8bea2`.

| Patch | Size | Files | Applies alone |
|---|---|---|---|
| `ucp-screens.patch` | 174,568 B | 8 | Yes - typechecks and builds |
| `experiment/experiment.patch` | 88,558 B | 5 | **No** - it stacks on the previous one, by design |
| `ucp-full.patch` | 259,808 B | 12 | Yes - both combined |

```bash
git checkout -b my-branch 9d8bea2
git apply ../Agentic-knowledge/ucp-ds-screens/ucp-full.patch
npx tsc --noEmit && npm run build
```

> **Warning:** these patches are against `9d8bea2`. Today's `main` is further ahead and contains its own version of these files. **They will conflict.** If what you want is to build, use the recommended path.

---

### Design system rules - the ones that break the build

They live in the design system repo's `CLAUDE.md`. These are the ones that cost time if you find them late.

#### Colour
**No hex and no rgba in `.tsx` files.** Only `var(--token)`. There is an auditor that checks.

#### Components
Only those in `ui/` and `layouts/` are used. Do not write new primitives.

#### Screen structure
- Every screen is wrapped in `ScreenLayout`
- Pagination goes on `ScreenLayout`'s `pagination` prop, not loose
- `EntityList` goes inside `CardContainer size="sm" className="!p-0 overflow-hidden"`
- Overview-style tabs use `WidgetCanvasView`
- Every zero-result case carries `EmptyState`
- **Never `EmptyState` and `Pagination` together**

#### Filters
Three layers: `Visible Filters` to `All Filters` to `Slideout`, plus chips for what is applied. What goes in the visible layer is decided by **frequency of use**, per `docs/FILTERS_SPEC.md`.

#### The ratchet
```bash
node scripts/audit-tokens.cjs --counts   # counts violations by category
node scripts/audit-ratchet.cjs           # compares against origin/main
```
The ratchet **fails if any category goes up** relative to `main`. It also runs in `.husky/pre-push`, so a push with new violations is rejected locally.

Useful detail: orphan detection only walks `src/components`. A new module under `src/screens/` does not trigger it.

#### CODEOWNERS
These paths need approval from `@cachilupis`:
```
/src/components/  /src/App.tsx  /src/index.css  /src/lib/  /tailwind.config.*  CLAUDE.md
```
`/src/screens/` **has no owner** - which is why all our work lives there.

---

### Files that matter

| File | What it does |
|---|---|
| `src/screens/viewerScopes.ts` | **The single owner of viewer permission.** `VIEWER_SCOPES` plus `hasScope()` plus `isMasked()`. Three different grains consume it: fields, rows and entity types. Duplicate it and the bug comes back where a price is visible on one surface and masked on another |
| `src/screens/ucpTypeModel.ts` | The per-type model: which widgets, which tabs, which facets each one publishes. `facetsForType()` is what makes the filters change with the type |
| `src/screens/ucpShared.ts` | Shared data and derivations. `getConnections()` derives from the contacts, not from fixed rows |
| `src/screens/pm-thomas-ucp-contacts.tsx` | The list |
| `src/screens/pm-thomas-ucp-profile.tsx` | The profile |
| `src/screens/pm-thomas-entity-workspace.tsx` | The unlimited-types experiment: dropdown with search plus a marketplace modal |

---

### Geometry that is expensive to rediscover

**`MenuItem`** - `size="sm"` gives `py-[8px] px-[8px] gap-[8px]`; `size="default"` gives `py-[8px] px-[16px] gap-[16px]`.
The `Menu` container is `w-[260px] max-h-[288px] overflow-y-auto rounded-[8px] py-[4px]`, **with no horizontal padding**.
Tokens: `--menu-bg`, `--menu-divider`, `--menu-item-text`.

> If you add your own row to a menu (a search field, say), copy that exact geometry. An input with its own border and padding ends up misaligned against the rows' icons - mine sat at 17px while the rows were at 8px.

**`useDropdownPosition`** measures in a layout effect. The anchor and the open flag have to change in the **same state commit**, or the flip calculation runs against an empty ref.

**`ModalDialog`** - `variant: "confirmation" | "content"`, props `slot` and `slotUnstyled`, `max-w-[900px]`.

---

### Capturing screenshots of the live prototype

The session proxy blocks a headless browser from reaching Vercel. The way around it:

```bash
mkdir shots && cd shots
curl -sO https://aims-os-design-system.vercel.app/          # save as index.html
mkdir assets && cd assets
curl -sO https://aims-os-design-system.vercel.app/assets/index-8tkXnTWw.css
curl -sO https://aims-os-design-system.vercel.app/assets/index-DECX7tIv.js
cd .. && python3 -m http.server 8137
```

Then point Playwright at `http://127.0.0.1:8137/?proto=proto-thomas-ucp-contacts`. The asset hashes change on each deploy; read them out of the fetched `index.html`.

Two things that cost time. The profile tabs at a 1440px viewport sit at y=241, with Overview at x=137, Activity at x=228, Intelligence at x=327 and Knowledge at x=438; `getByText('Knowledge')` fails because it is ambiguous with the KNOWLEDGE widget, so click by coordinate. And there is no PIL in this environment, so downscaling goes through a Playwright canvas with `toDataURL('image/jpeg', 0.86)`.

The seven captures are in `screenshots/` and every ticket links to the one that shows it.

---

### Publishing to GitHub Pages

The builds are single files with everything inlined (around 4 MB). They are generated from the design system and copied here:

```bash
npm run build                     # in the design system
cp dist/index.html ../Agentic-knowledge/ucp-contacts.html
```

`.nojekyll` is already at the repo root - do not delete it or Pages ignores the files.

---

# 6. Open items

Ordered by what blocks the most people.

---

### A. One question for the team, and a rename

Describing these operations turned up something that changes the picture: **ARP-520 is not an empty duplicate of ARP-468. It has 7 sub-features of its own**, and they are a cleaner breakdown than ARP-468's 8.

#### A1. Which of the two is live, ARP-468 or ARP-520?

| ARP-468 - `Selected for Development` | ARP-520 - `{Test}`, Backlog |
|---|---|
| ARP-502 Role + Entity Layout Resolution | ARP-521 Entity Profiles & Canvas Standard |
| ARP-503 Widget Library Drawer | ARP-522 Widget Runtime & Standard Widgets |
| ARP-505 Layout Versioning, Rollback, Audit | ARP-523 Admin Layout Builder & Guardrails |
| ARP-506 Industry Pack Framework & Installer | ARP-524 Internal Widget Catalog & Safe Activation |
| ARP-507 RBAC/ABAC Enforcement | ARP-525 Permissions Enforcement |
| ARP-508 Drive/Folder & Records Widget | ARP-526 Versioning, Rollback, Auditability |
| ARP-509 Automotive Pack v1 | ARP-527 Industry Pack Framework v1 + Reference Pack |
| ARP-510 Contact List facelift | - |

Three pairs are nearly the same ticket with a better name: 507 and 525, 505 and 526, and 506 plus 509 against 527. The rest is inference - read them to confirm the mapping.

**One of the two is surplus, but it is not clear which.** If ARP-520 is the good version, the right move is to drop its `{Test}` marker and close ARP-468, not the other way round. **This belongs to whoever created them.**

> **Do not close ARP-520 without reading its 7 children.** An earlier version of this document recommended exactly that, treating it as a test duplicate. That was wrong: closing it would close the better of the two breakdowns.

#### A2. Promoting ARP-468 to Boulder - worth discussing, not forced

The original argument was that "a Feature cannot contain Features", so ARP-468 could not represent its ten blocks. True but irrelevant: **those blocks already exist as `Version`, which is perfectly legal.** There is nothing broken to fix.

The real question is one of **size**: if "Widget Runtime", "Admin Layout Builder" and "Permissions Enforcement" are each Feature-sized, then they deserve to be Features and the parent should be a Boulder. That is the team's judgement.

#### A3. Renaming ARP-375 - done on 2026-09-11

ARP-375 went from "Unified Contact Profile" to **"Universal Entity Profile"**, matching the name ARP-468 and ARP-520 already used. See the naming section in [section 2](#2-decisions-and-why).

**What is left of it:** the body of ARP-375 still calls the module **"UCIH"**, an acronym that appears nowhere else. I did not touch it - it is someone else's text and may mean something I do not know. Worth asking.

---

### B. What blocks estimation

| What | Ticket | Who closes it |
|---|---|---|
| **The design of the note composer.** The prototype covers how notes are read, not how they are written | [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) | Design |
| **Pending tasks in the thread: mixed in or pinned above?** The only open item that changes the design of a mandatory tab | [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) | PM and design |
| **None of the 21 is estimated** | all | The team |
| **Intelligence and Knowledge** - the engine and the pipeline did not exist in the tree; now they do, and the 4 blocking decisions each have a ticket | [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) and its children | **Lex and JJ** - see the [brief](https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a) |

---

### C. What has to be confirmed with other people

#### With whoever carried the prototype forward on Vercel

1. **Sources vs Drives.** The Overview and the Knowledge tab use two names for the same plane. The canon says it is `Sources`. Was it an oversight or is there a reason? Now tracked as [ARP-1425](https://aims-os.atlassian.net/browse/ARP-1425).
2. **`Ask about this entity` vs `Ask about this company`.** Our per-type variant disappeared. A deliberate simplification?
3. **The `Held` state.** Is it governance policy or demo behaviour? Now tracked as [ARP-1423](https://aims-os.atlassian.net/browse/ARP-1423).
4. **Policies and Assets.** They appear as types in the rail, outside the scope we closed. Where did they come from and who asked for them?

#### With Edgardo Sierra

5. **Nothing blocking.** His review is of the Admin Console. The only thing that touched the UCP was the name collision between his *audit log* and our Activity tab, and that is resolved (ARP-1407, ARP-1415). See [section 4](#4-edgardo-sierras-review) for why the other three points that looked like they applied do not.
6. **For when the UCP has an audit view:** the component is designed once and replicated identically, not redesigned per surface. It is not in this delivery.

#### With Michael

7. **Hide versus lock for types the role cannot read.** The tenant policy exists in the tickets, but which one is the default has not been decided.
8. **`StudyWidget` and `ConnectionsContent` are duplicated** with `pm-thomas-universal-profile.tsx`.
9. **`record-header.tsx` was modified** while four `ds/record-header-*` branches were active. Possible collision.
10. **`Request access` is a stub.** The CTA exists; the flow does not.

#### About the Jira board

11. **ARP-1406, ARP-1407 and ARP-1408 have moved from Backlog to "Draft Boulder".** Nobody moved them by hand from this side. Either an automation fires on edit, or someone is working the board. Worth confirming before assuming the status means what it says.

---

### D. What was left undone and does not block

- **The PR in the design system repo.** This session never obtained push permissions to `cachilupis/aims-os-design-system` - four routes were checked, all closed. The work arrived by another route anyway (it is on `main` and deployed to Vercel), so the PR stopped being necessary. If anyone wants clean history, the patches are in `ucp-ds-screens/`.
- **Watch subscriptions on the artifacts.** This session's gateway returns 404 when registering one. Nobody will be notified if someone comments on the published pages.
- **Assigning ARP-1408 and its children to Lex and JJ in Jira.** They are named as owners in the ticket text and in the brief, but the Jira assignee field is empty. Deliberate - assigning was not chosen - but worth doing when they pick it up.
- **The transcripts** that were going to be shared for extra context never arrived. Everything here is sourced from the tickets, the prototype and the 2026-09-03 review.

---

### E. If someone wants to keep building the prototype

Read [section 5](#5-technical-replication) first, especially:
- the design system rules that make the ratchet fail on pre-push
- that `viewerScopes.ts` is the **single** owner of viewer permission - duplicating it reintroduces the bug where a value is masked on one surface and visible on another
- the `MenuItem` geometry, which is the most expensive thing to rediscover
- the screenshot capture workaround, if you need fresh captures after a deploy

---

# 7. Delivery pack: all 21 tickets in full

**For:** Lex Paniagua and Julian Johnston
**Boulder:** [ARP-375 Universal Entity Profile](https://aims-os.atlassian.net/browse/ARP-375)
**Date:** 2026-09-11

Every ticket below follows the same five-section template Work Queues uses (ARP-927 and its children), so nothing here should read as a different house style.

### Prototype

**Live:** https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts

Screenshots of every view are in `ucp-handoff/screenshots/` in this repo, captured from that prototype:

| File | View |
|---|---|
| `01-roster-all.jpg` | Entity list, all types |
| `02-roster-employees.jpg` | Entity list filtered to Employees, showing per-type filters |
| `03-profile-overview.jpg` | Customer profile, Overview tab |
| `04-profile-activity.jpg` | Customer profile, Activity tab |
| `05-profile-intelligence.jpg` | Customer profile, Intelligence tab, including the Held state |
| `06-profile-knowledge.jpg` | Customer profile, Knowledge tab |
| `07-company-overview.jpg` | Company profile, showing People as a fifth module |

### The shape of the tree

```
ARP-375  Boulder   Universal Entity Profile
  ARP-1406  Feature   List: entity list, pagination and creation      v2.0
    ARP-1409  Version   List by type
    ARP-1410  Version   Pagination
    ARP-1411  Version   Create via stepper
    ARP-1412  Version   Access & Permissions
  ARP-1407  Feature   Profile: tab contract, Overview and Activity    v2.0
    ARP-1413  Version   Tab contract and industry extension
    ARP-1414  Version   Overview
    ARP-1415  Version   Activity
    ARP-1416  Version   Notes
    ARP-1417  Version   Access & Permissions
  ARP-1408  Feature   Profile: Intelligence and Knowledge             v2.1
    ARP-1418  Version   Intelligence
    ARP-1419  Version   Knowledge
    ARP-1420  Version   Access & Permissions
    ARP-1421  Version   Inference engine          (new)
    ARP-1422  Version   Claims pipeline           (new)
    ARP-1423  Version   Decision: the Held state  (new)
    ARP-1424  Version   Decision: inference leak  (new)
    ARP-1425  Version   Decision: Sources/Drives  (new)
    ARP-1426  Version   Decision: claim promotion (new)
```

### Read this before picking up ARP-1408

Overview and Activity read sources that already exist. Intelligence and Knowledge do not: one needs an inference engine, the other a claims pipeline, and the original tree had a ticket for neither. Six tickets were added to close that gap. The full argument is in the brief: https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a

Four decisions block the build. In the order that constrains the rest: ARP-1424 (inference leakage), ARP-1423 (the Held state), ARP-1426 (claim promotion), ARP-1425 (Sources vs Drives).

---

## ARP-1406 - List: entity list, pagination and creation

**Feature** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/01-roster-all.jpg`

### User Story

As a user who needs to work on a record, I want to find it in a list and open it, so that I do not depend on someone sending me a link.

### Description

The unified profile has no front door. There is no list a record can be opened from today, and no consistent way to create one. Without that, the profile is a screen nobody reaches.

This Feature delivers the entry point for Contacts, Employees and Companies: the list, its search and filters, pagination, and creation through a stepper. Every other entity type, the type switcher with its catalogue, and the mixed list across types arrive with the platform work in ARP-468.

Two questions are still open: whether the user can change page size or it is fixed, and whether search crosses all three types or only the active one. In the prototype it is only the active one.

### Scope

- List of Contacts, Employees and Companies, each with its record count
- Search, per-type filters, sorting, pagination
- Creation through a stepper
- Navigation into a record's unified profile without losing the list
- Loading shows row skeletons with the type selector and create button already visible
- Empty shows the create button, or the way out of a filter when one is applied
- Error offers retry and leaves the type selector usable

### Sub Feature Breakdown

- ARP-1409 List by type - the list itself and the point any profile opens from
- ARP-1410 Pagination - moving through lists longer than one screen
- ARP-1411 Create via stepper - the guided flow for adding a record
- ARP-1412 Access & Permissions - which types each role sees, and who can create

### Parent Boulder Reference

[Linked: ARP-375 - Universal Entity Profile]

---

## ARP-1409 - List by type

**Version** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/01-roster-all.jpg` and `screenshots/02-roster-employees.jpg`

### User Story

As a user, I want to see the records of a type with their context information, so that I can recognise the one I am looking for without opening it.

### Description

The list of records of one type, and the point any profile is opened from.

The user sees the types All, Customers, Employees and Companies, each with its count, a search box, visible filters for the active type, and a create button that names what it will create. Each row carries the name, an avatar or icon depending on type, the record ID, the source system, the status, and secondary metadata such as role and company, owner, verified facts and assigned agent.

Three conditions matter. A governed record the role cannot read is still listed and marked: the restriction is on the values, not on the record's existence. A record created inside the platform has no source system, and that slot is removed rather than filled with placeholder text. A type with no records shows an empty state with the create button.

The tag for the `person` type reads Customer, not Person. It describes what the record is, not what the row is.

### Scope & Acceptance Criteria

- Type selector with live per-type counts
- Search across name, company, owner and record ID
- Visible filters that change with the active type
- Row menu with quick actions, filtered to the role's permissions
- Loading: row skeletons, types and create button already visible
- Empty: no records of the type, or no results with the way out of the filter
- Error: retry offered, types stay usable
- [ ] Each record shows its name, identifier and source system
- [ ] Searching by name, company, owner or ID returns only matching records
- [ ] A row menu shows only actions the role can perform
- [ ] A governed record is listed and marked with the permission that would open it

### Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

## ARP-1410 - Pagination

**Version** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see the footer in `screenshots/01-roster-all.jpg`

### User Story

As a user with hundreds of records, I want to move through them by page, so that I do not wait on an endless list or lose my place.

### Description

The control that lets a user move through lists longer than one screen without losing track of where they are: a rows-per-page selector, the current range over the total, and previous and next controls.

One rule is absolute and easy to break: never an empty state and pagination at the same time. They are two contradictory messages. This is a design system rule, not a preference.

Any change of type, filter or sort order returns pagination to page one.

Still open: whether the control is shown or hidden when results fit on a single page.

### Scope & Acceptance Criteria

- Rows-per-page selector, current range over total, previous and next controls
- Reset to page one on any change of type, filter, sort order or page size
- Loading: controls visible but inert until the page loads
- Empty: no pagination controls at all
- Error: the list's error shows with no pagination beneath it; on successful retry pagination returns on page one
- [ ] Changing page shows the next set and the updated range against the same total
- [ ] Changing page size returns to page one with the new size applied
- [ ] Applying or clearing a filter returns to page one, not to a page that no longer exists
- [ ] A search with no results shows no pagination next to the empty state
- [ ] A list that fails to load shows no pagination beneath the error

### Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

## ARP-1411 - Create via stepper

**Version** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the create button is visible in `screenshots/01-roster-all.jpg`. The step-by-step frames are not in the prototype and are still to be defined.

### User Story

As a user who has just met someone outside the system, I want to add them in guided steps, so that I do not get the fields or the type wrong.

### Description

The guided flow for creating a new record inside the platform.

Entering from All, the first step asks for the type. Entering from a specific type, the type is fixed and that step does not appear. Then come the fields for that type, then a summary before confirming.

A record created here has no source system, because it was born in the platform. The stepper says so explicitly: its facts start in the Sandbox plane and are promoted once verified.

On confirm the user goes to the new record's profile, not back to the list. They have just added it and the next thing they want is to complete it.

Without create permission the button is shown disabled with a tooltip, not hidden. Creating a record is not a purchase, not billing, and not a platform-level irreversible action, which are the three cases the standard reserves hiding for. An earlier version of this ticket hid it; that was wrong.

Still open: whether a duplicate is detected and flagged or simply allowed, and whether cancelling with data entered asks for confirmation.

### Scope & Acceptance Criteria

- Stepper with a type step that appears only when entering from All
- Per-type fields, then a summary before confirming
- Back navigation that preserves what was entered
- Explicit statement that the record has no source system and its facts start unverified
- Create button disabled with tooltip when the role lacks permission: "You need the 'Create records' permission. Ask your administrator for it."
- Loading: save in progress, confirm cannot fire twice
- Error: per-field validation, and a save error that preserves what was entered
- [ ] Opening creation from a specific type does not ask for the type
- [ ] Going back a step preserves what was already entered
- [ ] Confirming lands the user on the new record's profile
- [ ] A failed save explains what happened and loses nothing
- [ ] The user understands the record has no source system and starts unverified
- [ ] Without create permission the button is disabled with the tooltip above

### Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

## ARP-1412 - Access & Permissions: List

**Version** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/01-roster-all.jpg` shows the list as a full-access role sees it. The prototype has no role switcher, so none of the restricted states below can be seen in it.

### User Story

As an administrator, I want each role to see only the entity types it is entitled to, so that people are not shown records they cannot work with.

### Description

Which types appear in the list for each role, and who can create records.

Super Admin sees all three types in any company and alone controls the tenant's hide-versus-mark policy. Admin sees all three within their company and grants access to their roles. The role templates are Sales (Customers and Companies), Service (all three), People Ops (Employees) and Read-only (all three, without creating). Custom roles are created by the Admin from a template or from scratch.

A type the role does not reach does not appear in the type selector. A governed record inside a permitted type is still listed, marked with the permission that would open it.

Controls without permission are shown disabled with a tooltip. The tooltip copy is fixed here and used identically across the platform, so that five different wordings of the same thing do not appear:

| Control | Tooltip |
|---|---|
| Create button | You need the "Create records" permission. Ask your administrator for it. |
| Row action without permission | You need the "Edit records" permission. Ask your administrator for it. |
| Governed record | This record requires the "{permission name}" permission. Ask your administrator for it. |

Not in this release: per-user permissions, the access request flow (the button exists, the flow does not), and per-record permissions.

### Scope & Acceptance Criteria

- Type visibility per role, recalculated on the next load after a role change
- Governed records listed and marked rather than hidden
- Disabled controls with the canonical tooltip copy above
- Removing a type from a role does not delete records; another role still sees them
- [ ] A People Ops user sees Employees and does not see Customers or Companies
- [ ] A user without create permission sees the create button disabled with the tooltip naming the permission
- [ ] A governed record shows that it exists and which permission opens its values
- [ ] Removing a type from a role hides that type for its users on their next load
- [ ] When permissions cannot be confirmed, the user sees no records and a message telling them to retry or contact their administrator

### Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

## ARP-1407 - Profile: tab contract, Overview and Activity

**Feature** - v2.0 - P1 - **Blocks ARP-468**

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/03-profile-overview.jpg` and `screenshots/07-company-overview.jpg`

### User Story

As a user who works across several types in a day, I want every profile to have the same tabs in the same order, so that I do not relearn the navigation on each type.

### Description

Today each entity type needs someone to decide by hand which tabs its profile has. That does not scale, and it produces profiles that are inconsistent between types. This Feature fixes the backbone every published entity receives, and delivers the two mandatory tabs.

The strip is Overview, Activity, Intelligence, Knowledge, in that order, on every type. Industry modules go after Knowledge, never interleaved. The company screenshot shows this working: People appears as a fifth module, after the base four.

The strip is a platform contract, not a screen. It is defined once and applied to every published entity, which is why it blocks ARP-468: that ticket builds the canvas, the widgets and the packs that land on this contract, so it cannot close first.

Overview is the only customisable tab. The other three are fixed.

This view is called Activity. The governance view, the audit log, is a different thing with a different audience, and is renamed Audit so the two stop colliding. Edgardo Sierra's note about leaving Activity last referred to the audit log, not to this.

Three questions are open: what the governance view is finally called, whether pending tasks belong inside the chronological thread or pinned above it, and whether an industry pack can contribute more than one module and who orders between them.

### Scope

- The four-tab contract, applied to every published entity with no per-type configuration
- The extension point where industry modules attach, after Knowledge
- Overview and Activity with their four activity kinds, plus notes
- Header and strip pinned on scroll
- Not included: Intelligence and Knowledge (ARP-1408), and the drag-and-drop builder, widget catalogue and pack installer (ARP-468). This Feature defines where they land; ARP-468 defines how they are built.

### Sub Feature Breakdown

- ARP-1413 Tab contract and industry extension - the navigation component every profile mounts
- ARP-1414 Overview - the configurable dashboard
- ARP-1415 Activity - communications, notes, events and tasks in one thread
- ARP-1416 Notes - the profile's only write flow
- ARP-1417 Access & Permissions - who sees each tab, who writes notes

### Parent Boulder Reference

[Linked: ARP-375 - Universal Entity Profile]

---

## ARP-1413 - Tab contract and industry extension

**Version** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/07-company-overview.jpg` shows the strip with an industry module attached

### User Story

As a user, I want the profile navigation to be identical across every type, so that I can move around without thinking.

### Description

This is not a screen. It is the navigation component every profile screen mounts. It defines which tabs exist, in what order, and where what the packs contribute plugs in.

The strip sits below the header with the four base tabs and, where they exist, the industry modules after them. The active tab is marked. Strip and header stay pinned on scroll.

The strip is frozen once. Adding a fifth base tab is a contract change, not a feature.

Still open: what happens when industry modules overflow the width. Overflow behind a "more" control, horizontal scroll, or a cap per pack.

### Scope & Acceptance Criteria

- Four base tabs in fixed order, plus industry modules after Knowledge
- Active tab marked; strip and header pinned on scroll
- Tab switching without reloading the header or losing the record
- A governed record keeps the strip
- A role without access to a tab follows the policy in ARP-1417
- Loading: the full strip appears before the active tab's content
- Empty: four tabs with no gap where a module would go
- Error: a failing tab does not take the strip off the screen
- [ ] Opening a profile shows the full strip before the active tab's content loads
- [ ] Switching tab does not reload the header
- [ ] A pack's module appears after Knowledge and never between the base four
- [ ] A record of a newly published type shows the complete profile with no per-type configuration

### Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

## ARP-1414 - Overview

**Version** - v2.0 - P1 - depends on ARP-468 for the canvas and widget runtime

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/03-profile-overview.jpg`

### User Story

As a user opening a record, I want to assemble my Overview from the widgets that serve me and that I have access to, so that I see what my work needs first.

### Description

The record's dashboard: the first thing seen, and the only tab the user assembles. It answers what should I be looking at here.

The canvas holds the type's own widgets, the studio widgets, the agent summary and recent activity. The arrangement comes from the role's layout; with no layout of their own, the user sees the default layout and never a blank screen.

The type's own widget goes before the studio widgets. It answers what is this, and that reads before how sure are we.

Two behaviours are easy to get wrong and matter most. Each widget loads on its own, so the canvas does not wait on the slowest. A failing widget shows its error with retry while the others stay alive.

A widget holding a governed value the viewer cannot read keeps its label and masks the value, staying visible with the permission that would open it. Hiding the whole widget tells the user less than they need.

### Scope & Acceptance Criteria

- Per-widget loading and per-widget failure with retry
- Default layout fallback when the role has none
- Widget catalogue filtered to what the role can access
- Field-level masking inside a widget, keeping label and permission name
- A widget with no data source cannot be added unless it supports a no-data state
- [ ] Overview is the active tab by default when a record opens
- [ ] A failing widget leaves the rest of the canvas usable and retries alone
- [ ] The add-widget catalogue shows only widgets the role can access
- [ ] A role with no layout sees the default layout, not an error
- [ ] A governed value appears masked with its label, not as an absent widget

### Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

## ARP-1415 - Activity

**Version** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/04-profile-activity.jpg`

### User Story

As a user picking a record back up after several days, I want to see everything that happened and everything still open, so that I can catch up without asking anyone.

### Description

What is happening with this entity: communications, notes, events and pending tasks, in a single chronological thread, most recent first.

Not to be confused with Audit. This view answers what is happening with this entity and is read by whoever works the record. The audit log, who changed what and from which IP, is a different thing with a different audience and its own place.

Four kinds of item, from four sources: communications from the messaging platform, notes that people write in the platform, events from the workflow engine, and tasks from the task system.

Activity is generic and does not vary by entity type. Every record communicates, gets annotated, fires events and accumulates tasks the same way.

The four sources will not all be available at once, so the criteria close per kind and the ticket allows phased delivery.

One open question carries real design weight: pending tasks are not the past. Mixing them into a chronological thread puts two reading modes together, because the past is scanned downward while the pending is dealt with now. The proposal is to pin them above the thread. Also open: whether activity from a system the user cannot access is listed without content or not listed at all.

### Scope & Acceptance Criteria

- Chronological thread, most recent first, grouped by day
- Four activity kinds with their own filter chips
- Each item shows its kind, author, date and content
- Pagination, resetting to page one on filter change
- A kind the role cannot reach is not listed and its filter does not appear
- Loading: row skeletons
- Empty: explains that interactions appear as they happen; with a filter applied, offers to clear it
- Error: retry offered
- [ ] The most recent items come first, each with kind, author and date
- [ ] Filtering to a kind with no results shows an empty state with a way to clear it
- [ ] Changing filter returns pagination to the first page
- [ ] Pending tasks are distinguishable from what has already happened without reading the date
- [ ] An unavailable source leaves the other kinds working, with no broken thread and no error

### Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

## ARP-1416 - Notes

**Version** - v2.0 - P1 - **blocked on design before it can be estimated**

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Notes chip in `screenshots/04-profile-activity.jpg` covers reading. **It does not cover writing.** The composer field, where it lives and how it is confirmed are still to be defined, and that is the piece to get hold of before this enters a sprint.

### User Story

As the owner of a contact, I want to leave a note about what we discussed, so that the next person who opens the record does not start from zero.

### Description

The profile's only write flow: letting owners leave context no system will record on its own. Notes are the only Activity content produced by a human, which is why they are estimated separately from the thread.

Existing notes appear in the thread marked as notes, with author and date. A user who is not an owner sees the composer disabled with a tooltip rather than hidden, because writing a note is not a purchase, not billing and not irreversible.

If a save fails the note is not lost: the text stays in the field with the option to retry.

Still open, and it blocks the permissions companion rather than these criteria: whether an Admin can delete someone else's note, and whether a Super Admin or Admin can write notes on records that are not theirs.

### Scope & Acceptance Criteria

- Composer above the Activity thread, owner-only, disabled with tooltip otherwise: "Only this record's owners can leave notes."
- Notes appear in the thread with author and date
- Edit and delete restricted to the author's own notes
- Long notes collapse with an expand control
- Two people writing at once: both notes land; no concurrent editing of the same text
- Loading: save in progress, cannot send twice
- Error: the text survives, retry offered
- [ ] An owner's note appears in the thread without reloading the tab
- [ ] A non-owner sees the composer disabled with the tooltip above
- [ ] A failed save explains what happened and keeps the text
- [ ] Every note shows who wrote it and when
- [ ] An edited note shows that it was edited and when

### Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

## ARP-1417 - Access & Permissions: Profile

**Version** - v2.0 - P1

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/03-profile-overview.jpg` shows the profile as a full-access role sees it. The prototype has no role switcher, so the restricted states below cannot be seen in it.

### User Story

As an administrator, I want to control which tabs and widgets each role reaches, so that people see what their work needs and nothing they should not.

### Description

Who sees each tab, who assembles their Overview, who writes notes, and what happens when a role does not reach.

Super Admin has all four tabs and every widget in any company, and alone controls the tenant's hide-versus-lock policy. Admin has the same within their company and grants tabs, widgets and activity kinds to their roles. The templates are Sales (Overview and Activity, notes yes), Service (all four, notes yes), People Ops (Overview and Activity on Employees) and Read-only (all four, no notes, no layout editing).

All four tabs are visible by default. Hiding them is an explicit tenant decision. A tab out of scope is shown locked with its permission named, or hidden, depending on that policy. An action without permission is shown disabled with a tooltip, never absent.

| Control | Tooltip |
|---|---|
| Locked tab | You need the "{permission name}" permission to open this tab. Ask your administrator for it. |
| Note field when not an owner | Only this record's owners can leave notes. |
| Edit layout without permission | You need the "Edit layouts" permission. Ask your administrator for it. |
| Masked field in a widget | This data requires the "{permission name}" permission. Ask your administrator for it. |

Not in this release: per-user permissions, hiding industry modules one by one, the access request flow, and deleting other people's notes.

### Scope & Acceptance Criteria

- Tab visibility and widget catalogue scoped per role, recalculated on the next load
- Locked tabs name their permission; disabled actions carry the canonical tooltips above
- Removing a tab from a role does not delete its content
- [ ] A Sales user sees Overview and Activity, and the other two per tenant policy
- [ ] A tab out of scope under the lock policy names the permission that opens it
- [ ] A non-owner can read notes and sees the composer disabled with its tooltip
- [ ] Removing widget access hides it from that role's catalogue and canvas
- [ ] When permissions cannot be confirmed, the record's content is withheld and a message tells the user to retry or contact their administrator

### Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

## Feature 3 - Intelligence and Knowledge

This is the set Lex and JJ own. Read the section "Read this before picking up ARP-1408" above before the individual tickets: the two tabs differ in kind from Overview and Activity, and the difference is the whole reason this Feature exists.

---

## ARP-1408 - Profile: Intelligence and Knowledge

**Feature** - v2.1 - P2 - Owners: Lex Paniagua and Julian Johnston

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - open a record, then the Intelligence and Knowledge tabs.

| Screenshot | What it shows |
|---|---|
| `screenshots/05-profile-intelligence.jpg` | Intelligence with signals, the SUGGESTIONS block, and the `Held` state with its reason |
| `screenshots/06-profile-knowledge.jpg` | Knowledge with its three sections, labelled `Sandbox / Truth Plane / Drives` |

Context brief for both owners: https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a

### User Story

As a user about to act on a record, I want to see what the AI concluded and what we are sure of, so that I can decide with judgement.

### Description

The two remaining tabs of the profile contract. They are a different kind of problem from the other two.

| Tab | Where its content comes from | Does that source exist? |
|---|---|---|
| Overview | the record's own fields and its related records | Yes |
| Activity | messaging, the workflow engine, the task system, notes | Yes |
| Intelligence | an engine that infers summary, signals, tags, next-best actions and deductions | No |
| Knowledge | a pipeline that populates Truth, Sandbox and Sources, and promotes between planes | No |

Overview and Activity read. Intelligence and Knowledge need something to produce first. In the live prototype that content is fixed text: you can see how it should look, but nothing generates it. That is the real work of this Feature, and it is why it cannot be closed by building the visual layer alone.

Scope therefore includes the engine (ARP-1421) and the pipeline (ARP-1422). It does not include the AI models themselves: this Feature defines what is inferred, with what provenance and what confidence, not how anything is trained.

Scope change of 2026-09-11: the original version of this ticket said "this Feature shows them, it does not produce them" and left the engine and the pipeline outside every ticket in the tree. That left the two tabs with no way to exist.

Four decisions block the build. They are tickets, not bullet points, so that each has an owner and a date.

| Ticket | Decision | Blocks |
|---|---|---|
| ARP-1424 | Inference leakage: an insight derived from a governed field. The only one that, resolved badly, is a security incident rather than a UX bug | ARP-1421, ARP-1418 |
| ARP-1423 | Is the `Held` state configurable policy or a fixed engine rule? | ARP-1418, ARP-1420 |
| ARP-1426 | Is a claim promoted from Sandbox to Truth inside the profile, or only from Governance Studio? | ARP-1419, ARP-1422 |
| ARP-1425 | Sources vs Drives: one plane with two names on screen | ARP-1419, ARP-1422 |

Smaller open questions, closable inside the ticket that carries them: the confidence threshold below which an insight is withheld or marked (ARP-1418) · a plane disabled by the knowledge administrator, hidden or shown disabled (ARP-1419) · what happens to conflicting claims and to a Truth fact that is invalidated (ARP-1422).

### Scope

- Both tabs load independently; a failure in one does not drag the other down
- Intelligence shows an explicit processing state, because the engine takes longer than a normal query
- An empty record and an empty plane are normal states, each explained, never an error
- Inference is reproducible: the same record, unchanged, gives the same insights
- Access follows ARP-1420
- [ ] Intelligence shows the agent summary with its confidence and which planes it drew on, generated for that record and not fixed text
- [ ] With no next-best action, no action card is shown at all
- [ ] Knowledge shows the three planes with their declared confidence and that record's real content
- [ ] An empty plane explains itself and the other two stay usable
- [ ] Opening the same record twice with nothing changed gives the same insights

### Sub Feature Breakdown

| Ticket | Title | Why it exists |
|---|---|---|
| ARP-1418 | Profile - Intelligence | The tab: the five insight kinds with provenance |
| ARP-1419 | Profile - Knowledge | The tab: the three planes with their confidence |
| ARP-1420 | Profile - Access & Permissions | Who reaches which insight and which plane |
| ARP-1421 | Intelligence - Inference engine | Produces what ARP-1418 shows. Did not exist |
| ARP-1422 | Knowledge - Claims pipeline and planes | Populates what ARP-1419 shows. Did not exist |
| ARP-1423 | Decision - `Held`: policy or engine rule | Decides which ticket builds the withholding |
| ARP-1424 | Decision - Inference leakage | Decides the engine's architecture |
| ARP-1425 | Decision - Sources vs Drives | Decides one name for the third plane |
| ARP-1426 | Decision - Where promotion happens | Decides whether Knowledge has a write flow |

### Parent Boulder Reference

[Linked: ARP-375 - Universal Entity Profile]

---

## ARP-1418 - Profile: Intelligence

**Version** - v2.1 - P2

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Intelligence tab, with the signals and the SUGGESTIONS block sorted by impact times urgency, including the `Held` state.

`screenshots/05-profile-intelligence.jpg`. Note the `Held` state with its reason, and the "Grounded in" line showing provenance.

### User Story

As a user who has to decide something, I want to see what the AI concluded and why, so that I can act with judgement instead of reading the whole history.

### Description

Everything the AI inferred about the record, grouped so we do not multiply tabs: summary, signals, tags, next-best actions and deductions.

The user sees the agent summary with its confidence and which planes it came from, detected signals, inferred tags, next-best actions with their rationale, and deductions marked as such. Suggestions arrive sorted by impact times urgency. A suggestion withheld by governance is shown in the `Held` state with the reason visible, for example "Held - a migration delivery date is not attested yet".

The user can read each insight, open its provenance, accept or dismiss a next-best action, and ask the record's agent a question.

States:

- Loading: the AI takes time, so this is an explicit processing state, not a silent skeleton
- Empty: the agent has not processed the record yet. With no next-best action there is no card at all; the absence is the signal
- Error: the engine did not respond, with retry
- Success: insights with their provenance

Edge cases. An insight derived from a governed field is the `Held` case, and it is not confirmed that withholding is the policy: see ARP-1424. The confidence threshold below which an insight is withheld or marked is still to be defined.

Acting without permission is shown disabled with a tooltip; copy lives in ARP-1420.

### Scope & Acceptance Criteria

- The five insight kinds render with provenance
- Processing, withholding and error are told apart on screen
- Suggestions sorted by impact times urgency
- [ ] The agent summary shows its confidence and which planes it drew on
- [ ] With no next-best action, no card is shown, neither empty nor filled with placeholder text
- [ ] A next-best action always shows why; never an instruction without a reason
- [ ] An unprocessed record shows a state that explains it, not an error
- [ ] A suggestion withheld by governance shows that it exists and the reason it is withheld

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

## ARP-1419 - Profile: Knowledge

**Version** - v2.1 - P2

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Knowledge tab and the Overview's KNOWLEDGE widget, which shows the per-plane count.

`screenshots/06-profile-knowledge.jpg`.

Inconsistency to resolve before building. The screenshot is the evidence: this tab labels its sections Sandbox, Truth Plane and Drives, while the Overview widget on the same record calls the third one Sources. The canon (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`) says the plane is Sources and the Source Drives are the container that feeds it, so the Overview is right and this tab is misnamed. Build it as Sources. Tracked as ARP-1425.

### User Story

As a user about to rely on what the system asserts, I want to see what is verified and what is not, so that I know what I can trust.

### Description

The record's governance in miniature: what we know about this entity and with how much confidence.

| Section | Confidence | What it shows |
|---|---|---|
| Truth | 100% | verified facts |
| Sandbox | around 80% | claims pending or in processing |
| Sources | around 60% | the record's Source Drives: related folders and documents |

The user can walk each plane, open a document, and see when a fact was verified and where it came from.

States:

- Loading: each plane loads on its own
- Empty: a plane with no content explains itself; a record with no knowledge is not an error
- Error: a failing plane does not take the other two down; it shows its error with retry
- Success: the three planes with their declared confidence

Edge cases. A document from a Drive the viewer cannot open is listed with its lock, not hidden. A claim in processing has its own state, distinct from "not verified". A plane disabled by the knowledge administrator is still to be defined: hidden, or shown disabled.

Governed content is locked without disappearing.

### Scope & Acceptance Criteria

- Three planes with their declared confidence, each loading and failing independently
- Source Drives feed the Sources plane
- The tab and the Overview widget use the same name for the same plane
- [ ] The three planes show with their declared confidence level
- [ ] A Truth fact shows when it was verified and which source it came from
- [ ] An empty plane explains itself and the other two stay usable
- [ ] A document the user cannot open is shown to exist, naming the permission that would open it
- [ ] A claim in processing is told apart from one that is unverified
- [ ] The Overview widget and this tab name the same plane the same way

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

## ARP-1420 - Access & Permissions: Intelligence and Knowledge

**Version** - v2.1 - P2

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/05-profile-intelligence.jpg` and `screenshots/06-profile-knowledge.jpg` show both tabs as a full-access role sees them. The prototype has no role switcher, so the restricted states below cannot be seen in it.

### User Story

As an administrator, I want to control who sees the AI insights and each knowledge plane, so that inference and knowledge stay inside the same boundaries as the data they come from.

### Description

Super Admin has Intelligence and all three planes in any company. Admin has the same within their company and grants per-plane access to their roles. The templates are Sales (Intelligence; Knowledge Truth only), Service (both in full), Compliance (Knowledge in full, Intelligence read-only) and Read-only (both without acting). Custom roles are created by the Admin.

A plane out of scope is shown locked with its permission named. A next-best action without execution permission is shown disabled with a tooltip, never absent. A governed document is listed with a lock.

| Control | Tooltip |
|---|---|
| Next-best action without permission | You need the "Run suggested actions" permission. Ask your administrator for it. |
| Locked plane | You need the "{permission name}" permission to see this plane. Ask your administrator for it. |
| Locked document | This document requires the "{permission name}" permission. Ask your administrator for it. |

Updating a role recalculates scope on the next load; the knowledge is not deleted.

Not in this release: per-fact permissions, the access request flow, and promoting claims from the profile.

Open question. Is the governance withholding shown by the prototype (`Held`) a permission policy configured here, or a fixed engine rule? The answer decides whether this ticket governs it or only reflects it. Tracked as ARP-1423.

### Scope & Acceptance Criteria

- Per-plane and per-insight scope by role, recalculated on the next load
- Locked planes name their permission; disabled actions carry the canonical tooltips above
- [ ] A Sales user opening Knowledge sees the Truth plane and the other two locked with their permission named
- [ ] A user without execution permission sees a next-best action disabled, with the tooltip naming the permission that would enable it
- [ ] A Compliance user can read everything in Intelligence and act on nothing
- [ ] When permissions cannot be confirmed, no insight and no plane are shown, and a message tells the user to retry or contact their administrator

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge] (Relates To)

---

## ARP-1421 - Intelligence: inference engine

**Version** - v2.1 - P2

This ticket did not exist. The original tree defined the Intelligence tab (ARP-1418) but nothing that produced its content. Without this, the tab can only be a mock-up.

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Intelligence tab shows the shape of the expected output: `SUGGESTIONS · 3 · Sorted by impact x urgency`, signals with severity, and the `Held` state with its reason. That content is fixed text today; this ticket makes it real.

`screenshots/05-profile-intelligence.jpg`.

### User Story

As a user opening a record, I want what the AI says to come from this particular record, so that I can trust it when deciding.

### Description

Not a screen. This is what produces Intelligence's content: the five insight kinds, each with its confidence and its provenance.

| Insight kind | What it produces | Inputs |
|---|---|---|
| Summary | the record's state in short prose | the three Knowledge planes plus Activity |
| Signals | detected conditions, with severity | record fields plus thresholds |
| Tags | inferred classifications | patterns in the record and its related records |
| Next-best actions | what to do, with its rationale and its order | signals by impact by urgency |
| Deductions | what was inferred, marked as unverified | correlations across planes |

Each one carries confidence and provenance: which plane and which field it came from. An insight without provenance is not shown.

States, surfaced by ARP-1418: queued or processing; insufficient inputs, which the engine declares rather than returning empty text; engine error, told apart from "not processed yet"; and success.

Edge cases. An insight derived from a governed field is blocked by ARP-1424, and it is the most important decision in this ticket: a summary can leak by inference what masking protects. The confidence threshold is still to be defined, along with whether a below-threshold insight is withheld, marked, or not produced. A newly created record has no history and the engine must declare that rather than invent. Reproducibility is a requirement, not a nicety: an insight that changes because the page was reloaded destroys trust in all the others. When the engine runs, on open, on an event, or on a schedule, is still to be defined and changes the whole design.

The engine runs with the viewer's scope, not full scope: what the engine cannot read, it cannot infer. This is the first line of defence against inference leakage. See ARP-1424.

### Scope & Acceptance Criteria

- The five insight kinds generated per record, with traceable confidence and provenance
- Reproducibility verifiable
- Engine respects the viewer's scope
- [ ] A record with sufficient inputs yields insights generated from that record, not template text
- [ ] An insight's provenance leads to the plane and the field it came from
- [ ] The same record opened twice with nothing changed gives the same insights
- [ ] A record with insufficient inputs shows that the agent did not process it, not an empty result
- [ ] An insight below the confidence threshold is not presented as certain

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]. Blocked by ARP-1424 before estimating.

---

## ARP-1422 - Knowledge: claims pipeline and planes

**Version** - v2.1 - P2

This ticket did not exist. The original tree defined the Knowledge tab (ARP-1419) but nothing that populated the three planes. Without this, the tab can only be a mock-up.

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Overview's KNOWLEDGE widget shows the per-plane count (5 Truth / 3 Sandbox / 3 Sources) and the Knowledge tab shows its content. Both are fixtures today.

`screenshots/03-profile-overview.jpg` and `screenshots/06-profile-knowledge.jpg`. Canon: `TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`.

### User Story

As a user about to rely on what the system asserts about a record, I want the distinction between verified and unverified to be real, so that the declared confidence means something.

### Description

Not a screen. This is what populates a record's three knowledge planes, and what moves a claim from one plane to another.

| Plane | Confidence | What fills it | How it gets in |
|---|---|---|---|
| Sources | around 60% | the record's Source Drives: folders and documents from the company's shared drives | document ingestion |
| Sandbox | around 80% | claims extracted from those sources, unverified | extraction over Sources |
| Truth | 100% | verified facts, with who attested them and when | promotion from Sandbox |

The movement runs one way: Sources to Sandbox to Truth. Each step adds confidence and leaves a trail. Confidence is earned, not declared.

States, surfaced per plane by ARP-1419: ingestion or extraction in progress, without blocking the tab; a record with no associated documents has all three planes empty, which is normal; ingestion or extraction failure declared per plane; and success.

Edge cases and open questions. What makes a fact "verified", meaning who or what attests and with what evidence, is the central question of this ticket and today it has no answer written down anywhere. Promotion from Sandbox to Truth is blocked by ARP-1426. Conflicting claims, where two sources assert different things about the same field, are still to be defined: most recent wins, most confident wins, or it stays an explicit conflict. A Truth fact that is invalidated is also to be defined: drop to Sandbox, mark revoked, or disappear. If it disappears, the trail that we once asserted it is lost.

The pipeline does not bypass permissions: a claim extracted from a governed document inherits its restriction. Granting someone access to the plane does not grant access to the source document.

### Scope & Acceptance Criteria

- The three planes populate with real per-record content
- A Truth fact is traceable to its document and its attestation
- Promotion leaves a trail
- Source document permissions are inherited by derived claims
- [ ] A record with associated documents shows three planes populated with that record's content
- [ ] A Truth fact shows who or what verified it, when, and which document it came from
- [ ] A Sandbox claim shows that it is unverified and which source it came from
- [ ] A promoted claim shows the moment of promotion and who did it
- [ ] A record with no associated documents shows three empty planes with their explanation, not an error

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]. Blocked by ARP-1426 and by defining what "verified" means.

---

## Decision tickets

The four below build nothing. They exist so that a blocking decision has an owner, a date and a trail, instead of living buried in an Open questions section. Close them before estimating ARP-1408.

---

## ARP-1424 - Decision: inference leakage, an insight derived from a governed field

**Version** - v2.1 - P2 - the first of the four

The most important decision in this Feature. It is the only one that, resolved badly, produces a security incident rather than a UX bug.

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/05-profile-intelligence.jpg` shows the `Held` state the prototype proposes as an answer.

### User Story

As a platform owner, I want an inferred insight to respect the same boundaries as the data it came from, so that masking a field actually protects it.

### Description

The UCP's whole permission model rests on masking values: a governed field is visible, with its label, but its value is hidden and the permission that would open it is named.

Inference breaks that. A summary generated from a masked field can reveal its content without ever displaying it.

| What the user sees | What the summary says |
|---|---|
| `Negotiated price: ******` | "The margin on this deal is well below the regional average." |
| `Salary: ******` | "This employee is above the band for their level." |

Masking was respected, and the data leaked anyway.

Three things have to be defined. First, engine scope: does the engine run with the viewer's scope, so it cannot read what the viewer cannot read, or with full scope and then filter the output? The first is the only robust defence; the second is cheaper and fails silently. Second, what happens to a full-scope insight with a restricted viewer: withheld with a reason on the `Held` pattern from ARP-1423, degraded to a version without the data, or not generated at all. Third, provenance: if an insight rests on a governed field, can we even show that the field participated, without revealing its value?

This blocks because it changes the engine's architecture, not just its presentation. Running per viewer means the result cannot be cached across users with different permissions, which is a requirement you need to know before designing, not after.

What we know. It already happened to us, in miniature: in one version of the prototype a vehicle's price was masked in the header and visible in the commercial widget, because each surface declared masking on its own. It was fixed by unifying the predicate in `viewerScopes.ts`. Inference is the same class of error one level up, and that one is not fixed by a shared predicate. The live prototype proposes `Held` as an answer, but it is not confirmed that this is its purpose. The standing recommendation is to take the safer option when in doubt.

Blocks ARP-1421 and ARP-1418, and touches ARP-1422 for claims derived from governed documents.

### Scope & Acceptance Criteria

- [ ] ARP-1408's Decisions log states what scope the engine runs with
- [ ] It states what happens to an insight that cannot be shown to this viewer
- [ ] It states whether provenance may name a governed field
- [ ] The tickets that implement each part are identified

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

## ARP-1423 - Decision: is the Held state configurable policy or an engine rule?

**Version** - v2.1 - P2, before the tickets it blocks

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/05-profile-intelligence.jpg` shows the state and its reason.

### User Story

As a team about to build the withholding behaviour, I want to know which ticket owns it, so that it is built once and by the right owner.

### Description

The live prototype shows suggestions in a `Held` state, with the reason visible: "Held - a migration delivery date is not attested yet". The behaviour is correct and well resolved. What we do not know is where it comes from.

| If it is | Then |
|---|---|
| Configurable policy | it lives in ARP-1420. An Admin defines which conditions withhold a suggestion, and can change them per tenant |
| A fixed engine rule | it lives in ARP-1421. The engine decides to withhold based on its own attestation logic, and ARP-1420 only reflects it |

It blocks because it determines which ticket builds it. If nobody decides, it gets built twice or not at all. It also determines whether a customer can loosen the withholding: if it is configurable, someone can switch it off, and that has to be designed deliberately rather than discovered.

What we know. The state exists and works in the prototype, with a human-readable reason. That reason references attestation, which is Truth plane vocabulary, suggesting the engine consults the data's verification state. It is not documented anywhere, and we do not know who built it or with what intent.

Blocks ARP-1418, ARP-1420, and partially ARP-1421.

### Scope & Acceptance Criteria

- [ ] The decision is written, with its reason, into ARP-1408's Decisions log
- [ ] The ticket that implements it is identified

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

## ARP-1426 - Decision: is a claim promoted to Truth from the profile or only from Governance Studio?

**Version** - v2.1 - P2

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/06-profile-knowledge.jpg`. The prototype shows no promotion control at all.

### User Story

As a team about to build the Knowledge tab, I want to know whether it writes to governance state, so that we design a reading surface or a writing one, not both.

### Description

A claim lives in Sandbox until someone verifies it and it moves to Truth. The question is where that act happens.

| If it is | Consequence |
|---|---|
| From the profile, in the Knowledge tab | whoever works the record promotes in context, with the data in front of them. Fast, and knowledge stays current because the person who knows is the one doing it. But it turns the UCP into a governance write surface |
| Only from Governance Studio | verification is a deliberate act, with its own surface and its own audit. The UCP stays read-only. But knowledge falls behind if nobody goes to the Studio |

What the answer drags with it. If promotion happens in the profile, Knowledge stops being read-only and needs a promotion permission in ARP-1420, a confirmation flow, and a record of who promoted and on what evidence. If it is Studio-only, Knowledge needs at least a way out, such as "request verification of this claim", or the user sees something unverified with nothing they can do about it. A read-only plane with no way out is a dead end.

It blocks because it defines whether ARP-1419 has a write flow. That is the difference between a reading tab and one that touches the tenant's governance state.

What we know. The canon defines the three planes and their confidence levels but does not say where promotion happens. All three Access and Permissions companions exclude "promoting claims from the profile" from this release, which means today the default answer is "Governance Studio only" by omission, not by decision.

Blocks ARP-1419, ARP-1422, ARP-1420.

### Scope & Acceptance Criteria

- [ ] ARP-1408's Decisions log states where promotion happens
- [ ] If it is Studio-only, it states what way out Knowledge offers for an unverified claim

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

## ARP-1425 - Decision: Sources vs Drives, one plane with two names on screen

**Version** - v2.1 - P2, resolvable in a single conversation

### Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/03-profile-overview.jpg` and `screenshots/06-profile-knowledge.jpg` together are the evidence.

### User Story

As a user reading a record's knowledge, I want one name for each plane, so that the name tells me how sure the system is rather than where the files sit.

### Description

In the live prototype, on the same record:

| Surface | What it calls the third section |
|---|---|
| The Overview's KNOWLEDGE widget | Sources |
| The Knowledge tab | Drives |

It is the same plane.

The proposed resolution. The canon (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`) is explicit: the plane is called Sources, the third confidence level at around 60%, raw documents; the Source Drives are the container that feeds it, "documents and folders from your company's shared drives". Which means the Overview is right and the tab is misnamed. Build it as Sources.

It was not closed unilaterally because whoever carried the prototype forward may have had a reason we do not know. Confirm before building.

Why it matters more than it looks. The name is the confidence promise. "Drives" says where the files are; "Sources" says how sure we are about what is inside them. The whole tab exists to communicate confidence levels, so using the container's name instead of the plane's name breaks exactly that.

Blocks ARP-1419, ARP-1422, and the Overview widget in ARP-1414.

### Scope & Acceptance Criteria

- [ ] One name for the plane across all three surfaces
- [ ] Confirmed with whoever carried the prototype forward
- [ ] Written into ARP-1408's Decisions log

### Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]
