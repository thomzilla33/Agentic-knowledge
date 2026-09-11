# Reusable prompt: package a feature for handover

Paste the block below into a fresh Claude Code session. Fill the five bracketed
values first; everything after that is the method, and does not change per feature.

The gotchas at the end are the expensive ones from the UCP run. Leaving them in
saves roughly the first third of the session.

---

```
## Context

- Boulder: [ARP-XXX, the Jira Boulder for this module]
- Module name: [the name as it should read everywhere]
- Live prototype: [URL, or "none" if there is no prototype yet]
- Owners to route work to: [names, and which part each takes]
- Repo and branch: [owner/repo, branch to commit to]

Jira: aims-os.atlassian.net, cloudId 21b44c3e-5a49-4c02-8281-c6692441b8b0.

## What I want

Package everything about this module so my team can pick it up without me. The
deliverable is: the Jira tickets published and consistent, a handoff package in
the repo, one page I can send, and one message I can paste.

## How to work

**1. Establish the source of truth before anything else.** Do not assume the
prototype I named is the one that is live, and do not assume our build is
current. Verify by rendering what is actually deployed, not by reading a bundle
or a doc. If someone carried the work further than our branch, that is the
reference and our build is a historical record. Report the differences you find.

**2. Audit the existing tree.** List every ticket under the Boulder and every
pre-existing ticket that touches it. For each, say what it covers. You are
looking for two things: tickets that duplicate each other, and gaps.

**3. Hunt for the structural gap, not the missing screen.** The failure mode is
a tab or surface that is fully designed but has no producer behind it: the
tickets describe showing something that nothing generates. Ask of every surface
"what writes this data, and does that have a ticket?" Where the answer is no,
say so plainly and create the missing tickets. That is usually the most valuable
thing in the whole exercise.

**4. Turn blocking questions into tickets.** Any open question that must be
answered before estimating gets its own ticket with an owner, what has to be
decided, what it blocks, and what we already know. Questions buried in an "Open
questions" section never get closed. Order them by what constrains the rest.

**5. Write every ticket in the house template.** Work Queues (ARP-927 and its
children) is the standard: Prototype Link, User Story, Description, Scope &
Acceptance Criteria, Parent Feature Reference. Features add Sub Feature
Breakdown and point at a Parent Boulder. Acceptance criteria are what a user
sees, never implementation language and never "deny by default".

**6. Screenshot the prototype and embed one in every ticket**, so nobody has to
guess which surface a ticket describes.

**7. Write the handoff package** into `[module]-handoff/` in the repo:
state (what is real, what is mocked, what is inconsistent), decisions with the
argument behind each one including any I reversed, the tickets with the reason
each exists, any review that bears on this and explicitly why the parts that
look relevant are not, how to rebuild the prototype, and open items ordered by
who they block. Then merge all of it into one `-COMPLETE.md`.

**8. Publish one page** with the whole document, using the AIMS OS brand, so it
can be read without repo access.

**9. Write the message I will paste** to the team: the links, who owns what,
what is blocked and who unblocks it, and what not to assume.

## How to treat what you find

- Verify before you assert relevance. If you claim something is a risk or a
  blocker, check it against what the tickets actually say first. Retract it in
  writing if it does not hold, and record why, so nobody re-raises it.
- Never recommend closing someone else's ticket without reading its children.
- Creating tickets is additive and reversible. Changing another person's ticket
  type, or closing it, is not: surface those as questions for the team.
- When you correct yourself, say so plainly and move on.

## Standing rules

- Everything in plain English. No emoji, no emoticons, anywhere.
- Commit to the branch above, never another. Do not open a pull request unless
  I ask.
- Ask me before assigning anyone in Jira.

## Gotchas, so you do not rediscover them

- **Jira hierarchy** is Boulder (3) > Feature (2) > Version (1) > Story/Bug (0).
  The level-1 type is called "Sub Feature" in conversation but `Version` in the
  API. Passing "Sub Feature" fails. A Feature cannot contain a Feature.
- **Pass `contentFormat: "markdown"`** on create and edit. Wiki markup like
  `h2.` renders as literal text.
- **There is no Jira attachment tool.** Push screenshots to the repo and embed
  them as markdown images pointing at raw.githubusercontent.com, plus a plain
  link as a fallback. Put each image and its link in their own paragraph or the
  converter swallows the first link.
- **Ampersands in titles** get HTML-escaped into a visible `&amp;`. Check the
  titles after creating them.
- **`- [ ]` checkboxes** come back escaped as `\[ \]`. That is normal and
  matches the house output; do not try to fix it.
- **The agent proxy blocks headless browsers from Vercel.** Capture screenshots
  by curling the page and its hashed `/assets/*.css` and `*.js` into a local
  directory, serving it with `python3 -m http.server`, and pointing Playwright
  at localhost with the `?proto=` query. Read the asset hashes out of the
  fetched HTML; they change on each deploy.
- **There is no PIL.** Downscale images through a Playwright canvas with
  `toDataURL('image/jpeg', 0.86)`.
- **Click tabs by coordinate** when a tab label also appears as a widget title;
  `getByText()` is ambiguous and times out.
- **Artifact watch subscriptions fail** in this environment with a 404 through
  the session gateway. Do not claim to be watching anything.
```
