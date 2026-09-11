# 03 - The 21 tickets, and why each one exists

**21 tickets** under the Boulder [ARP-375 - Universal Entity Profile](https://aims-os.atlassian.net/browse/ARP-375), none estimated. The 15 originals from 2026-09-11, plus 6 created the same day on finding that the tree covered nothing that feeds Intelligence and Knowledge.

The full text of all 21, in the template they now carry, is in [`07-TICKETS-FOR-DELIVERY.md`](07-TICKETS-FOR-DELIVERY.md).

## The ARP hierarchy, so nobody gets it wrong creating more

```
Boulder   (level 3)   <- ARP-375
  Feature (level 2)   <- ARP-1406, ARP-1407, ARP-1408
    Version (level 1) <- what we call "Sub Feature". NOT the product version
      Story / Bug (level 0)
```

**A Feature cannot contain another Feature.** Its children can only be `Version`. When creating one through the API, always pass `Version`; "Sub Feature" is rejected.

## Product versions

| Version | Contents | Status |
|---|---|---|
| UCP v1 | ARP-376, facelift | Done |
| **UCP v2.0** | ARP-1406 and ARP-1407 with their children, 11 tickets | **This delivery** |
| UCP v2.1 | ARP-1408 with its children, 10 tickets | Active, P2 |
| - | ARP-468, type platform, canvas, widgets, packs | Separate |

**Labels:** `ucp-v2-0` on the eleven, `ucp-v2-1` on the ten, `access-permissions` on the three companions, `decision` on the four decision tickets.

---

# Feature 1 - [ARP-1406](https://aims-os.atlassian.net/browse/ARP-1406) - List

> **Why it exists:** the unified profile has no front door. Without a list to open a record from, the profile is a screen nobody reaches.

### [ARP-1409](https://aims-os.atlassian.net/browse/ARP-1409) - List by type
The list, and the point any profile is opened from. **Why it is its own ticket:** it concentrates the rules for what a row shows and how a governed record is marked, decisions that apply to every type.

### [ARP-1410](https://aims-os.atlassian.net/browse/ARP-1410) - Pagination
**Why it is its own ticket:** it carries a rule that breaks on its own if buried inside the list ticket - never an empty state and pagination together - and a reset that has to fire at four different points (type, filter, sort order, page size).

### [ARP-1411](https://aims-os.atlassian.net/browse/ARP-1411) - Create via stepper
**Why it is its own ticket:** it is the only creation flow and has its own error model (nothing entered is lost).
**Corrected in review:** the criterion said "goes to the list **or** to the profile" - QA cannot decide which. It now goes to the new record's profile. And the create button moved from hidden to **disabled with a tooltip**.
**Open items:** the stepper frames, duplicate detection, confirmation on cancel.

### [ARP-1412](https://aims-os.atlassian.net/browse/ARP-1412) - Access & Permissions
**Why it exists:** no Feature enters a sprint without its companion. This is where the platform's **canonical tooltip copy** lives.

---

# Feature 2 - [ARP-1407](https://aims-os.atlassian.net/browse/ARP-1407) - Profile: tab contract, Overview and Activity

> **Why it exists:** it fixes the tab contract every published entity receives, and delivers the two mandatory tabs.
> **Blocks [ARP-468](https://aims-os.atlassian.net/browse/ARP-468)** - you cannot build the canvas without knowing where it lands.

### [ARP-1413](https://aims-os.atlassian.net/browse/ARP-1413) - Tab contract and industry extension
Not a screen: it is the component every profile screen mounts. **Why it is its own ticket:** it is the piece that blocks ARP-468, and mixing it into Overview would hide that dependency.
**Open item:** what happens when industry modules overflow the width.

### [ARP-1414](https://aims-os.atlassian.net/browse/ARP-1414) - Overview
The configurable dashboard. **Depends on ARP-468** for the canvas and widget runtime; this ticket defines the behaviour on top of that canvas.
**The best of the set** per the audit, with no open items. What saves it is that states are specified per widget, not per screen.

### [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) - Activity
Communications, notes, events and tasks in one thread.
**Why the criteria close per activity kind:** the four sources will not be ready at once. The ticket allows phased delivery without being left half-done.
**Open item, and it carries design weight:** pending tasks are not the past. Mixing them into a chronological thread puts two reading modes together. Proposal: pin them above. **It is the only open item that changes the design of a mandatory tab** - close it first.

### [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) - Notes
> **The most fragile piece of the delivery.** It is the profile's only write flow, and the prototype only covers how notes are **read**, not how they are **written**.

**Corrected in review:** criterion 2 depended on an open item inside the same ticket (does the field disappear or is it disabled for a non-owner?). Closed: **disabled with a tooltip**.
**Still missing:** the design of the composer. It cannot be estimated without that.

### [ARP-1417](https://aims-os.atlassian.net/browse/ARP-1417) - Access & Permissions
Who sees each tab, who assembles their Overview, who writes notes. With the profile's tooltip copy.

---

# Feature 3 - [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) - Intelligence and Knowledge

> **Owners: Lex Paniagua and Julian Johnston.** [Dedicated brief](https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a) - read it before picking up any child.

**Why this is the real open work:** Overview and Activity **read** sources that already exist. Intelligence and Knowledge need something to **produce** their content first, and that does not exist. In the prototype it is fixed text.

> **Scope change, 2026-09-11.** The original version of this Feature said "this Feature shows them, it does not produce them" and left the engine and the pipeline **outside every ticket in the tree**. That left the two tabs with no way to exist: anyone picking up ARP-1418 or ARP-1419 would build a mock-up and be unable to close it. Scope was widened and the two missing tickets were created.
>
> The `[Next Round]` tag also came off all four titles: this is active work, not backlog. Priority stays at P2 so it does not compete with the UCP v2.0 delivery.

## What produces the content - the two that were missing

### [ARP-1421](https://aims-os.atlassian.net/browse/ARP-1421) - Inference engine (new)
Produces the five insight kinds - summary, signals, tags, next-best actions, deductions - each with confidence and provenance. **Two requirements that are not obvious:** the engine runs with the viewer's scope (what it cannot read, it cannot infer), and inference is **reproducible** - an insight that changes without the data changing is a bug.

### [ARP-1422](https://aims-os.atlassian.net/browse/ARP-1422) - Claims pipeline (new)
Populates the three planes and moves claims between them, one way only: **Sources to Sandbox to Truth**, leaving a trail at each step. **The central question that today has no written answer anywhere:** what makes a fact "verified" - who or what attests, and with what evidence.

## The tabs

### [ARP-1418](https://aims-os.atlassian.net/browse/ARP-1418) - Intelligence
The presentation. All AI output grouped into one tab instead of one per insight kind. Carries the prototype's **`Held`** state, which withholds a suggestion while showing the reason.

### [ARP-1419](https://aims-os.atlassian.net/browse/ARP-1419) - Knowledge
The three planes with their declared confidence. Carries the Sources-vs-Drives inconsistency written in as blocking.

### [ARP-1420](https://aims-os.atlassian.net/browse/ARP-1420) - Access & Permissions
Who sees each insight and each plane, with the tooltip copy written out.

## The four decisions, now each with its own ticket

They used to live buried in *Open questions* sections, where nobody closes them. In the order that constrains the rest:

| Ticket | Decision | Why it matters |
|---|---|---|
| [ARP-1424](https://aims-os.atlassian.net/browse/ARP-1424) | **Inference leakage** | The only one that, resolved badly, produces a security incident rather than a UX bug. A summary can reveal a masked field without ever showing it. It changes the engine's architecture |
| [ARP-1423](https://aims-os.atlassian.net/browse/ARP-1423) | Is `Held` policy or an engine rule? | Determines **which ticket builds it**. Undecided, it gets built twice or not at all |
| [ARP-1426](https://aims-os.atlassian.net/browse/ARP-1426) | Where is a claim promoted to Truth? | Defines whether Knowledge has a write flow. Today the answer is "Governance Studio only" **by omission, not by decision** |
| [ARP-1425](https://aims-os.atlassian.net/browse/ARP-1425) | Sources vs Drives | The canon already resolves it; it remains to confirm with whoever carried the prototype forward |

---

## What was corrected before publishing

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

## The two competing templates, now resolved

Two canonical templates were in circulation, both declared locked:

| | `jira-arp-ticket-creator` | `aims-os-prd-to-tickets` |
|---|---|---|
| Feature | 6 sections: Prototype Link, User Story, Description, Scope, Sub Feature Breakdown, Parent Boulder Reference | 13 sections |
| Version | 5 sections: Prototype Link, User Story, Description, Scope & Acceptance Criteria, Parent Feature Reference | 13 sections |

The 21 tickets were first written in the thirteen-section format, because that is what `aims-os-ticket-reviewer` audits against.

**Work Queues settles it.** ARP-927 and its children, ARP-929 among them, follow the five-section template exactly. That is the house standard, and ours was the outlier.

**All 21 descriptions were converted on 2026-09-11.** Nothing engineering needs was dropped: the screen states, the canonical tooltip copy, the edge cases, the items still to be defined and the decisions each live inside Description or Scope and Acceptance Criteria rather than in numbered sections of their own. Every ticket also carries its prototype link and the screenshot that shows it.

## Corrections applied on 2026-09-11

Three titles were created with an escaped ampersand (`Access &amp; Permissions`, visible as literal text). Corrected on ARP-1412, ARP-1417 and ARP-1420.
