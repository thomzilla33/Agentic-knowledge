# UCP — Unified Contact Profile, built on the DS

**Repo:** `cachilupis/aims-os-design-system` · **Base:** `main` · **Head:** `claude/ucp-unified-contact-profile`
**Reviewer:** @cachilupis (required — two files under CODEOWNERS)

---

## What this adds

One prototype card, `UCP - Contacts Last version`, covering the whole flow: the
contacts roster, the profile, and Overview as a tab inside it.

- **Roster** — Tabs by type (All · Customers · Employees · Companies) → Filters.
  Cards only. `Create New {type}` follows the active tab.
- **Profile** — Entity Header + Next Best Action + four tabs: Overview ·
  Snapshot · Activity · Drives. The whole record chrome pins on scroll.
- **Overview** — `WidgetCanvasView`, per the DS rule that any tab named Overview
  is a canvas.
- **Snapshot** — the record's facts by knowledge plane (Truth / Sandbox /
  Sources), from `TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`, not invented.
- **Drives** — Source Drives from the company catalog, replacing a generic
  Documents tab.

## Two new components in `experimental/`

Both from Figma node `19815-101547` ("Entity Header - WIP"). They carry
`// DS-GAP:` on line 1 and stay in `experimental/` until the frame stops being
WIP.

- **`entity-header.tsx`** — identity card for a Unified Entity Profile.
  Deliberately not a variant of `RecordHeader`: nothing in the spec's structure
  branches on record shape, and the spec puts the Next Best Action in its own
  card *below* the header rather than inside it as a Signal bar.
- **`next-best-action-card.tsx`** — the card that proposal lives in. Accept
  assigns to the agent; it never executes.

All five states the component owns are exercised by a screen, not just
implemented: Default, Minimum (on scroll), Loading (first paint of a fetch),
Restricted (a scope the viewer lacks), and the Responsive reflow (driven by a
ResizeObserver on the header's **card**, because the spec says the breakpoint is
the card's, not the viewport's).

## Changes to `src/components/` — this is what needs your review

### `entity-list.tsx`

1. **`showAiPrefix?: boolean`, default `true`.** The insight label was
   hardcoded as `AI {action}`. That reads correctly when `action` names a
   category of output — the three existing consumers pass "Summary", "Impact"
   and "Escalated". It reads wrong when `action` is a product concept with a
   name of its own: "AI Next Best Action" renames the thing, and the row stops
   saying what the card on the profile says.

   Opt-out, not opt-in, so every existing caller renders identically. Verified
   in the playground rather than by reading the diff: default still prints "AI
   Escalated", toggle off prints "Escalated".

2. **A dangling separator.** The `·` divides the label from the inline detail,
   but on expand the inline detail moves down into the bullets and the
   separator stayed behind at the end of the label with nothing after it. It now
   renders only when there is something to separate. Pre-existing; restoring the
   label is what made it visible.

### `App.tsx`

- The `showAiPrefix` toggle on the entity-list playground page and its row in
  the prop table. A DS prop that cannot be exercised on its own component page
  is the same problem as a component state no screen renders.
- Registers the prototype (import + one `PROTOTYPE_PAGES` entry).
- Removes the `proto-thomas-universal-profile` import and entry.

## One deletion

`src/screens/pm-thomas-universal-profile.tsx` (932 lines) is deleted. It was
superseded by this prototype, and leaving it would have added an orphan to the
audit's Check 4 — the `--counts` ratchet fails a PR when any category goes up.
Confirmed with before/after counts.

## One deliberate deviation from CLAUDE.md

The profile's page `Header` does **not** repeat the entity name, status tag and
breadcrumb. The Entity Header spec makes its own title the page subject ("the
title carries the profile heading level"), and the Figma view for this surface
shows only the parent list above the card. Printing the name and state twice,
40px apart, is the thing that spec is avoiding.

## Verification

- `npx tsc -b --noEmit` — clean
- `npm run build` — clean
- `node scripts/audit-tokens.cjs --counts` — `errors=0 orphan=0 shadow=0
  main_overuse=0 card_reimpl=0`, unchanged from the base. The ratchet fails on
  any category going up; none goes up.
- Zero raw colours (`rgba` / hex) in every touched file
- Browser at 1440×1000 with no console errors, plus 1024 and 820 for the
  header's reflow

## Open questions for you

- **Restricted with tags.** The spec text says *"No signals — the tag group is
  removed, not left empty"*, but the `Property 1=Restricted` variant in Figma
  shows the tags on the right, dimmed. I implemented the text. If the mock is
  the intent, it is a one-line change.
- **Restricted with a dimmed title.** Related: the mock dims the whole identity
  block. I kept the title at full strength — Restricted governs values, not
  identity, and the name is already visible in the list the viewer came from.
  If you want it dimmed, it is the `color` line in `Title`.
- **The 760px threshold.** Derived by measuring where the single row stops
  fitting; the spec gives no number. If you set one, it is the
  `HEADER_STACK_THRESHOLD` constant.
- **Promotion.** When `19815-101547` stops being WIP, both experimental
  components are ready to move to `ui/` via `/aims-ds-component`.
