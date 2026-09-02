# Notification Panel — Prototype Handoff
**Date:** 2026-08-05  
**Figma ref:** [DS node 18179-8837 — Notifications WIP](https://www.figma.com/design/v6rmYKA2zmyXWOahlxLOeI/Design-System---AIMS-OS?node-id=18179-8837)  
**Status:** Shared component shipped to all 9 studios

---

## What was built

A single shared notification panel component — `shared/notif-panel.css` + `shared/notif-panel.js` — now powers the bell icon in every studio. Previously, 7 of 9 studios had a stub (`toast('3 unread notifications')`). All studios now open a real panel.

---

## File structure

```
shared/
  notif-panel.css   — all visual styles; uses --notif-* CSS tokens
  notif-panel.js    — open/close, filter, mark-read, render logic
```

Each studio HTML file defines its own `window.NOTIF_DATA` array just before loading `shared/notif-panel.js`. The script uses that data; if absent, it falls back to a generic sample dataset.

---

## Component anatomy

```
[ Bell icon + count badge ]
     ↓ click
┌─────────────────────────────────────┐
│ Notifications          [✓] [↗]      │  ← header: mark-all + open-full actions
├─────────────────────────────────────┤
│ [All]  [Unread 3]                   │  ← DS-spec filter chips (All / Unread)
├─────────────────────────────────────┤
│  TODAY                              │  ← time separator
│  ● [src icon]  Title                │  ← unread item (purple tint bg)
│               Description line 1…  │
│               [Severity]  2m ago    │
│  ─────────────────────────────────  │
│    [src icon]  Title                │  ← read item
│               Description           │
│               [Severity]  1h ago    │
│  YESTERDAY                          │
│  ● [src icon]  Title                │
│               …                     │
├─────────────────────────────────────┤
│          View all notifications     │  ← footer link (stub)
└─────────────────────────────────────┘
```

---

## DS spec coverage — what's implemented

| Feature | DS spec | Prototype |
|---|---|---|
| Bell icon + count badge | ✅ | ✅ |
| Panel shell (400px, 16px radius) | ✅ | ✅ |
| Filter chips: All / Unread | ✅ | ✅ |
| Time separators: Today / Yesterday / Earlier | ✅ | ✅ |
| Source icon (agent / workflow / human / integration / system) | ✅ | ✅ |
| Severity badge (Info / Success / Warning / Critical) | ✅ | ✅ |
| Unread dot indicator | ✅ | ✅ |
| Mark as read on click | ✅ | ✅ |
| Mark all as read (header button) | ✅ | ✅ |
| Unread count updates live | ✅ | ✅ |
| Dark mode | ✅ | ✅ |
| Light mode | ✅ | ✅ (via `html.theme-light`) |
| Keyboard: Escape closes panel | ✅ | ✅ |
| Empty state | ✅ | ✅ |
| Loading state | ✅ spec only | ❌ not wired (no async yet) |
| Error state | ✅ spec only | ❌ not wired |
| Offline state | ✅ spec only | ❌ not wired |
| Bulk selection (Mark as Read / Archive) | ✅ V1 spec | ❌ pending product validation |
| Full notifications view / inbox page | ✅ concept | ❌ stub ("coming soon") |

---

## Studio breakdown

### Studios retrofitted (were toast stubs)

| Studio | Notification themes seeded |
|---|---|
| `agent-tools.html` | Connector token expiry · SDK rate limits · Tool suite publish · Credential rotation |
| `agentic-studio-demo.html` | Agent halted · Human approval · SLA breach · Workflow completion |
| `data-studio.html` | Schema drift · Data quality scan · Schema approval · Retention policy |
| `helix-data-studio.html` | Lineage approval · PII exposure · dbt failure · Data contract review |
| `settings.html` | SSO cert expiry · Integration disconnect · RBAC role changes · API key audit |
| `voice-channel-ux.html` | Call escalation · Session complete · Handoff queue · STT confidence low |

### Studios updated (had real panels, wrong filter pattern)

| Studio | What changed |
|---|---|
| `agentic-studio.html` | Filter: "Only unread" toggle → DS-spec All/Unread chips. Data refreshed. |
| `communication-hub.html` | Filter: Direct/Watching tabs → All/Unread chips. Data refreshed with comms context. |
| `governance-studio.html` | Filter: "Only unread" toggle → All/Unread chips. Data refreshed with policy/compliance context. |

---

## Notification data model

Each item in `window.NOTIF_DATA` uses this shape:

```js
{
  id:        string,   // unique — used for mark-read
  source:    'agent' | 'workflow' | 'human' | 'integration' | 'system',
  eventType: 'completion' | 'failure' | 'approval' | 'assignment'
             | 'escalation' | 'reminder' | 'security' | 'update',
  severity:  'info' | 'success' | 'warning' | 'critical',
  title:     string,   // ≤60 chars recommended — truncated with ellipsis
  desc:      string,   // ≤120 chars — 2-line clamp in UI
  time:      string,   // human-readable: "2m ago", "1h ago", "Yesterday"
  day:       'today' | 'yesterday' | 'earlier',  // controls time separator grouping
  unread:    boolean,
}
```

Source → icon colour mapping:

| Source | Icon colour |
|---|---|
| `agent` | Purple `#A78BFA` |
| `workflow` | Blue `#60A5FA` |
| `human` | Green `#34D399` |
| `integration` | Orange `#FB923C` |
| `system` | Slate `#94A3B8` |

---

## CSS token contract

The panel is fully token-driven. Override any of these in a studio's own `<style>` block to retheme:

```css
--notif-bg               /* panel background           dark: #131C2E  light: #FFFFFF  */
--notif-border           /* panel border               dark: 9% white light: 9% black */
--notif-shadow           /* panel drop shadow                                         */
--notif-text-strong      /* title + header text                                       */
--notif-text-body        /* body / description text                                   */
--notif-text-muted       /* chips, separators, empty states                           */
--notif-text-caption     /* timestamps                                                */
--notif-hover            /* row hover bg                                              */
--notif-divider          /* row separators + filter bar border                        */
--notif-accent           /* active chip + unread dot   #8B5CF6 (purple)              */
--notif-unread-bg        /* unread row bg tint                                        */
--notif-unread-hover     /* unread row hover tint                                     */
```

---

## What's still missing (open for design)

### P1 — Feed states not wired
The DS defines **Empty, Loading, Error, Offline** states for the feed area. The empty state is implemented (zero items → "You're all caught up"). Loading/Error/Offline states have CSS in `notif-panel.css` (`.notif-feed-state`, `.ico-load`, `.ico-error`, `.ico-offline`) but are not triggered yet — they need a real API. **Design question:** do Loading/Error/Offline need design changes from what's specced, or are they confirmed as-is?

### P2 — Bulk selection (DS Bulk Selection V1)
The DS spec says: Mark as Read + Archive. Additional actions require product validation. **This needs product sign-off before engineering builds it.** The CSS foundation is in place.

### P3 — Full notifications inbox / work queue
The DS has a full-page **Work Queue** concept (node `18766:7399`). The "View all notifications" footer link stubs to a toast. **This needs a new screen design before we can prototype it.**

### P4 — Notification preferences
Settings sidebar has a "Notifications — Coming soon" item. Once the panel ships, this page needs to exist. **Needs spec.**

### P5 — Real-time badge updates
The badge currently resets on page reload. Badge persistence across navigation requires a shared store (localStorage or API). **Out of prototype scope — for engineering discussion.**

---

## Open questions for design

1. **Offline/Error state copy** — the DS spec shows these states but doesn't define the body copy. What should the error message say? ("Can't load notifications. Try again." or something else?)

2. **Notification item interaction on click** — currently clicking marks as read and does nothing else. Should clicking navigate somewhere (e.g. into the affected agent/workflow/policy)?

3. **"View all notifications" destination** — is this the Work Queue full-page view, or a separate inbox-style screen? The Work Queue concept is in the DS but not yet in the prototype.

4. **Severity label or icon only?** — the DS shows severity as a badge label ("Warning", "Critical"). Should this be label + icon, or just a coloured dot for brevity?

5. **comm-hub filter chips** — the previous implementation had "Direct" and "Watching" tabs (message-centric). Now replaced with All/Unread (notification-centric). Confirm this is correct for the communication hub context, or restore the Direct/Watching split.

---

## How to add / update notification items

In any studio HTML, find the `window.NOTIF_DATA = [...]` block near the bottom (before the closing `</body>`) and add or edit items following the data model above.

To add a new notification type or source, update `shared/notif-panel.js`:
- Add an icon to the `SRC_ICO` object for a new source
- Add a label to `SEV_LABELS` for a new severity
