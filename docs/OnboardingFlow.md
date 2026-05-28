# Data Studio — Onboarding Flow Spec

> Adapted from the standalone `OnboardingFlow.jsx` artifact described in `OnboardingFlow_Documentation.pdf`. Implemented inline in `data-studio.html` (no React, no build). All state is mocked in-memory + localStorage.

## What this is

The first-run experience for Data Studio. A fresh visitor with no localStorage lands directly on a guided empty state. The CTA opens a centered modal wizard that walks them from "empty account" to "one connection live and shaped" in about 5 minutes.

The whole onboarding lives inside Data Studio (per the founder request: "todo el proceso de onboarding dentro del data studio"). It does not span the other two studios — though the Done step bridges to Agent Studio (build agent tools on the data) and Admin Studio (set who can access).

## Status

| | |
|---|---|
| File | `data-studio.html` |
| Sprints shipped | 4 main + 5 follow-ons (sample fields, quarantine, detail page, errors, animations, telemetry, tour, first-run default) |
| Total feature ships | 13 |
| Live URL | https://thomzilla33.github.io/aims-integration/data-studio.html |
| Persistence | localStorage only (no backend) |

---

## Design decisions (Q1–Q7)

Before any code was written, 7 multiple-choice questions locked the scope. Each was decided with a UX/functionality rationale, not just preference. Saving them here so future-you doesn't re-litigate.

### Q1 — Onboarding shell

**Chosen:** Empty-state guiado dentro de Data Studio (no full-screen takeover).

**Why:** Best-practice enterprise SaaS. Doesn't scare evaluators who want to peek before committing. The wizard opens as a modal on click; the rest of Data Studio is explorable behind it.

### Q2 — Wizard scope

**Chosen:** 6 steps from the doc — Category → Connector → Auth → Preview → Field mapping → Sync settings.

**Why:** Preview is a checkpoint that builds confidence without friction. Sync settings is critical enterprise (cadence + incremental sync). Adding a 7th "map to canonical schema" step was rejected because AIMS-OS has no canonical schema concept yet.

### Q3 — Wizard chrome

**Chosen:** Centered modal ~960px.

**Why:** Field mapping (step 5) needs width for the multi-column editable table. A drawer would force horizontal scroll. A full-screen takeover contradicts Q1's "empty-state guiado" decision.

### Q4 — Industry presets

**Chosen:** Single vertical, no presets.

**Why:** AIMS-OS targets agentic enterprise as a clear vertical. The 5 presets in the original doc (automotive, retail, restaurant, finance, generic) only swap labels — added surface without demonstrable value for v1.

### Q5 — Done step

**Chosen:** Cross-studio bridges (Build agent tools → Agent Studio, Set who can access → Admin Studio, Add another source → resets wizard).

**Why:** Reinforces the 3-studio model. The doc's "Add another / Open dashboard / Invite team" didn't activate AIMS-OS's unique value proposition (data → tools → governance).

### Q6 — Resumability

**Chosen:** Always resumable, silent persist on dismiss.

**Why:** The doc's design principle "Resumable, not punishing" is core. No confirmation modal on close — state is preserved in localStorage automatically. The empty state changes to "Resume setup" when there's pending work.

### Q7 — AI in field mapping

**Chosen:** AI suggestions inline with confidence pills.

**Why:** Data Studio's value prop hinges on "AI helps you shape data fast". Since we skipped step 7 (account mapping), the AI confidence pattern was lifted up into step 6.5 (field mapping). Each row shows source field, suggested studio name, suggested type, and a confidence pill (green ≥90 / blue 75–89 / amber <75 / "no match" for 0).

---

## Mapping: original doc → AIMS-OS

Honest accounting of what we kept, what we skipped, and what we replaced.

### Kept

| Doc | AIMS-OS implementation |
|---|---|
| Step 6.1 Category picker | 7 categories, live connector counts per category |
| Step 6.2 Connector picker | Reuses existing `DS_CATALOG` + synthetic entries for Custom REST / GraphQL / CSV / Email-to-inbox |
| Step 6.3 Auth (5 patterns + idle→connecting→connected) | 6 patterns (OAuth, API key, service account, basic, manual, file upload, email) + full 3-state machine + error mode |
| Step 6.4 Preview (4 stat tiles + read-only field table) | Identical structure, per-connector realistic sample fields |
| Step 6.5 Field mapping | Editable table with 7 columns: include / source / studio name / type / nullable / confidence / decision |
| Step 6.6 Sync settings | Cadence picker + incremental toggle + recap card |
| Step 8 Done (hero + 5-row recap + 3 next-step cards) | Same shape, cards repointed to cross-studio bridges |
| Principle: AI as recommendation, never auto-action | Accept / Dismiss per row, plus bulk actions for high-confidence and parked |
| Principle: Quarantine over silent inclusion | Amber banner + "no AI match" chip + dynamic Next label "Continue with N parked →" |
| Principle: Resumable, not punishing | localStorage persistence on every interaction |

