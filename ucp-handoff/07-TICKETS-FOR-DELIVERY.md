# UCP delivery pack - all 21 tickets

**For:** Lex Paniagua and Julian Johnston
**Boulder:** [ARP-375 Universal Entity Profile](https://aims-os.atlassian.net/browse/ARP-375)
**Date:** 2026-09-11

Every ticket below follows the same five-section template Work Queues uses (ARP-927 and its children), so nothing here should read as a different house style.

## Prototype

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

## The shape of the tree

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

## Read this before picking up ARP-1408

Overview and Activity read sources that already exist. Intelligence and Knowledge do not: one needs an inference engine, the other a claims pipeline, and the original tree had a ticket for neither. Six tickets were added to close that gap. The full argument is in the brief: https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a

Four decisions block the build. In the order that constrains the rest: ARP-1424 (inference leakage), ARP-1423 (the Held state), ARP-1426 (claim promotion), ARP-1425 (Sources vs Drives).

---

# ARP-1406 - List: entity list, pagination and creation

**Feature** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/01-roster-all.jpg`

## User Story

As a user who needs to work on a record, I want to find it in a list and open it, so that I do not depend on someone sending me a link.

## Description

The unified profile has no front door. There is no list a record can be opened from today, and no consistent way to create one. Without that, the profile is a screen nobody reaches.

This Feature delivers the entry point for Contacts, Employees and Companies: the list, its search and filters, pagination, and creation through a stepper. Every other entity type, the type switcher with its catalogue, and the mixed list across types arrive with the platform work in ARP-468.

Two questions are still open: whether the user can change page size or it is fixed, and whether search crosses all three types or only the active one. In the prototype it is only the active one.

## Scope

- List of Contacts, Employees and Companies, each with its record count
- Search, per-type filters, sorting, pagination
- Creation through a stepper
- Navigation into a record's unified profile without losing the list
- Loading shows row skeletons with the type selector and create button already visible
- Empty shows the create button, or the way out of a filter when one is applied
- Error offers retry and leaves the type selector usable

## Sub Feature Breakdown

- ARP-1409 List by type - the list itself and the point any profile opens from
- ARP-1410 Pagination - moving through lists longer than one screen
- ARP-1411 Create via stepper - the guided flow for adding a record
- ARP-1412 Access & Permissions - which types each role sees, and who can create

## Parent Boulder Reference

[Linked: ARP-375 - Universal Entity Profile]

---

# ARP-1409 - List by type

**Version** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/01-roster-all.jpg` and `screenshots/02-roster-employees.jpg`

## User Story

As a user, I want to see the records of a type with their context information, so that I can recognise the one I am looking for without opening it.

## Description

The list of records of one type, and the point any profile is opened from.

The user sees the types All, Customers, Employees and Companies, each with its count, a search box, visible filters for the active type, and a create button that names what it will create. Each row carries the name, an avatar or icon depending on type, the record ID, the source system, the status, and secondary metadata such as role and company, owner, verified facts and assigned agent.

Three conditions matter. A governed record the role cannot read is still listed and marked: the restriction is on the values, not on the record's existence. A record created inside the platform has no source system, and that slot is removed rather than filled with placeholder text. A type with no records shows an empty state with the create button.

The tag for the `person` type reads Customer, not Person. It describes what the record is, not what the row is.

## Scope & Acceptance Criteria

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

## Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

# ARP-1410 - Pagination

**Version** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see the footer in `screenshots/01-roster-all.jpg`

## User Story

As a user with hundreds of records, I want to move through them by page, so that I do not wait on an endless list or lose my place.

## Description

The control that lets a user move through lists longer than one screen without losing track of where they are: a rows-per-page selector, the current range over the total, and previous and next controls.

One rule is absolute and easy to break: never an empty state and pagination at the same time. They are two contradictory messages. This is a design system rule, not a preference.

Any change of type, filter or sort order returns pagination to page one.

Still open: whether the control is shown or hidden when results fit on a single page.

## Scope & Acceptance Criteria

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

## Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

# ARP-1411 - Create via stepper

**Version** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the create button is visible in `screenshots/01-roster-all.jpg`. The step-by-step frames are not in the prototype and are still to be defined.

## User Story

As a user who has just met someone outside the system, I want to add them in guided steps, so that I do not get the fields or the type wrong.

## Description

The guided flow for creating a new record inside the platform.

Entering from All, the first step asks for the type. Entering from a specific type, the type is fixed and that step does not appear. Then come the fields for that type, then a summary before confirming.

A record created here has no source system, because it was born in the platform. The stepper says so explicitly: its facts start in the Sandbox plane and are promoted once verified.

On confirm the user goes to the new record's profile, not back to the list. They have just added it and the next thing they want is to complete it.

Without create permission the button is shown disabled with a tooltip, not hidden. Creating a record is not a purchase, not billing, and not a platform-level irreversible action, which are the three cases the standard reserves hiding for. An earlier version of this ticket hid it; that was wrong.

Still open: whether a duplicate is detected and flagged or simply allowed, and whether cancelling with data entered asks for confirmation.

## Scope & Acceptance Criteria

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

## Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

# ARP-1412 - Access & Permissions: List

**Version** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/01-roster-all.jpg` shows the list as a full-access role sees it. The prototype has no role switcher, so none of the restricted states below can be seen in it.

## User Story

As an administrator, I want each role to see only the entity types it is entitled to, so that people are not shown records they cannot work with.

## Description

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

## Scope & Acceptance Criteria

- Type visibility per role, recalculated on the next load after a role change
- Governed records listed and marked rather than hidden
- Disabled controls with the canonical tooltip copy above
- Removing a type from a role does not delete records; another role still sees them
- [ ] A People Ops user sees Employees and does not see Customers or Companies
- [ ] A user without create permission sees the create button disabled with the tooltip naming the permission
- [ ] A governed record shows that it exists and which permission opens its values
- [ ] Removing a type from a role hides that type for its users on their next load
- [ ] When permissions cannot be confirmed, the user sees no records and a message telling them to retry or contact their administrator

## Parent Feature Reference

[Linked: ARP-1406 - List: entity list, pagination and creation]

---

# ARP-1407 - Profile: tab contract, Overview and Activity

**Feature** - v2.0 - P1 - **Blocks ARP-468**

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/03-profile-overview.jpg` and `screenshots/07-company-overview.jpg`

## User Story

As a user who works across several types in a day, I want every profile to have the same tabs in the same order, so that I do not relearn the navigation on each type.

## Description

Today each entity type needs someone to decide by hand which tabs its profile has. That does not scale, and it produces profiles that are inconsistent between types. This Feature fixes the backbone every published entity receives, and delivers the two mandatory tabs.

The strip is Overview, Activity, Intelligence, Knowledge, in that order, on every type. Industry modules go after Knowledge, never interleaved. The company screenshot shows this working: People appears as a fifth module, after the base four.

The strip is a platform contract, not a screen. It is defined once and applied to every published entity, which is why it blocks ARP-468: that ticket builds the canvas, the widgets and the packs that land on this contract, so it cannot close first.

Overview is the only customisable tab. The other three are fixed.

This view is called Activity. The governance view, the audit log, is a different thing with a different audience, and is renamed Audit so the two stop colliding. Edgardo Sierra's note about leaving Activity last referred to the audit log, not to this.

Three questions are open: what the governance view is finally called, whether pending tasks belong inside the chronological thread or pinned above it, and whether an industry pack can contribute more than one module and who orders between them.

## Scope

- The four-tab contract, applied to every published entity with no per-type configuration
- The extension point where industry modules attach, after Knowledge
- Overview and Activity with their four activity kinds, plus notes
- Header and strip pinned on scroll
- Not included: Intelligence and Knowledge (ARP-1408), and the drag-and-drop builder, widget catalogue and pack installer (ARP-468). This Feature defines where they land; ARP-468 defines how they are built.

## Sub Feature Breakdown

- ARP-1413 Tab contract and industry extension - the navigation component every profile mounts
- ARP-1414 Overview - the configurable dashboard
- ARP-1415 Activity - communications, notes, events and tasks in one thread
- ARP-1416 Notes - the profile's only write flow
- ARP-1417 Access & Permissions - who sees each tab, who writes notes

## Parent Boulder Reference

[Linked: ARP-375 - Universal Entity Profile]

---

# ARP-1413 - Tab contract and industry extension

**Version** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/07-company-overview.jpg` shows the strip with an industry module attached

## User Story

As a user, I want the profile navigation to be identical across every type, so that I can move around without thinking.

## Description

This is not a screen. It is the navigation component every profile screen mounts. It defines which tabs exist, in what order, and where what the packs contribute plugs in.

The strip sits below the header with the four base tabs and, where they exist, the industry modules after them. The active tab is marked. Strip and header stay pinned on scroll.

The strip is frozen once. Adding a fifth base tab is a contract change, not a feature.

Still open: what happens when industry modules overflow the width. Overflow behind a "more" control, horizontal scroll, or a cap per pack.

## Scope & Acceptance Criteria

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

## Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

# ARP-1414 - Overview

**Version** - v2.0 - P1 - depends on ARP-468 for the canvas and widget runtime

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/03-profile-overview.jpg`

## User Story

As a user opening a record, I want to assemble my Overview from the widgets that serve me and that I have access to, so that I see what my work needs first.

## Description

The record's dashboard: the first thing seen, and the only tab the user assembles. It answers what should I be looking at here.

The canvas holds the type's own widgets, the studio widgets, the agent summary and recent activity. The arrangement comes from the role's layout; with no layout of their own, the user sees the default layout and never a blank screen.

The type's own widget goes before the studio widgets. It answers what is this, and that reads before how sure are we.

Two behaviours are easy to get wrong and matter most. Each widget loads on its own, so the canvas does not wait on the slowest. A failing widget shows its error with retry while the others stay alive.

A widget holding a governed value the viewer cannot read keeps its label and masks the value, staying visible with the permission that would open it. Hiding the whole widget tells the user less than they need.

## Scope & Acceptance Criteria

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

## Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

# ARP-1415 - Activity

**Version** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - see `screenshots/04-profile-activity.jpg`

## User Story

As a user picking a record back up after several days, I want to see everything that happened and everything still open, so that I can catch up without asking anyone.

## Description

What is happening with this entity: communications, notes, events and pending tasks, in a single chronological thread, most recent first.

Not to be confused with Audit. This view answers what is happening with this entity and is read by whoever works the record. The audit log, who changed what and from which IP, is a different thing with a different audience and its own place.

Four kinds of item, from four sources: communications from the messaging platform, notes that people write in the platform, events from the workflow engine, and tasks from the task system.

Activity is generic and does not vary by entity type. Every record communicates, gets annotated, fires events and accumulates tasks the same way.

The four sources will not all be available at once, so the criteria close per kind and the ticket allows phased delivery.

One open question carries real design weight: pending tasks are not the past. Mixing them into a chronological thread puts two reading modes together, because the past is scanned downward while the pending is dealt with now. The proposal is to pin them above the thread. Also open: whether activity from a system the user cannot access is listed without content or not listed at all.

## Scope & Acceptance Criteria

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

## Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

# ARP-1416 - Notes

**Version** - v2.0 - P1 - **blocked on design before it can be estimated**

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Notes chip in `screenshots/04-profile-activity.jpg` covers reading. **It does not cover writing.** The composer field, where it lives and how it is confirmed are still to be defined, and that is the piece to get hold of before this enters a sprint.

## User Story

As the owner of a contact, I want to leave a note about what we discussed, so that the next person who opens the record does not start from zero.

## Description

The profile's only write flow: letting owners leave context no system will record on its own. Notes are the only Activity content produced by a human, which is why they are estimated separately from the thread.

Existing notes appear in the thread marked as notes, with author and date. A user who is not an owner sees the composer disabled with a tooltip rather than hidden, because writing a note is not a purchase, not billing and not irreversible.

If a save fails the note is not lost: the text stays in the field with the option to retry.

Still open, and it blocks the permissions companion rather than these criteria: whether an Admin can delete someone else's note, and whether a Super Admin or Admin can write notes on records that are not theirs.

## Scope & Acceptance Criteria

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

## Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

# ARP-1417 - Access & Permissions: Profile

**Version** - v2.0 - P1

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/03-profile-overview.jpg` shows the profile as a full-access role sees it. The prototype has no role switcher, so the restricted states below cannot be seen in it.

## User Story

As an administrator, I want to control which tabs and widgets each role reaches, so that people see what their work needs and nothing they should not.

## Description

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

## Scope & Acceptance Criteria

- Tab visibility and widget catalogue scoped per role, recalculated on the next load
- Locked tabs name their permission; disabled actions carry the canonical tooltips above
- Removing a tab from a role does not delete its content
- [ ] A Sales user sees Overview and Activity, and the other two per tenant policy
- [ ] A tab out of scope under the lock policy names the permission that opens it
- [ ] A non-owner can read notes and sees the composer disabled with its tooltip
- [ ] Removing widget access hides it from that role's catalogue and canvas
- [ ] When permissions cannot be confirmed, the record's content is withheld and a message tells the user to retry or contact their administrator

## Parent Feature Reference

[Linked: ARP-1407 - Profile: tab contract, Overview and Activity]

---

# Feature 3 - Intelligence and Knowledge

This is the set Lex and JJ own. Read the section "Read this before picking up ARP-1408" above before the individual tickets: the two tabs differ in kind from Overview and Activity, and the difference is the whole reason this Feature exists.

---

# ARP-1408 - Profile: Intelligence and Knowledge

**Feature** - v2.1 - P2 - Owners: Lex Paniagua and Julian Johnston

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - open a record, then the Intelligence and Knowledge tabs.

| Screenshot | What it shows |
|---|---|
| `screenshots/05-profile-intelligence.jpg` | Intelligence with signals, the SUGGESTIONS block, and the `Held` state with its reason |
| `screenshots/06-profile-knowledge.jpg` | Knowledge with its three sections, labelled `Sandbox / Truth Plane / Drives` |

Context brief for both owners: https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a

## User Story

As a user about to act on a record, I want to see what the AI concluded and what we are sure of, so that I can decide with judgement.

## Description

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

## Scope

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

## Sub Feature Breakdown

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

## Parent Boulder Reference

[Linked: ARP-375 - Universal Entity Profile]

---

# ARP-1418 - Profile: Intelligence

**Version** - v2.1 - P2

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Intelligence tab, with the signals and the SUGGESTIONS block sorted by impact times urgency, including the `Held` state.

`screenshots/05-profile-intelligence.jpg`. Note the `Held` state with its reason, and the "Grounded in" line showing provenance.

## User Story

As a user who has to decide something, I want to see what the AI concluded and why, so that I can act with judgement instead of reading the whole history.

## Description

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

## Scope & Acceptance Criteria

- The five insight kinds render with provenance
- Processing, withholding and error are told apart on screen
- Suggestions sorted by impact times urgency
- [ ] The agent summary shows its confidence and which planes it drew on
- [ ] With no next-best action, no card is shown, neither empty nor filled with placeholder text
- [ ] A next-best action always shows why; never an instruction without a reason
- [ ] An unprocessed record shows a state that explains it, not an error
- [ ] A suggestion withheld by governance shows that it exists and the reason it is withheld

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

# ARP-1419 - Profile: Knowledge

**Version** - v2.1 - P2

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Knowledge tab and the Overview's KNOWLEDGE widget, which shows the per-plane count.

`screenshots/06-profile-knowledge.jpg`.

Inconsistency to resolve before building. The screenshot is the evidence: this tab labels its sections Sandbox, Truth Plane and Drives, while the Overview widget on the same record calls the third one Sources. The canon (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`) says the plane is Sources and the Source Drives are the container that feeds it, so the Overview is right and this tab is misnamed. Build it as Sources. Tracked as ARP-1425.

