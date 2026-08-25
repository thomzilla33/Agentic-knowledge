# Admin Console Home — Command Center

**Date:** 2026-07-31  
**File:** `settings.html`  
**Route:** `#/home` (new default)  
**Status:** Approved for implementation

---

## Goal

Replace the current default landing (`#/integrations`) with a dedicated home state that serves two admin profiles:

- **IT Admin (tenant)** — enters to triage issues fast
- **Platform Admin** — enters to review overall workspace state

The landing must prioritize issues first, then give a map of the full console.

---

## Architecture

The home state is a new render function `renderAdminHome()` wired into the existing `route()` function. No new files — the implementation lives inside `settings.html` alongside the other render functions (`renderHome`, `renderAudit`, etc.).

The default route changes from `'integrations'` → `'home'`.

---

## Layout

Two-zone layout inside the existing `.content` area:

```
┌──────────────────────────────────────────────────────┐
│  HEADER: "Admin Console"    "Welcome back, TG · Contoso Ltd"  │
├────────────────────────┬─────────────────────────────┤
│  NEEDS ATTENTION (35%) │  SECTIONS GRID (65%)        │
│                        │                             │
│  1 real alert row      │  11 section cards           │
│  2 skeleton rows       │  3 columns, grouped by      │
│  Empty state below     │  Personal/Tenant/Platform   │
└────────────────────────┴─────────────────────────────┘
```

On narrow viewports (sidebar expanded): zones stack vertically, Needs Attention first.

---

## Components

### 1. Header

A single `<div class="ac-home-header">` row with:

- **Left:** "Admin Console" — `font-size:18px`, `font-weight:700`, `color:var(--t1)`
- **Right:** "Welcome back, TG · Contoso Ltd" — `font-size:13px`, `color:var(--t3)`

No hero image, no subtitle, no timestamp. Utility-first.

---

### 2. Needs Attention Panel

```html
<section class="ac-home-alerts">
  <h2 class="ac-home-section-label">Needs Attention</h2>
  <!-- Real alert row -->
  <div class="ac-alert-row ac-alert-row--real">
    <span class="ac-alert-dot"></span>
    <div class="ac-alert-body">
      <span class="ac-alert-section">Integrations &amp; Credentials</span>
      <span class="ac-alert-desc">1 integration is failing</span>
    </div>
    <a class="ac-alert-cta" href="#/integrations">Review →</a>
  </div>
  <!-- Skeleton rows -->
  <div class="ac-alert-row ac-alert-row--skeleton">
    <div class="ac-skeleton ac-skeleton--wide"></div>
  </div>
  <div class="ac-alert-row ac-alert-row--skeleton">
    <div class="ac-skeleton ac-skeleton--medium"></div>
  </div>
  <!-- Empty state -->
  <p class="ac-home-empty-note">
    Items requiring action across all sections will appear here.
  </p>
</section>
```

**Skeleton rows:** `background: rgba(255,255,255,0.05)`, `border-radius:6px`, CSS `@keyframes pulse` animation at 2s ease-in-out infinite, opacity 0.5→1→0.5.

**Real alert dot:** `8px` circle, `background:#F97316` (amber — warning, not error).

**"Review →" CTA:** `color:var(--pri)`, navigates to `#/integrations`.

---

### 3. Section Grid

```html
<section class="ac-home-sections">
  <div class="ac-section-group">
    <h3 class="ac-section-group-label">Personal</h3>
    <div class="ac-section-cards">
      <!-- card per section -->
    </div>
  </div>
  <!-- repeat for Tenant, Platform -->
</section>
```

**Card anatomy:**

```html
<div class="ac-section-card ac-section-card--soon">
  <div class="ac-card-name">People &amp; Access</div>
  <div class="ac-card-desc">Manage users, roles, and invitations</div>
  <div class="ac-card-footer">
    <span class="ac-card-badge ac-card-badge--soon">○ Coming soon</span>
  </div>
</div>
```

**Active card (clickable):**

