# 04 - Edgardo Sierra's review

**Source:** transcript "Diseño de Administración y Permisos", 2026-09-03.
**Scope:** the review is of the **Admin Console**, not of the UCP. Of his 40 observations, **exactly one changed anything in the UCP** - and it is already resolved. The rest touch the UCP distantly or not at all.

> The transcript is in Spanish. Every quotation below is translated; the wording is mine, the point is his.

---

## The one thing that changed the UCP

### "Always leave Activity last" made us see we had two views with the same name

Edgardo is talking about the **audit log**, the auditing component he wants identical on every surface. Our Activity tab is a different thing: an entity's communications, notes, events and tasks.

**Result:** our view stays **Activity**; the governance one is renamed **Audit**. Recorded in ARP-1407 and ARP-1415. **Closed.**

---

## What applies to the UCP later

### The audit log is designed once and replicated identically

> "It has to look exactly the same everywhere. So you design it in one place and it replicates everywhere else."

The day an entity has an audit view, **it is not designed again** - the same component is mounted. The only thing that changes by context is the filters that cannot be removed.

His fixed columns: time, user, action type, resource, description, result, and **source**. Source matters because not everything comes from the UI - it may come through the API.

**The UCP has no audit view in this delivery.** This is information for when it does, not an open item.

---

## Three things that looked like they touched the UCP and do not

> I marked these as high risk on a first pass. Checked against what actually went into the published tickets, none of the three carries that weight. It is written down here so nobody raises them as blockers again.

### App-level permissions, in two steps

> "Before I can give you permission on the Data Studio, somebody has to have given you access to the Data Studio."

**Why this is not a problem:** our companions describe what each role sees **inside** the UCP. If a prior module-access permission is also needed, that is a prerequisite line in the companions, not a redesign of the role model.

### Privileges are not hierarchical

> "You can be a Tester on an agent and not have permission to chat with it day to day."

**Why this is not a problem:** ARP-1412's Role Templates are declared sets, not a ladder:

> Sales (Customers and Companies), Service (all three), People Ops (Employees), Read-only (all three, without creating)

People Ops does not overlap Sales. Nothing inherits from anything. Edgardo's point is already satisfied.

### *Who has access*, per resource

> "Google has that and it is called Who has access. They are functions that are very hidden, but they are very important for an administrator."

**Why this is not a problem:** all three companions explicitly exclude per-record permissions under *Not in this release*. It is a decided non-goal, not an oversight. It remains urgent **for the Admin Console**, which is what he was talking about.

---

## Summary

| Observation | Bearing on the UCP |
|---|---|
| Activity vs audit log | **Closed** - ARP-1407 and ARP-1415 |
| The audit log is designed once | Applies when the UCP has an audit view. It does not |
| App-level permissions | A prerequisite line, if it applies |
| Non-hierarchical privileges | Already satisfied |
| Who has access, per resource | A declared UCP non-goal. Urgent for the Admin Console |
| The other 35 observations | Admin Console. Nothing to do with the UCP |

---

## The full review, as he gave it

Grouped by the surface he was looking at. [cross-cutting] marks what he himself called cross-cutting functionality - it has to exist in two places or it is useless.

## OV - Overview
*He approved almost all of it: connected integrations, active users and billing stay as they are.*

**OV-1.** Add to the Overview which apps are active, alongside integrations and users.
> "Here I would say put something about studios. Which studios are active?"

## US - User list
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

## PF - User profile
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

## RL - Roles
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

## GR - Groups
*The same as roles, plus the resources tab.*

**GR-1.** Show who granted access to the group and when.

**GR-2.** Allow **temporary deactivation** as well as removal.
> "So you do not have to remove them, it could be like deactivating them temporarily."

**GR-3.** Group tabs: `Members`, `Resources`, `Settings`, `Activity`. [cross-cutting]

**GR-4.** Allow editing the group's name and description.

## AP - Apps and studios
*His thesis: the studios are independent applications joined by a router, and the UI should feel that way.*

**AP-1.** Consider renaming **Studios** to **Apps**.
> "I think the word studios is going to cause confusion."

**AP-2.** A distinct icon per app and more visual prominence, so they feel like independent applications.
> "So it feels like a set of independent apps joined into a single router."

**AP-3.** In the app's profile, see **who has access** - the mirror of the user's view. [cross-cutting]
> "Just as I can see, as a user, which studios I have access to, the studios view should show who has access to that studio."

**AP-4.** Distinguish **Disable Studio** (global, for everyone) from removing one user's access.
> "This one is general, meaning turn it on for everybody. The other one is removing a user's access to the studio."

## AU - Audit log
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

## RS - Resources
*It does not exist yet and it is the only thing he flagged as urgent: the backend is already on its way from the data team.*

**RS-1.** A new **Resources** tab on users and groups: resource type, name, who granted access, when, and a remove button.
> "We have to pick this up again so it is not forgotten, please, because the data team is already finishing the backend to control that."

**RS-2.** **Who has access**, per resource, as a view separate from Share.
> "Google has that and it is called Who has access. Amazon has it too. They are functions that are very hidden, but they are very important for an administrator."

**RS-3.** On the agent, an administration view outside the Playground: Activity, Who has access, Settings and versions.

## CO - Sharing resources
*The privilege model is already defined by the backend. What is missing is the sharing UI reflecting it.*

**CO-1.** Allow selecting **several privileges** when sharing, not just one.
> "What matters is that I can select multiple privileges. I can say you can edit and you can view."

**CO-2.** Privileges are **not hierarchical**. They do not inherit viewer to editor to owner; they are mini-roles that may or may not overlap.
> "You can be a Tester on an agent and not have permission to chat with it day to day."

**CO-3.** AIMS OS creates the privileges underneath. The user only sees them by name, with an explanation of what they enable.
> "He has no reason to know which permissions he is granting. We can put here what this permission lets you do."

**CO-4.** Permission descriptions that are not superfluous, with a detail slide-out.
> "This platform is not for administrators. The automotive industry are not technical people, it is someone who was put in charge of administering something."