## User Story

As a user about to rely on what the system asserts, I want to see what is verified and what is not, so that I know what I can trust.

## Description

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

## Scope & Acceptance Criteria

- Three planes with their declared confidence, each loading and failing independently
- Source Drives feed the Sources plane
- The tab and the Overview widget use the same name for the same plane
- [ ] The three planes show with their declared confidence level
- [ ] A Truth fact shows when it was verified and which source it came from
- [ ] An empty plane explains itself and the other two stay usable
- [ ] A document the user cannot open is shown to exist, naming the permission that would open it
- [ ] A claim in processing is told apart from one that is unverified
- [ ] The Overview widget and this tab name the same plane the same way

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

# ARP-1420 - Access & Permissions: Intelligence and Knowledge

**Version** - v2.1 - P2

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/05-profile-intelligence.jpg` and `screenshots/06-profile-knowledge.jpg` show both tabs as a full-access role sees them. The prototype has no role switcher, so the restricted states below cannot be seen in it.

## User Story

As an administrator, I want to control who sees the AI insights and each knowledge plane, so that inference and knowledge stay inside the same boundaries as the data they come from.

## Description

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

## Scope & Acceptance Criteria

- Per-plane and per-insight scope by role, recalculated on the next load
- Locked planes name their permission; disabled actions carry the canonical tooltips above
- [ ] A Sales user opening Knowledge sees the Truth plane and the other two locked with their permission named
- [ ] A user without execution permission sees a next-best action disabled, with the tooltip naming the permission that would enable it
- [ ] A Compliance user can read everything in Intelligence and act on nothing
- [ ] When permissions cannot be confirmed, no insight and no plane are shown, and a message tells the user to retry or contact their administrator

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge] (Relates To)

---

# ARP-1421 - Intelligence: inference engine

**Version** - v2.1 - P2

This ticket did not exist. The original tree defined the Intelligence tab (ARP-1418) but nothing that produced its content. Without this, the tab can only be a mock-up.

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Intelligence tab shows the shape of the expected output: `SUGGESTIONS · 3 · Sorted by impact x urgency`, signals with severity, and the `Held` state with its reason. That content is fixed text today; this ticket makes it real.

`screenshots/05-profile-intelligence.jpg`.

## User Story

As a user opening a record, I want what the AI says to come from this particular record, so that I can trust it when deciding.

## Description

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

## Scope & Acceptance Criteria

- The five insight kinds generated per record, with traceable confidence and provenance
- Reproducibility verifiable
- Engine respects the viewer's scope
- [ ] A record with sufficient inputs yields insights generated from that record, not template text
- [ ] An insight's provenance leads to the plane and the field it came from
- [ ] The same record opened twice with nothing changed gives the same insights
- [ ] A record with insufficient inputs shows that the agent did not process it, not an empty result
- [ ] An insight below the confidence threshold is not presented as certain

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]. Blocked by ARP-1424 before estimating.

---

# ARP-1422 - Knowledge: claims pipeline and planes

**Version** - v2.1 - P2

This ticket did not exist. The original tree defined the Knowledge tab (ARP-1419) but nothing that populated the three planes. Without this, the tab can only be a mock-up.

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - the Overview's KNOWLEDGE widget shows the per-plane count (5 Truth / 3 Sandbox / 3 Sources) and the Knowledge tab shows its content. Both are fixtures today.

`screenshots/03-profile-overview.jpg` and `screenshots/06-profile-knowledge.jpg`. Canon: `TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`.

## User Story

As a user about to rely on what the system asserts about a record, I want the distinction between verified and unverified to be real, so that the declared confidence means something.

## Description

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

## Scope & Acceptance Criteria

- The three planes populate with real per-record content
- A Truth fact is traceable to its document and its attestation
- Promotion leaves a trail
- Source document permissions are inherited by derived claims
- [ ] A record with associated documents shows three planes populated with that record's content
- [ ] A Truth fact shows who or what verified it, when, and which document it came from
- [ ] A Sandbox claim shows that it is unverified and which source it came from
- [ ] A promoted claim shows the moment of promotion and who did it
- [ ] A record with no associated documents shows three empty planes with their explanation, not an error

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]. Blocked by ARP-1426 and by defining what "verified" means.

---

# Decision tickets

The four below build nothing. They exist so that a blocking decision has an owner, a date and a trail, instead of living buried in an Open questions section. Close them before estimating ARP-1408.

---

# ARP-1424 - Decision: inference leakage, an insight derived from a governed field

**Version** - v2.1 - P2 - the first of the four

The most important decision in this Feature. It is the only one that, resolved badly, produces a security incident rather than a UX bug.

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/05-profile-intelligence.jpg` shows the `Held` state the prototype proposes as an answer.

