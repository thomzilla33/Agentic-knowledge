# 02 - Decisions and why

Every decision with the reason that holds it up. If anyone wants to reverse one, this is the argument they have to knock down.

---

## A. Profile architecture

### The tab strip is a contract, not a screen

It is defined **once** and every published entity receives it: `Overview / Activity / Intelligence / Knowledge`, plus industry modules at the end.

**Why:** the alternative is someone deciding by hand which tabs each type gets. With three types that holds; with vehicles, dealerships, policies, assets and whatever each industry brings, it does not. And it produces profiles that navigate differently by type, which is exactly the problem a *unified profile* exists to solve.

**Consequence:** adding a fifth base tab is a contract change, not a feature. And this **blocks ARP-468**: you cannot build the widget canvas without knowing where it lands.

### Overview is the only customisable tab

The other three are fixed.

**Why:** Overview answers "what should I be looking at here", and that changes with each person's work. Activity, Intelligence and Knowledge answer questions with a single correct answer - what happened, what the AI inferred, what we are sure of. Customising those only produces incomplete versions of the truth.

### Industry modules go after Knowledge, never interleaved

**Why:** if a pack can insert itself among the base tabs, a user working two industries sees two different navigations. A stable order is worth more than local relevance.

### Each Overview widget loads and fails on its own

**Why:** a canvas that waits on the slowest widget feels broken even when it works. And a failing widget must not take the screen with it: the user can still work with the rest.

### The type's own widget goes before the studio widgets

**Why:** it answers "what is this". That reads before "how sure are we about this".

---

## B. Naming

### Activity (this view) vs Audit (the governance one)

They are named differently because they are different things, with different audiences.

| | Activity | Audit |
|---|---|---|
| Answers | What is happening with this entity? | Who changed what, when, from where? |
| Read by | whoever works the record | compliance and security |
| Contains | communications, notes, events, tasks | system events with IP, session ID, before and after |

**Why Activity was not renamed to Timeline, History or Log:** **pending tasks** break every past-tense candidate. An assigned task is not history, it is work. A past-tense name lies about a quarter of its content.

**What Edgardo said** - "always leave Activity last" - refers to the **audit log**, not to this view. Confirmed by reading the surrounding transcript. The recommendation is to rename *that one* to Audit so the two stop colliding.

### `Next Best Action`, not `AI Read`

**Why:** *AI Read* describes who produced it. *Next Best Action* describes what to do with it. The user does not need to know a model wrote it; they need to know what comes next.

**A deliberate edge case:** with no next best action, **there is no card**. Not empty, not filled with placeholder text. The absence is the signal - if there were something to do, it would be there.

### The tag for the `person` type reads **Customer**, not "Person"

**Why:** it describes what the record is in the business, not what kind of object it is in the data model.

### The module is called **Universal Entity Profile**

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

### Sources is the plane; Source Drives is what fills it

The canon's three planes: **Truth** (100%, verified facts), **Sandbox** (around 80%, pending claims), **Sources** (around 60%, raw documents).

**Why it matters:** the live prototype confuses them - the Overview says *Sources* and the tab says *Drives*. The canon rules: the plane is Sources, and the Source Drives are the folders and documents from the company's shared drives that feed it. See [`01-STATE.md`](01-STATE.md) and ARP-1425.

---

## C. List and filters

### Filters are per type, with counts

Each type publishes its own set of facets: a customer filters by account, an employee by department, a company by industry. Chosen by **frequency of use**, per `docs/FILTERS_SPEC.md`.

### An option with zero results is disabled, not removed

**Why:** an option that disappears tells the user it does not exist. A disabled one with a zero count tells them it exists and their current filter emptied it. The second is information; the first is noise.

### Changing type clears the filters and says so

**Why:** facets are not the same across types. Dragging a "department" filter into a list of companies produces results nobody asked for. They are cleared - and the clearing is stated, so the user does not think the filter is still applied.

### Never an empty state and pagination at the same time

A design system rule. They are two contradictory messages: "there is nothing here" next to "page through it".

### The CTA names what it will create

*Create New Customer / Employee / Company*, following the active type. Not a generic *Create*.

---

## D. Permissions and governance

### A governed record is listed, marked. It is not hidden