### Skipped by design

| Doc | Reason |
|---|---|
| Step 1 Welcome | Replaced by the empty state guiado |
| Step 2 Organization | Tenant identity lives in Admin Studio |
| Step 3 Template/composite | No "composite" concept in AIMS-OS |
| Step 4 Peer rules | No peer comparison concept |
| Step 5 Site profile | AIMS-OS has no "site" primitive |
| Step 7 Map accounts | No chart-of-accounts concept; AI confidence pattern moved to step 6.5 instead |
| Industry presets (vocabulary swap) | Single vertical |

### Added beyond the doc

| Feature | Why |
|---|---|
| Cross-studio bridges in Done step | Activates the 3-studio model |
| Synthetic detail page from `lastCompleted` | Closes the visual loop — clicking the fresh card opens a real detail |
| Demo "Show errors" toggle | The doc lists error states as known limitation; this makes them inspectable |
| Interactive 13-step tour | Stakeholder onboarding for the prototype itself |
| 21 telemetry events through `track()` | Doc lists telemetry as polish; ours is structured and ready for wire-up |

---

## Wizard state model

All onboarding state lives in `obState`, persisted to `localStorage.aims_ds_onboarding`.

```js
obState = {
  // Lifecycle
  phase: 'pending' | 'complete',  // 'pending' = empty state or wizard active
  step: 0..6,                     // 6 = Done screen
  completedAt: ISO string,        // set when finalized

  // Step 1 — Category
  category: 'crm' | 'pm' | 'data' | 'marketing' | 'support' | 'custom' | 'file' | null,

  // Step 2 — Connector
  connector: '<slug>' | null,     // e.g. 'hubspot', 'asana', 'csv-upload'

  // Step 3 — Auth
  auth: {
    status: 'idle' | 'connecting' | 'connected' | 'error',
    apiKey?: string,
    workspace?: string,
    jsonKey?: string,
    endpoint?: string,
    header?: string,
    fileName?: string,
    fileSize?: string,
    inboxAddress?: string,
    detected?: number,            // count of detected types of data on success
    // Error fields (when status === 'error')
    errorMsg?: string,
    errorCode?: string,
    errorField?: 'apiKey' | 'jsonKey' | 'endpoint' | null
  },

  // Step 5 — Mapping
  mapping: {
    slug: '<connector slug>',
    rows: [
      {
        src:        'properties.firstname',      // source field name
        srcType:    'string',                    // detected source type
        sample:     'Sarah',                     // sample value from preview
        include:    true,                        // checkbox
        studio:     'first_name',                // user-editable destination name
        type:       'string',                    // dropdown selection
        nullable:   true,
        confidence: 95,                          // 0..100
        decision:   null | 'accept' | 'dismiss'  // per-row AI verdict
      }
    ]
  },

  // Step 6 — Sync
  sync: {
    cadence: 'realtime' | 'hourly' | 'daily' | 'manual',
    incremental: boolean,
    incrementalField: string | null   // studio field name
  },

  // Final-step output (used by the synthetic detail page)
  lastCompleted: {
    slug, name, vendor, logo, color,
    object: '<sample.object>',
    fieldsIncluded: number,
    fieldsTotal: number,
    cadence: string,
    authType: string,
    completedAt: ISO string
  }
}
```

### State-changing functions

| Function | Purpose |
|---|---|
| `openWizard()` | Set phase=pending, open modal |
| `closeWizard()` | Persist + close modal (no destructive change) |
| `wizardNext()` / `wizardBack()` | Step navigation with validation gates |
| `obPickCategory()` / `obPickConnector()` | Selection persistence |
| `obAuthRun()` | Validate inline → simulate network 1.1s → success or error |
| `obAuthDismissError()` | Clear error and return to idle |
| `obMapToggleInclude()` / `obMapEditField()` / `obMapDecision()` | Per-row mapping edits |
| `obMapAcceptAllHighConf()` | Bulk accept rows where confidence ≥ 75 |
| `obMapAcceptAllParked()` / `obMapDismissAllParked()` | Bulk handle parked (conf=0) rows |
| `obSyncPickCadence()` / `obSyncToggleIncremental()` / `obSyncEditIncrField()` | Sync settings |
| `obFinishAndGo(action)` | Stamp lastCompleted, navigate to studio per action ('agent', 'admin', 'again', 'dashboard') |
| `resetOnboarding()` | Wipe all wizard state, return to empty state |
| `skipOnboardingDemo()` | Flip phase to 'complete' without going through wizard |
| `obEnsureMappingFor(slug)` | Lazily initialize mapping rows from sample fields |

