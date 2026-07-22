# Data Studio Models — Demo Walkthrough

Guided tour for `data-studio-models.html`. 12 steps covering the full data modeling surface.

**Start the tour:** click the **Demo** button (bottom-left, cyan gradient pill).  
**Deep-link to a step:** append `?tour=N` (1-based) to the URL.  
**Resume:** if you closed mid-tour the button reads "Continue" and reopens at the last step.  
**Keyboard:** `←` / `→` to move, `Esc` to exit, `Tab` trapped inside the popover.

---

## Steps

### 1 — Data Studio: Models *(centered, no spotlight)*
**Route:** `#/models`

Intro frame. Sets context: AIMS-OS Data Studio is where every integration, widget, and agent gets its data structure defined.

---

### 2 — The Model Library
**Route:** `#/models` · **Target:** `.mcard-grid`

Spotlights the model card grid. Each card = a data model (named entity schema + relationships + governance status + platform usage). These are the source-of-truth objects for how data behaves across every surface.

---

### 3 — Toolbar: filter & search
**Route:** `#/models` · **Target:** `.tbar`

Highlights the toolbar: search field, Category / Origin / Status / Owner dropdowns, grid/list view toggle, and the **+ New model** button. Active filters appear as chips.

---

### 4 — Section navigation
**Route:** `#/models` · **Target:** `.mtabs.mtabs-lg`

Points to the section tab strip: **Models · Entities · Tables · Reference Data** — four interconnected views of the same underlying schema.

---

### 5 — Model overview
**Route:** `#/models/crm_core` · **Target:** `.md-tiles`

Navigates into the CRM Core model detail. Spotlights the overview tiles: entity count, table count, column total, cross-model relations, and governance health. Each tile is a clickable jump to that sub-view.

---

### 6 — Live ER diagram *(pulse)*
**Route:** `#/models/crm_core` · **Target:** `.diag-wrap.md-diag`

Spotlights the entity-relationship diagram rendered live from the schema. Hover to trace relations, click to inspect an entity, drag to pan. Relationships color-coded by type.

---

### 7 — Model detail tabs
**Route:** `#/models/crm_core` · **Target:** `.mtabs.md-tabs`

Highlights the sub-tab strip: **Overview · Entities · Tables · Computed Columns · Policies** — all scoped to this model.

---

### 8 — Entities in this model
**Route:** `#/models/crm_core` · **Target:** `.mcard-grid` · **Setup:** `setModelTab('entities')`

Switches to the Entities tab programmatically, then spotlights the entity card grid. Each card shows field count, governance status, and the physical table it maps to.

---

### 9 — Entity detail
**Route:** `#/entities/account` · **Target:** `.mtabs`

Navigates to the Account entity detail page. Spotlights the entity's own tab strip: **Columns · Relationships · Permissions · API endpoints** — everything needed to integrate without extra docs.

---

### 10 — Table detail
**Route:** `#/tables/account` · **Target:** `.tbar`

Navigates to the Account table detail. Spotlights the toolbar. The table view maps raw DB columns to logical type, nullable flag, and FK relationships.

---

### 11 — Reference data
**Route:** `#/reference` · **Target:** `.mcard-grid`

Navigates to the Reference Data section. Spotlights the reference table grid — shared lookup sets (country codes, status enums, taxonomy trees) that any column can link to for auto-validation.

---

### 12 — AI-assisted modeling *(pulse, Finish)*
**Route:** `#/models/new/ai` · **Target:** `.ai-head-row`

Navigates to the AI Assist flow. Spotlights the breadcrumb/header row. Plain-English description → AI drafts schema + relationships + governance tags → user reviews and publishes.

---

## Tour engine features

| Feature | Detail |
|---|---|
| Keyboard nav | `←` `→` move, `Esc` exits |
| Focus trap | `Tab` stays inside the popover; focus returns to Demo button on exit |
| Deep-link | `?tour=N` (1-based) opens at step N |
| Resume | `localStorage` key `dsm-tour-step`; button label swaps to "Continue" |
| Restart | "Restart" link in the popover header resets to step 1 |
| Click-through spotlight | 4-strip mask leaves a hole over the target so it stays interactive |
| ARIA | `role="dialog" aria-modal="true"`; `aria-live="polite"` announces each step |
| Reduced motion | `prefers-reduced-motion` disables pulse and popover animation |
| Responsive | Bottom-sheet layout at ≤ 560 px |
| Dark / light | Mask and spotlight adapt to `html.theme-light` |