## User Story

As a platform owner, I want an inferred insight to respect the same boundaries as the data it came from, so that masking a field actually protects it.

## Description

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

## Scope & Acceptance Criteria

- [ ] ARP-1408's Decisions log states what scope the engine runs with
- [ ] It states what happens to an insight that cannot be shown to this viewer
- [ ] It states whether provenance may name a governed field
- [ ] The tickets that implement each part are identified

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

# ARP-1423 - Decision: is the Held state configurable policy or an engine rule?

**Version** - v2.1 - P2, before the tickets it blocks

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/05-profile-intelligence.jpg` shows the state and its reason.

## User Story

As a team about to build the withholding behaviour, I want to know which ticket owns it, so that it is built once and by the right owner.

## Description

The live prototype shows suggestions in a `Held` state, with the reason visible: "Held - a migration delivery date is not attested yet". The behaviour is correct and well resolved. What we do not know is where it comes from.

| If it is | Then |
|---|---|
| Configurable policy | it lives in ARP-1420. An Admin defines which conditions withhold a suggestion, and can change them per tenant |
| A fixed engine rule | it lives in ARP-1421. The engine decides to withhold based on its own attestation logic, and ARP-1420 only reflects it |

It blocks because it determines which ticket builds it. If nobody decides, it gets built twice or not at all. It also determines whether a customer can loosen the withholding: if it is configurable, someone can switch it off, and that has to be designed deliberately rather than discovered.

What we know. The state exists and works in the prototype, with a human-readable reason. That reason references attestation, which is Truth plane vocabulary, suggesting the engine consults the data's verification state. It is not documented anywhere, and we do not know who built it or with what intent.

Blocks ARP-1418, ARP-1420, and partially ARP-1421.

## Scope & Acceptance Criteria

- [ ] The decision is written, with its reason, into ARP-1408's Decisions log
- [ ] The ticket that implements it is identified

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

# ARP-1426 - Decision: is a claim promoted to Truth from the profile or only from Governance Studio?

**Version** - v2.1 - P2

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/06-profile-knowledge.jpg`. The prototype shows no promotion control at all.