### localStorage keys

| Key | Purpose |
|---|---|
| `aims_ds_onboarding` | The full `obState` JSON |
| `aims_ds_demo_errors` | `'1'` or `'0'` — toggles error simulation |
| `aims_persona` | Admin / End-user persona (shared with `settings.html`) |

---

## Telemetry contract

The single integration point is the `track(event, props)` function. By default it's a no-op. Set `window.AIMS_DEBUG = true` to see events in the console. To wire up to Segment / Amplitude / PostHog / Mixpanel, uncomment the relevant line inside `track()`.

Every event gets these defaults:
```js
{ surface: 'data-studio.onboarding', ts: '<ISO timestamp>', ...props }
```

### Events

**Lifecycle**
- `onboarding_first_visit` — fired once when localStorage has no key
- `wizard_opened { resume, current_step }`
- `wizard_dismissed { step, on_done_screen }`
- `wizard_completed { connector, category, auth_type, fields_total, fields_included, fields_accepted_ai, fields_dismissed, fields_parked, cadence, incremental }`
- `wizard_done_view { connector, completedAt }`
- `wizard_done_cta { action, connector }`  — action ∈ agent / admin / again / dashboard

**Step navigation**
- `wizard_step_view { step, index, connector, category }`
- `wizard_step_complete { step, duration_ms, direction }` — direction ∈ forward / back
- `wizard_step_blocked { step }` — when Next gated by missing input

**Decisions**
- `wizard_category_picked { category, previous }`
- `wizard_connector_picked { connector, category, auth_type, popularity }`
- `wizard_auth_attempt { connector, auth_type }`
- `wizard_auth_success { connector, auth_type, detected_count }`
- `wizard_auth_error { connector, error_code, kind: 'inline' | 'network' }`

**Mapping bulk actions**
- `wizard_mapping_bulk_accept_ai { count, avg_confidence }`
- `wizard_mapping_bulk_accept_parked { count }`
- `wizard_mapping_bulk_dismiss_parked { count }`

**Sync settings**
- `wizard_sync_cadence_pick { cadence, previous }`
- `wizard_sync_incremental_toggle { enabled }`

**Demo controls**
- `onboarding_reset`
- `onboarding_skipped { at_step }`
- `demo_errors_toggled { enabled }`
- `tour_started { surface }`
- `tour_ended { last_step, completed }`

---

## What's pending

Honest list, sorted by impact.

| Priority | Item | Effort |
|---|---|---|
| Medium | Accessibility hardening (focus trap, ESC handler, ARIA live regions, tab order audit) | 1 sprint |
| Medium | Multi-instance handling — wizard prompt for "name this instance" when one already exists | 1 sprint |
| Low | Email setup instructions: real composer + delivery |  30 min |
| Low | Help links / video tutorials: replace placeholder toasts with real links per field | 30 min |
| Low | Backend persistence (replace localStorage with API) | Out of prototype scope |
| Low | Mobile/responsive audit at 375px | 30 min |
| Low | Email format validation (regex) on contact email fields | 15 min |
| Low | Edge case: dismissing the modal with a pending error → clear error on re-open | 15 min |

### Explicitly out of scope (won't do)

- Tenant Organization step (Q1)
- Composite/template picker (Q2)
- Peer rules (Q2)
- Site profile (Q3)
- Account mapping (Q7 — replaced by step 6.5 confidence pattern)
- Industry presets (Q4)

---

## Demo controls cheatsheet

| Trigger | Location | Effect |
|---|---|---|
| **Take the guided tour** | Sidebar bottom (blue button) | 13-step popover walks through the entire flow with auto-advance |
| **Reset to first time setup** | Sidebar bottom (dashed) | Wipes wizard state + lastCompleted, returns to empty state |
| **Show errors** | Sidebar bottom (toggle pill) | When ON, next Connect attempt fails with realistic error message |
| **Skip for now** | Empty state hero | Flips to 'complete' phase so demo connections show |
| **Resume at step N** | Empty state hero (when paused) | Re-opens modal at the paused step |

---

## Stack

Same constraints as the rest of the prototype:
- Single HTML file, no build step
- Vanilla JS, no framework
- Iconify CDN for brand logos
- ~5,500 lines total for `data-studio.html` after all features

The onboarding wizard adds ~1,500 lines to that total (~27% of the file).

---

*For the engineering brief that defines the production model, contact Sebastian Blandon (SVP Engineering) or Edgardo Sierra (Chief Architect). For the original `OnboardingFlow.jsx` artifact this is adapted from, see `OnboardingFlow_Documentation.pdf` on the design team's Notion.*