**Why:** the record's existence is rarely the secret; its values are. Hiding it stops the user knowing it exists and asking for access. Marking it tells them which permission would open it.

### Disabled with a tooltip, not hidden

Hiding is reserved for **three cases**: purchases, billing, and platform-level irreversible actions.

> **This decision reverses an earlier one of mine.** I had argued the create button should be hidden without permission, "because creating is not an action worth advertising to someone who cannot do it". That is wrong: creating a record is none of the three cases. The ticket audit caught it and it was corrected in ARP-1411 and ARP-1412. **If anyone proposes hiding it again, this is the argument they have to knock down.**

### Tooltip copy is written once

It lives in ARP-1412 and ARP-1417. **Why:** without canonical copy, each developer invents their own and the platform ends up with five wordings for the same thing.

### A permission that cannot be verified is translated into what the user sees

Never `deny by default` as an acceptance criterion. QA cannot build a test out of security jargon.

> Not this: "When the permission cannot be verified, nothing executes - deny by default."
> This: "When the platform cannot confirm a user's permissions, the user sees no record content and sees a message explaining that they should retry or contact their administrator."

The behaviour is the same. The difference is that the second is verifiable.

### A governed value is masked inside the widget; the widget stays visible

**Why:** hiding the whole widget tells the user less than they need. They see the field, its label, that it is locked, and which permission opens it.

> **A real bug this prevented:** in one version of the prototype a vehicle's price was masked in the header and **visible** in the commercial widget. The cause was that each surface declared masking on its own. It was unified: both now derive from the same predicate (`viewerScopes.ts`), so granting the scope uncovers both or neither.

---

## E. Delivery scope

### Only Contacts, Employees and Companies

**Why:** they are the three types that exist in production today. The rest arrive with the type platform (ARP-468), and pulling them in now forces us to build the type catalogue before we have a profile that works.

### Intelligence and Knowledge are created now, and are no longer tagged as a later round

**Why:** if only the Overview and Activity tickets exist, somebody will build a two-tab profile and believe they are finished. The tickets exist so the contract reads complete from the board.

The `[Next Round]` tag was removed on 2026-09-11: this is active work for Lex and JJ. Priority stays at P2 so it does not compete with the v2.0 delivery.

### The delivery is structured as Features under the existing Boulder

No new Boulder was created. **Why:** ARP-375 is already the UCP's Boulder and already has ARP-376 (v1, Done) hanging off it. A new Boulder would split the module's history in two.

**Separately, and unresolved:** ARP-468 and ARP-520 are two different breakdowns of the same platform, with 8 and 7 sub-features respectively. One of the two is surplus. If their blocks also deserve to be Features, the parent would have to be a Boulder - but that is a size judgement, not a mandatory correction: today they are `Version`, which is legal. See [`06-OPEN-ITEMS.md`](06-OPEN-ITEMS.md).

### The ticket template follows Work Queues

All 21 descriptions were rewritten into the five-section template that ARP-927 and its children use: Prototype Link, User Story, Description, Scope and Acceptance Criteria, Parent Feature Reference. Features add a Sub Feature Breakdown and point at a Parent Boulder.

**Why:** two canonical templates were in circulation, the five-section one from the `jira-arp-ticket-creator` skill and a thirteen-section one from `aims-os-prd-to-tickets`. Work Queues settles it: the five-section one is the house standard, and ours was the outlier. Same tree, one reading experience.

---

## F. Smaller interface decisions, with their reason

| Decision | Why |
|---|---|
| The entity header is pinned on scroll | Otherwise the user loses sight of whose record they are reading |
| The row menu opens to the left | It was clipping against the right edge |
| Avatars for customers and employees; an icon for companies | A company has no face |
| The next-best-action card is the size of its text | A fixed-height card with two lines inside reads as a layout error |
| The type catalogue is a dropdown with a search field, not a slide-out | A slide-out to pick from a list is disproportionate. "See all" opens a marketplace-style modal |
| "Browse all N types" is pinned to the foot of the dropdown | The one row that leads somewhere else was the one you had to scroll to find |
| The studios are still called "studios" | Edgardo proposes renaming them to **Apps**. Unresolved - see [`04-EDGARDO-REVIEW.md`](04-EDGARDO-REVIEW.md) |