```html
<div class="ac-section-card ac-section-card--active" onclick="navigate('#/integrations')" role="button" tabindex="0">
  <div class="ac-card-name">Integrations &amp; Credentials</div>
  <div class="ac-card-desc">Authenticate and govern third-party connections</div>
  <div class="ac-card-footer">
    <span class="ac-card-badge ac-card-badge--active">● Active</span>
    <span class="ac-card-alert-badge">⚠ 1</span>
  </div>
</div>
```

**Card states:**

| State | CSS class | opacity | cursor | hover |
|-------|-----------|---------|--------|-------|
| Coming Soon | `ac-section-card--soon` | 0.50 | default | none |
| Active | `ac-section-card--active` | 1.0 | pointer | border: 1px solid var(--pri) |
| Active + alert | `ac-section-card--active` + `ac-card-alert-badge` | 1.0 | pointer | same |

**Active sections in prototype:**
- Integrations & Credentials → `#/integrations` (has alert)
- Audit & Compliance → `#/audit`

All other 9 sections → Coming Soon (non-clickable).

**Grid:** CSS `display:grid; grid-template-columns: repeat(3, 1fr); gap:12px`

**Section descriptions (copy):**

| Section | Description |
|---------|-------------|
| My Settings | Your personal preferences and account details |
| People & Access | Manage users, roles, and workspace invitations |
| Organization | Configure your organization structure and details |
| Identity & Security | SSO, MFA, and authentication policies |
| Studios & Entitlements | Manage licensed products and studio access |
| Billing & Subscription | Plans, invoices, and payment methods |
| Governance Defaults | Default policies applied across all studios |
| Data & Privacy | Data retention, export, and compliance settings |
| Integrations & Credentials | Authenticate and govern third-party connections |
| Notifications | Alert channels, rules, and delivery preferences |
| Audit & Compliance | Activity logs and compliance reporting |

---

## Routing Changes

### `route()` function

```javascript
// Line 9944 — change default
const hash = window.location.hash.replace(/^#\/?/, '') || 'home'; // was 'integrations'

// Add to ssbMap (no sidebar item is marked active for home)
// home route renders renderAdminHome()

} else if (parts[0] === 'home' || parts[0] === '') {
  renderAdminHome();
}
```

### Sidebar active state

No sidebar item is activated when `hash === 'home'`. The home screen is the console's orientation layer, not a section. All `.ssb-item` elements receive `classList.remove('active')` and none are re-added.

### `navigate()` helper (already exists as `window.location.hash = hash`)

Cards use `onclick="location.hash='#/integrations'"` — no new helper needed.

---

## CSS tokens used

All colors via existing tokens — no new hardcoded hex:

- `var(--t1)` — primary text
- `var(--t2)` / `var(--t3)` — secondary/muted text
- `var(--bg2)` / `var(--line)` — card background and borders
- `var(--pri)` / `var(--pri-10)` — active accent and hover states
- `var(--hover)` — card hover background

---

## What is NOT in scope

- Real data fetching — all alert data is hardcoded for the prototype
- Dismissing alerts — the "Review →" CTA is the only action
- KPI chips (Users count, Entitlements count) — deferred; skeleton rows communicate "more data coming"
- Personalization or saved state — home always renders the same
- Mobile layout — responsive enough not to break; not designed for phone

---

## Acceptance criteria

- [ ] Navigating to `settings.html` (no hash) renders the home screen
- [ ] Navigating to `settings.html#/home` renders the home screen
- [ ] No sidebar item is highlighted when on home
- [ ] "Integrations & Credentials" card is clickable and navigates to `#/integrations`
- [ ] "Audit & Compliance" card is clickable and navigates to `#/audit`
- [ ] All other 9 cards are non-clickable with opacity 0.50
- [ ] "Review →" in Needs Attention navigates to `#/integrations`
- [ ] Skeleton rows have pulse animation
- [ ] Works in dark and light mode (tokens only)
- [ ] Back button in sidebar ("← Back to Agentic Studio") is visible on home
