# 06 - Open items

Ordered by what blocks the most people.

---

## A. One question for the team, and a rename

Describing these operations turned up something that changes the picture: **ARP-520 is not an empty duplicate of ARP-468. It has 7 sub-features of its own**, and they are a cleaner breakdown than ARP-468's 8.

### A1. Which of the two is live, ARP-468 or ARP-520?

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

### A2. Promoting ARP-468 to Boulder - worth discussing, not forced

The original argument was that "a Feature cannot contain Features", so ARP-468 could not represent its ten blocks. True but irrelevant: **those blocks already exist as `Version`, which is perfectly legal.** There is nothing broken to fix.

The real question is one of **size**: if "Widget Runtime", "Admin Layout Builder" and "Permissions Enforcement" are each Feature-sized, then they deserve to be Features and the parent should be a Boulder. That is the team's judgement.

### A3. Renaming ARP-375 - done on 2026-09-11

ARP-375 went from "Unified Contact Profile" to **"Universal Entity Profile"**, matching the name ARP-468 and ARP-520 already used. See the naming section in [`02-DECISIONS.md`](02-DECISIONS.md).

**What is left of it:** the body of ARP-375 still calls the module **"UCIH"**, an acronym that appears nowhere else. I did not touch it - it is someone else's text and may mean something I do not know. Worth asking.

---

## B. What blocks estimation

| What | Ticket | Who closes it |
|---|---|---|
| **The design of the note composer.** The prototype covers how notes are read, not how they are written | [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) | Design |
| **Pending tasks in the thread: mixed in or pinned above?** The only open item that changes the design of a mandatory tab | [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) | PM and design |
| **None of the 21 is estimated** | all | The team |
| **Intelligence and Knowledge** - the engine and the pipeline did not exist in the tree; now they do, and the 4 blocking decisions each have a ticket | [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) and its children | **Lex and JJ** - see the [brief](https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a) |

---

## C. What has to be confirmed with other people

### With whoever carried the prototype forward on Vercel

1. **Sources vs Drives.** The Overview and the Knowledge tab use two names for the same plane. The canon says it is `Sources`. Was it an oversight or is there a reason? Now tracked as [ARP-1425](https://aims-os.atlassian.net/browse/ARP-1425).
2. **`Ask about this entity` vs `Ask about this company`.** Our per-type variant disappeared. A deliberate simplification?
3. **The `Held` state.** Is it governance policy or demo behaviour? Now tracked as [ARP-1423](https://aims-os.atlassian.net/browse/ARP-1423).
4. **Policies and Assets.** They appear as types in the rail, outside the scope we closed. Where did they come from and who asked for them?

### With Edgardo Sierra

5. **Nothing blocking.** His review is of the Admin Console. The only thing that touched the UCP was the name collision between his *audit log* and our Activity tab, and that is resolved (ARP-1407, ARP-1415). See [`04-EDGARDO-REVIEW.md`](04-EDGARDO-REVIEW.md) for why the other three points that looked like they applied do not.
6. **For when the UCP has an audit view:** the component is designed once and replicated identically, not redesigned per surface. It is not in this delivery.

### With Michael

7. **Hide versus lock for types the role cannot read.** The tenant policy exists in the tickets, but which one is the default has not been decided.
8. **`StudyWidget` and `ConnectionsContent` are duplicated** with `pm-thomas-universal-profile.tsx`.
9. **`record-header.tsx` was modified** while four `ds/record-header-*` branches were active. Possible collision.
10. **`Request access` is a stub.** The CTA exists; the flow does not.

### About the Jira board

11. **ARP-1406, ARP-1407 and ARP-1408 have moved from Backlog to "Draft Boulder".** Nobody moved them by hand from this side. Either an automation fires on edit, or someone is working the board. Worth confirming before assuming the status means what it says.

---

## D. What was left undone and does not block

- **The PR in the design system repo.** This session never obtained push permissions to `cachilupis/aims-os-design-system` - four routes were checked, all closed. The work arrived by another route anyway (it is on `main` and deployed to Vercel), so the PR stopped being necessary. If anyone wants clean history, the patches are in `ucp-ds-screens/`.
- **Watch subscriptions on the artifacts.** This session's gateway returns 404 when registering one. Nobody will be notified if someone comments on the published pages.
- **Assigning ARP-1408 and its children to Lex and JJ in Jira.** They are named as owners in the ticket text and in the brief, but the Jira assignee field is empty. Deliberate - assigning was not chosen - but worth doing when they pick it up.
- **The transcripts** that were going to be shared for extra context never arrived. Everything here is sourced from the tickets, the prototype and the 2026-09-03 review.

---

## E. If someone wants to keep building the prototype

Read [`05-REPLICATION.md`](05-REPLICATION.md) first, especially:
- the design system rules that make the ratchet fail on pre-push
- that `viewerScopes.ts` is the **single** owner of viewer permission - duplicating it reintroduces the bug where a value is masked on one surface and visible on another
- the `MenuItem` geometry, which is the most expensive thing to rediscover
- the screenshot capture workaround, if you need fresh captures after a deploy
