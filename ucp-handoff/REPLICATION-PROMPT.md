# Reusable prompt: package a feature for handover

Paste the block below into a fresh Claude Code session. Fill the bracketed
values first; everything after that is the method, and does not change per
feature.

This version does **not** create or edit Jira tickets. It reads whatever source
material exists and produces documentation. If a run does need tickets written,
that is a separate pass with the `jira-arp-ticket-creator` skill.

The gotchas at the end are the expensive ones from the UCP run. Leaving them in
saves roughly the first third of the session.

---

```
## Context

- Module name: [the name as it should read everywhere]
- Live prototype: [URL, or "none" if there is no prototype yet]
- Source material: [Figma links, PRDs, Confluence pages, transcripts, canon docs]
- Existing tickets: [ARP keys to read for context, or "none"]
- Owners to route work to: [names, and which part each takes]
- Repo and branch: [owner/repo, branch to commit to]

## What I want

Package everything about this module so my team can pick it up without me.
Three deliverables: a handoff package in the repo, one page I can send, and one
message I can paste.

**Do not create or modify any Jira ticket.** Read them if I listed any, and
treat them as input. Where the work needs a ticket that does not exist, write
down what it would be and why, in the open-items document, for someone to file
later.

## How to work

**1. Establish the source of truth before anything else.** Do not assume the
prototype I named is the one that is live, and do not assume our build is
current. Verify by rendering what is actually deployed, not by reading a bundle
or a doc. If someone carried the work further than our branch, that is the
reference and our build is a historical record. Report the differences you find.

**2. Inventory what exists.** Go through every piece of source material I
listed and say what each one actually covers. You are looking for three things:
places where two sources contradict each other, places where something is
specified nowhere, and decisions that were made but never written down.

**3. Hunt for the structural gap, not the missing screen.** The failure mode is
a surface that is fully designed but has no producer behind it: the material
describes showing something that nothing generates. Ask of every surface "what
writes this data, and does that exist?" Where the answer is no, that is the
most important finding in the exercise. Say so plainly, explain what is missing,
and name what would have to be built.

**4. Separate the blocking questions from the rest.** Any question that must be
answered before this can be estimated goes in its own section, each with what
has to be decided, who decides it, what it blocks, and what we already know.
Order them by what constrains the rest. Questions mixed in with everything else
never get closed.

**5. Capture the prototype.** Screenshot every surface and commit the images to
the repo. Reference the right one from every place in the documentation that
describes a screen, so nobody has to guess which surface is meant.

**6. Write the handoff package** into `[module]-handoff/` in the repo, as
separate numbered documents: current state (what is real, what is mocked, what
is inconsistent), decisions with the argument behind each one including any I
reversed, the feature breakdown with the reason each piece exists, any review or
transcript that bears on this and explicitly why the parts that look relevant
are not, how to rebuild the prototype, and open items ordered by who they block.
Then merge all of it into one `-COMPLETE.md` with a table of contents.

**7. Publish one page** carrying the whole document, using the AIMS OS brand, so
it can be read without repo access.

**8. Write the message I will paste** to the team: the links, who owns what,
what is blocked and who unblocks it, and what not to assume.

## How to treat what you find

- Verify before you assert relevance. If you claim something is a risk or a
  blocker, check it against what the material actually says first. Retract it in
  writing if it does not hold, and record why, so nobody re-raises it.
- Distinguish what is decided from what is true by omission. "Nobody wrote it
  down" is not the same as "we decided against it", and the difference matters.
- Where the prototype answers a question the documentation left open, say that
  the prototype answers it and that nobody has confirmed the answer was
  deliberate.
- When you correct yourself, say so plainly and move on.

## Standing rules

- Everything in plain English. No emoji, no emoticons, anywhere.
- Commit to the branch above, never another. Do not open a pull request unless
  I ask.
- No writes to Jira, Confluence or any other shared system. This run produces
  files and pages only.

## Gotchas, so you do not rediscover them

- **The agent proxy blocks headless browsers from Vercel.** Capture screenshots
  by curling the page and its hashed `/assets/*.css` and `*.js` into a local
  directory, serving it with `python3 -m http.server`, and pointing Playwright
  at localhost with the `?proto=` query. Read the asset hashes out of the
  fetched HTML; they change on each deploy.
- **There is no PIL.** Downscale images through a Playwright canvas with
  `toDataURL('image/jpeg', 0.86)`.
- **Click tabs by coordinate** when a tab label also appears as a widget title;
  `getByText()` is ambiguous and times out.
- **There is no markdown library.** If you convert markdown to HTML for the
  page, protect code spans and anchors behind placeholders before running the
  emphasis rules, or bold that spans a code span is left as literal asterisks
  and the bare-URL linker doubles the closing tag inside existing links.
- **Reading Jira:** pass `responseContentFormat: "markdown"`. The hierarchy is
  Boulder (3) > Feature (2) > Version (1) > Story/Bug (0); the level-1 type is
  called "Sub Feature" in conversation but `Version` in the API, so a tree may
  not look the way people describe it.
- **Artifact watch subscriptions fail** in this environment with a 404 through
  the session gateway. Do not claim to be watching anything.
```
