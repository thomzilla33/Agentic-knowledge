# UCP — Unified Contact Profile, built on RecordHeader

**Base:** `main` (`9d8bea2`) · **Reviewer:** @cachilupis (required — two files under CODEOWNERS)

---

## What this adds

One prototype card, `UCP - Contacts Last version`, covering the whole flow: the
contacts roster, the record profile, and Overview as a tab inside it.

- **Roster** — Tabs by type (All · Customers · Employees · Companies) → Filters.
  Cards only. `Create New {type}` follows the active tab, and each row carries
  its Next Best Action when the engine has one.
- **Profile** — `RecordHeader` + four tabs: Overview · Snapshot · Activity ·
  Drives. The identity card and the tabs pin in `ScreenLayout`'s header zone,
  so the record stays identified while its content scrolls.
- **Overview** — `WidgetCanvasView`, per the DS rule that any tab named Overview
  is a canvas.
- **Snapshot** — the record's facts by knowledge plane (Truth / Sandbox /
  Sources), from `TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`, not invented.
- **Drives** — Source Drives from the company catalog, replacing a generic
  Documents tab.

Six files. Three new screens, one additive line pair in `App.tsx`, one prop on
`entity-list.tsx`, and a three-line width fix on `record-header.tsx`. **No new
components, and nothing deleted.**

## This started as a second header component. That was wrong.

The first build of this prototype shipped its own `EntityHeader` in
`experimental/`, built from Figma `19815-101547`, on three arguments:
`RecordHeader` branched on three closed record shapes; it carried the Next Best
Action inside itself where that spec wanted a separate card below; and it had no
state coverage.

All three stopped being true while this was in flight:

- **#46's agnosticism pass** dropped the closed `uep`/`ucp`/`uvp` variants —
  *"This card now serves ANY entity type on the platform."*
- **#46's redesign** reintroduced the Next Best Action deliberately, as a
  protagonist block visible collapsed and expanded alike. The design system took
  the opposite position from the one that justified a separate card, and shipped
  it.
- `RecordHeader` now carries per-zone loading and per-field masking.

So the prototype was rebuilt on `RecordHeader`, and both experimental components
were deleted rather than proposed. Two things that used to be this screen's
belong to the component now, and both are better there: the Next Best Action,
which no longer needs placing, and the card-width reflow, which `RecordHeader`
measures on its own box.

This also means the PR no longer deletes `pm-thomas-universal-profile.tsx`. An
earlier revision did, on the reading that it was an orphan superseded by this
work. It is not — four commits have been developing it, and it is registered in
`App.tsx` as a live prototype.

## What the profile wires that nothing wired before

`pm-thomas-universal-profile.tsx` notes that `recordFields` is deliberately left
unset there, because that screen has no provenance panel and no real source
systems to name — *"The panel gets wired with real provenance during the UCP
header redesign."* This is that.

- **`recordFields` carries provenance per field, not per record.** A contact's
  role comes from the CRM; their verified-fact count comes from the knowledge
  system. One `source` on the whole record was a simplification that stopped
  being true the moment two fields disagreed.
- **`onProvenanceOpen` opens a real panel** listing every field with its source
  system, model version and last sync.
- **Masking is driven by entitlement** (`VIEWER_SCOPES` against the record's
  `requiredScope`), never by a flag on the record. The signed-in PM holds
  contacts, HR and drives — deliberately not finance — so Amy Chen, the CFO,
  renders `locked` with her governed fields `masked`. A masked field keeps its
  label, its provenance badge and its sync time, and withholds only the value.

## The two files that need your review

`.github/CODEOWNERS` gates `src/components/` and `src/App.tsx`. Three files fall
under it.

### `entity-list.tsx`

1. **`showAiPrefix?: boolean`, default `true`.** The insight label was hardcoded
   as `AI {action}`. That is right when `action` names a category of output —
   the three existing consumers pass "Summary", "Impact" and "Escalated". It is
   wrong when `action` is a product concept with a name of its own: "AI Next
   Best Action" renames the thing, and the row stops saying what the header
   says. Opt-out, so every existing caller renders identically — verified in the
   playground, not by reading the diff.
2. **A dangling separator.** The `·` divides the label from the inline detail,
   but on expand the detail moves down into the bullets and the separator stayed
   behind with nothing after it. Pre-existing; restoring the label made it
   visible.

The prop ships with a toggle on the entity-list playground page and a row in the
prop table.

### `record-header.tsx` — the Next Best Action block hugs its text

`NextBestActionBlock` was `w-full`. A block stretched across the whole card
makes a one-line recommendation read as a section, and leaves the chevron
marooned an inch from the sentence it belongs to. It now sizes to its content:
`max-w-full self-start`, with `flex-1` dropped from the inner column and the
title, so a long one still stays inside the card and truncates as before.

Three lines. The same idiom already exists in `entity-list.tsx`, which sets
`self-start` on its insight block when the text is short.

Checked against both consumers, not just this one: on this profile the block
goes from full width to 835–865px; on `pm-thomas-universal-profile.tsx`, whose
descriptions are much shorter ("Due in 3 days"), it lands at 376px and reads
better than the full-width version did.

**Heads-up on conflict risk:** there are four active `ds/record-header-*`
branches. This is three lines in one component and should rebase trivially, but
it is worth knowing before it sits in review.

### `App.tsx`

Two added lines: the import and the `PROTOTYPE_PAGES` entry. Nothing removed.

## Verification

- `npm run build` — clean
- `node scripts/audit-ratchet.cjs` — **no new DS warnings** against `9d8bea2`
- `node scripts/audit-tokens.cjs --counts` — `errors=0 orphan=0 shadow=0
  main_overuse=0 card_reimpl=0`
- Zero raw colours in every touched file
- Browser at 1440×1000, no console errors: roster, profile, all four tabs, the
  governed record, and the loading beat

Asserted rather than screenshotted: on a locked record `Export record` reports
`disabled=true` and on a normal one `false`.

## Two things for you

- **`StudyWidget` and `ConnectionsContent` are duplicated** between this profile
  and `pm-thomas-universal-profile.tsx` — the duplicate-component check from #97
  flags both. They drifted already: #95 fixed the sibling's error state to use
  `EmptyState` and this screen still had the hand-rolled div, which is adopted
  here. Extracting one canonical copy means editing a file under active
  development, so I left it — say where you want them and I will move them.
- **`Request access`** on the governed EmptyState is a stub. There is no
  scope-request flow in AIMS OS yet.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01UCXhb1RHXHL6NFqB3eSYLa