## User Story

As a team about to build the Knowledge tab, I want to know whether it writes to governance state, so that we design a reading surface or a writing one, not both.

## Description

A claim lives in Sandbox until someone verifies it and it moves to Truth. The question is where that act happens.

| If it is | Consequence |
|---|---|
| From the profile, in the Knowledge tab | whoever works the record promotes in context, with the data in front of them. Fast, and knowledge stays current because the person who knows is the one doing it. But it turns the UCP into a governance write surface |
| Only from Governance Studio | verification is a deliberate act, with its own surface and its own audit. The UCP stays read-only. But knowledge falls behind if nobody goes to the Studio |

What the answer drags with it. If promotion happens in the profile, Knowledge stops being read-only and needs a promotion permission in ARP-1420, a confirmation flow, and a record of who promoted and on what evidence. If it is Studio-only, Knowledge needs at least a way out, such as "request verification of this claim", or the user sees something unverified with nothing they can do about it. A read-only plane with no way out is a dead end.

It blocks because it defines whether ARP-1419 has a write flow. That is the difference between a reading tab and one that touches the tenant's governance state.

What we know. The canon defines the three planes and their confidence levels but does not say where promotion happens. All three Access and Permissions companions exclude "promoting claims from the profile" from this release, which means today the default answer is "Governance Studio only" by omission, not by decision.

Blocks ARP-1419, ARP-1422, ARP-1420.

## Scope & Acceptance Criteria

- [ ] ARP-1408's Decisions log states where promotion happens
- [ ] If it is Studio-only, it states what way out Knowledge offers for an unverified claim

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]

---

# ARP-1425 - Decision: Sources vs Drives, one plane with two names on screen

**Version** - v2.1 - P2, resolvable in a single conversation

## Prototype Link

https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts - `screenshots/03-profile-overview.jpg` and `screenshots/06-profile-knowledge.jpg` together are the evidence.

## User Story

As a user reading a record's knowledge, I want one name for each plane, so that the name tells me how sure the system is rather than where the files sit.

## Description

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

## Scope & Acceptance Criteria

- [ ] One name for the plane across all three surfaces
- [ ] Confirmed with whoever carried the prototype forward
- [ ] Written into ARP-1408's Decisions log

## Parent Feature Reference

[Linked: ARP-1408 - Profile: Intelligence and Knowledge]
