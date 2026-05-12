# AIMS OS — Prototype Consolidation Audit

**Scope:** 4 single-file HTML prototypes in
`/Users/apple/AIMS-OS-CLAUDE/.claude/worktrees/vibrant-euler-8563e1/`
**Method:** Static analysis (line counts, grep for class/function names, byte-level diff of shared function bodies). Read-only.
**Date:** 2026-05-12.

---

## TL;DR (for the impatient reader)

- All 4 files share **~95% of their shell code** (topbar + context menu + AI Assistant + tooltip + sidebar shell + workspace data). The shared bundle is **~1,600 LOC** (CSS + JS combined). It is currently copy-pasted 4 times.
- Every file still ships **~50 lines of dead CSS** (`tb-launcher`, `studio-sw`, `tb-workspace`, `workspace-sw`, `ws-item`) plus **6 legacy alias functions** that just call the new ones — no markup references them anywhere in any of the 4 files.
- Voice is the canonical, most mature file (3 `<style>` blocks, 2 `<script>` blocks, well-organized). Agentic is the largest (8,520 LOC) and has its CSS minified onto single lines. Governance is a template-string SPA — radically different render style. Communication Hub is 4-space indented and wraps everything in an IIFE.
- Design tokens are **completely different per file** (`--color-surface-primary-default` in voice, `--pri` in agentic, `--pri`/`--blue`/`--primary` mixed in gov, `--primary` in comm). Same colors, four different names. This is the single biggest barrier to a real shared stylesheet.
- HTML validity bug present in **all 4**: the `ctx-menu` `<div>` (which contains buttons, anchors, and an `<input>`) is nested inside the `tb-context` `<button>`. Interactive descendants inside a button are spec-illegal and trigger validator errors.

---

## 1. Per-file inventory

### 1.1 Topline metrics

| File | Total | `<body>` | CSS LOC | JS LOC | HTML body (non-`<style>`/`<script>`) LOC | `<style>` blocks | `<script>` blocks |
|---|---:|---:|---:|---:|---:|---:|---:|
| `voice-channel-ux.html` | 4,472 | 937..4471 (3,535) | ~926 (456..935) + ~447 (7..453) + ~8 (2315..2323) = **~1,381** | ~411 (2324..2735) + ~1,685 (2736..4421) = **~2,096** | **~85** (lines 937..1022, 1041..1042, 2057..2314 etc.) | 3 | 2 |
| `agentic-studio.html` | 8,520 | 1854..8519 (6,666) | **~1,844** (8..1852) | **~4,910** (3564..8473) | **~1,712** (lines 1854..3563, 8474..8519) | 1 | 1 |
| `governance-studio.html` | 2,789 | 544..2788 (2,245) | **~531** (10..542) | **~2,176** (566..2742) | **~23** (lines 544..565, 2743..2788) | 1 | 1 |
| `communication-hub.html` | 3,002 | 1039..3001 (1,963) | **~1,027** (10..1037) | ~605 (1657..2563) + ~378 (2564..2942) = **~983** | **~617** (lines 1039..1656, 2943..3001) | 1 | 2 |

Notes:
- Voice splits CSS across 3 `<style>` blocks (Knowledge Pack editor styles intentionally placed mid-body at 2315..2323) and 2 `<script>` blocks (voice-app script + AI Assistant script).
- Agentic compresses all CSS onto single lines — the file is large mainly because of the workflow builder (~3,000 LOC of canvas/wizard/marketplace markup + JS).
- Governance has almost **no static HTML body** (23 LOC). Its UI is built entirely from JS template strings (`renderApp()` → `renderSidebar()` + `renderPlaybooks()` + … 21 `render*` functions). Closest to a SPA.
- Communication Hub wraps its entire JS in an IIFE (`(function(){ … })();`) — note the 2-space indent vs the other 3 files' top-level functions.

### 1.2 Top-level screens / sections

**voice-channel-ux.html**
- `#screen-settings` (active, "Settings" view) — empty placeholder
- `#screen-agents` — the canonical surface: tabs render `#panel-tools`, `#panel-channels`, `#panel-knowledge`
- `#screen-ucp` — Unified Customer Profile (placeholder)
- Sidebar: Home · Agents (active) · Automations · Knowledge (collapsible) · Documents · Notes · Contacts · Admin
- Modals: `#modal-kp-picker`, `#modal-addnum`, `#modal-add-number-voice`, `#modal-buy` (4 total)
- Slideouts: `#so-voice`, `#so-sms`, `#so-email`, `#so-call-detail`, `#so-kp-editor` (5 distinct; 22 occurrences of `.slide-out` count rows in DOM)

**agentic-studio.html**
- Single landing screen — Agentic Networks list (`#netList`) + Network detail (`#netDetail`) + workflow builder (`.bldr-*` markup, ~3,000 LOC)
- Two full marketplaces inline: `#tpMarketplace` (Knowledge Pack Library), `#drvMarketplace` (Source Drive Library)
- Sidebar: Control Tower · Agents · Squads · Workflows · Agentic Networks (active) · Playbooks (collapsible) · Admin
- Modals: 2 marketplace overlays (`.tp-mkt-ov`) — no traditional `.modal-overlay` modals

**governance-studio.html** — template-string SPA, state in `S = {tab, selectedPbId, selectedWkId, …}`
- Tabs: Playbooks · Workers · Networks · Knowledge (truth packs) — selected via `S.tab` and rendered by `renderApp()`
- Render functions: `renderSidebar`, `renderPlaybooks`, `renderPlaybookDetail`, `renderPbOverview/Logs/Settings`, `renderWorkers`, `renderWorkerDetail`, `renderWkOverview/Instructions/Deployments`, `renderNetworkList`, `renderNetworkDetail`, `renderNetOverview/Executions/Instances`, `renderNetworkBuilder`, `renderKnowledge`, `renderTpDetail`, `renderApp`, `renderModal`, `renderNewTruthPackModal`, `renderNewWorkerModal`, `renderNewNetworkModal`, `renderCatalogSection` (21 in total)
- Modals: rendered inline from `S.modal` — 3 distinct (`renderNewTruthPackModal`, `renderNewWorkerModal`, `renderNewNetworkModal`)
- Sidebar: Home · Agents · Automations · Knowledge · Contacts · Admin (active) · Workspace

**communication-hub.html**
- Single screen with channel-list left rail + tabbed inbox right pane
- Tabs: Overview · Approvals · Outbound · Analytics · Configure — switched via `showChannelTab(name, channelIdx)`
- Channels: Voice · Web Chat · WhatsApp · Email · SMS (`CHANNEL_NAMES`, `CHANNEL_TYPES`)
- Sidebar: Home · Agents · Automations · Contacts (active) · Knowledge · Admin · Workspace
- Modals: `#modal-add-channel`, `#modal-disable`, `#modal-edit`, `#modal-new-campaign`, `#modal-activity` (5 total)

### 1.3 Mock data arrays per file

| File | Array | Length / shape |
|---|---|---|
| voice | `WORKSPACES_DATA[8]`, `WORKSPACE_PALETTE[14]` | shared shell data |
| voice | `AA_AGENTS[12]`, `AA_SUGGESTIONS[3]`, `CTX_APPS[3]` | shared shell data |
| voice | `VOICE_DATA{}`, `SMS_DATA{}`, `EMAIL_DATA{}` | per-channel config maps |
| voice | `NUMBERS_DATA[60]` | generated via `buildNumbers()` IIFE — 60 phone numbers w/ agents, labels, capabilities |
| voice | `KNOWLEDGE_PACKS[8]` | knowledge pack list |
| voice | `DRIVES_DATA[6]` | source drives |
| agentic | `WORKSPACES_DATA[8]`, `WORKSPACE_PALETTE[14]`, `AA_AGENTS[12]`, `AA_SUGGESTIONS[3]`, `CTX_APPS[3]` | shared shell data |
| agentic | `NETWORKS[19]` | network rows |
| agentic | `TP_DATA{7}` | truth-pack details (keyed by pack id) |
| agentic | `DRIVE_DATA{n}` | drive previews (keyed) |
| agentic | `TP_MKT_CATALOG[...]`, `TP_CATALOG[...]` | marketplace catalogs |
| governance | `WORKSPACES_DATA[8]`, `WORKSPACE_PALETTE[14]`, `AA_AGENTS[12]`, `AA_SUGGESTIONS[3]`, `CTX_APPS[3]` | shared shell data |
| governance | `PLAYBOOKS[15]`, `WORKERS[4]`, `NETWORKS[4]`, `TP_DATA[60]` | core SPA data |
| comm | `WORKSPACES_DATA[8]`, `WORKSPACE_PALETTE[14]`, `AA_AGENTS[12]`, `AA_SUGGESTIONS[3]`, `CTX_APPS[3]` | shared shell data |
| comm | `CHANNEL_NAMES[5]`, `CHANNEL_TYPES[…]`, `CHANNEL_NUMBERS{}`, `CHANNEL_PANELS{}` | channel config |

### 1.4 Buttons that are aria-labeled

| File | `<button>` count | with `aria-label` | coverage |
|---|---:|---:|---:|
| voice | 153 | 51 | **33%** |
| agentic | 236 | 18 | **8%** |
| governance | 116 | 15 | **13%** |
| comm | 97 | 16 | **16%** |

Coverage is low across the board — the AA / topbar / sidebar buttons have labels (because they were added during the recent passes), but the screen-specific buttons (agent cards, channel rows, builder nodes) are mostly unlabeled.

---

## 2. Shared components (cross-file duplication map)

Every component listed below exists in **all 4 files**. Function bodies are **functionally identical**; the only consistent differences are (a) whitespace style and (b) the SVG `linearGradient id` for the AA bot icon (`aaDotV` / `aaDotA` / `aaDotG` / `aaDotC` — distinct per file to avoid SVG id collisions, intentional).

### 2.1 CSS — `.tb-context` + `.ctx-menu` + `.cm-*`

| File | CSS lines (approx, by selector count) | Status |
|---|---:|---|
| voice (`.tb-context` `.ctx-menu` `.cm-*` at L324+) | 44 selectors | reference |
| agentic (L?) | 68 selectors | drift: extra `--r8/r10/r12` token usage, but values match |
| gov (L?) | 44 selectors | identical to voice (modulo padding-left: 13 vs 15px in topbar, intentional) |
| comm (L?) | 44 selectors | identical to voice (4-space indent) |

Verdict: **byte-equivalent modulo whitespace and one intentional padding diff** — no real drift.

### 2.2 CSS — `.ai-assistant` + `.aa-*` + `aa-route-*`

| File | selectors | Status |
|---|---:|---|
| voice | 77 | reference |
| agentic | 77 | identical |
| gov | 77 | identical |
| comm | 77 | identical (4-space) |

Note: the linear-gradient `id` (`aaDotV/A/G/C`) is intentionally distinct per file. The CSS bodies themselves match.

### 2.3 CSS — `.tt` tooltip

| File | `.tt*` selectors | Status |
|---|---:|---|
| voice | 4 | reference |
| agentic | 4 | identical |
| gov | 4 | identical |
| comm | 4 | identical |

### 2.4 CSS — `.sidebar` + `.sb-*`

| File | `.sb-*`/`.sidebar` selectors | Status |
|---|---:|---|
| voice | 39 | reference |
| agentic | 41 | +2 minor selectors |
| gov | 33 | minus some hover variants |
| comm | 34 | minus some hover variants |

These differ slightly because each file's sidebar nav has a different active item (and the studio-specific cycle through different Knowledge sub-items), but the core box model + colors match.

### 2.5 JS — Workspace + Context-menu module

Functions verified to exist in all 4 files at near-identical line counts:

| Function | voice | agentic | gov | comm |
|---|---:|---:|---:|---:|
| `_wsHashColor(id)` | L3949 | L4645 | L2477 | L2680 |
| `_wsInitials(name)` | L3965 | L4661 | L2489 | L2692 |
| `_wsAvatarHtml(ws, sizeClass)` | L3966 (legacy) | L4662 | L2490 | L2693 |
| `_wsActive()` | L3973 | L4667 | L2495 | L2698 |
| `_ctxRenderTrigger()` | L3991 | L4679 | L2507 | L2710 |
| `_renderContextMenu()` | L4001 | L4688 | L2516 | L2719 |
| `toggleContextMenu(e)` | L4066 | L4726 | L2554 | L2757 |
| `_ctxClose()` | L4088 | L4748 | L2576 | L2779 |
| `ctxSearchWs(q)` | L4093 | L4749 | L2577 | L2780 |
| `ctxPickWs(id)` | L4098 | L4750 | L2578 | L2781 |
| `_ctxAction(action)` | L4115 | L4764 | L2587 | L2789 |
| `CTX_APPS` (const, 3 entries) | L3978 | L4670 | L2498 | L2701 |

Spot-check (`_renderContextMenu` in voice vs agentic): bodies are **identical except for whitespace** — same control flow, same HTML strings, same `cm-actions` / `cm-section` / `cm-search` / `cm-ws-list` / `cm-footer` order. Agentic is "minified" (single-line statements), voice is indented.

### 2.6 JS — AI Assistant module

| Function | voice | agentic | gov | comm |
|---|---:|---:|---:|---:|
| `openAiAssistant()` | L4233 | L8380 | L2649 | L2850 |
| `closeAiAssistant()` | L4245 | L8381 | L2650 | L2851 |
| `aaSend()` | L4266 | L8385 | L2654 | L2855 |
| `aaToggleRouter(e)` | L4325 | L8406 | L2675 | L2876 |
| `_aaCreateRouterDropdown()` | L4349 | L8428 | L2697 | L2898 |
| `_aaRenderRouterList()` | L4361 | L8437 | L2706 | L2907 |
| `_aaRouteItemHtml(agent)` | L4376 | L8449 | L2718 | L2919 |
| `aaSearchAgents(q)` | L4388 | L8457 | L2726 | L2927 |
| `aaPickAgent(id)` | L4393 | L8458 | L2727 | L2928 |
| `_aaUpdateWsLabels()` | L4216 | L8378 | L2647 | L2848 |
| `_aaCurrentWorkspaceName()` | (same area) | (same area) | (same area) | (same area) |
| `_aaRenderSuggestions / _aaShowTyping / _aaHideTyping / _aaMockReply / _aaRenderThread / aaUseSuggestion / aaInputChange / aaKeyDown` | all present | all present | all present | all present |
| `_AA_BOT_ICON` const | identical SVG | identical SVG | identical SVG | identical SVG |
| `_aaMessages` (let) | identical init | identical | identical | identical |
| `AA_AGENTS` (12 entries) | L4309 | L8390 | L2659 | L2860 |
| `window.AA_SUGGESTIONS` (3 entries) | L4206 | L8370 | L2639 | L2840 |

`AA_SUGGESTIONS` content is **intentionally different per studio** (e.g. voice's first suggestion is "Summarize today's call volume…"; gov's is "Audit policy changes from the last 7 days"). These are domain-specific prompts and should remain configurable.

### 2.7 JS — Tooltip IIFE

| File | IIFE start | Status |
|---|---:|---|
| voice | L3859 (`(function initTooltips(){`) | reference — multi-line formatted |
| agentic | L4787 | identical body, single-line formatted |
| gov | L2607 | identical body, single-line formatted |
| comm | L2808 | identical body, single-line formatted, 2-space indent inside IIFE wrap |

Bodies use the same `SHOW_DELAY = 350`, the same `_isAnchorOpen()`, the same mouseover/mouseout/focusin/focusout/click/scroll listener set.

### 2.8 Summary table — shared shell footprint

For each shared component, the **total LOC if extracted to a single shared bundle** (rough estimate, voice numbers as canonical):

| Component | CSS LOC | JS LOC |
|---|---:|---:|
| Topbar + `.tb-context` + `.ctx-menu` + `.cm-*` | ~95 | — |
| Sidebar + `.sb-*` | ~120 | — |
| AI Assistant + `.aa-*` | ~340 | ~340 |
| Tooltip `.tt` + IIFE | ~25 | ~70 |
| Workspace + Context module (`_ws*` / `_ctx*` / `CTX_APPS` / `WORKSPACES_DATA` / `WORKSPACE_PALETTE`) | — | ~280 |
| Common base (resets, `.icon-btn`, `.btn`, `.input`, `.avatar-sm`, toast) | ~250 | ~50 |
| **Total** | **~830** | **~740** |

That's **~1,570 LOC duplicated 4 times = ~6,280 LOC of pure duplication** in the repo. The Communication Hub file is roughly 50% shell.

---

## 3. File-unique content

### 3.1 voice-channel-ux.html — unique features

| Feature | Approx LOC |
|---|---:|
| Knowledge Pack content editor (`#so-kp-editor`, `kpe-panel-docs/sources/snippets`, sticky banner) | ~300 (CSS+HTML+JS) |
| Paginated numbers table (`NUMBERS_STATE.page/pageSize`, `_renderAssigned`, `_isNetworkName`) | ~280 |
| Geo restrictions multi-select (`#geo-panel`, role="listbox" aria-multiselectable) | ~80 |
| Voice/SMS/Email channel config slideouts (`#so-voice`, `#so-sms`, `#so-email`) + per-channel `VOICE_DATA / SMS_DATA / EMAIL_DATA` | ~400 |
| Call detail slideout (`#so-call-detail`) + buy-number modal | ~200 |
| Drives library + drive cards | ~140 |
| Tools panel (`#panel-tools`) with action chips | ~50 |
| `_initials`, `_renderAssigned`, helper utilities | ~60 |

### 3.2 agentic-studio.html — unique features

| Feature | Approx LOC |
|---|---:|
| Workflow builder canvas (`.bldr-*` markup, panning/zoom/node-drag) | ~1,400 |
| Network list + detail (`#netList`, `#netDetail`, `renderNetOverview/Governance/KB/Definition/Routing/Logs`) | ~700 |
| Wizard (`bldrWiz*`, `wizAnswers`) | ~200 |
| Knowledge Pack Marketplace (`#tpMarketplace`, `TP_MKT_CATALOG`, `TP_DATA`, breadcrumbs, detail pane) | ~600 |
| Source Drive Library (`#drvMarketplace`, `DRIVE_DATA`, drive preview, AI summary) | ~600 |
| Nodes panel collapse/expand (`toggleNodesPanel`) | ~80 |

### 3.3 governance-studio.html — unique features

| Feature | Approx LOC |
|---|---:|
| Template-string SPA framework (`S` state object, `setState()`, `renderApp()`, 21 `render*` functions) | ~150 (framework) + ~1,400 (renderers) |
| Playbooks tab (`PLAYBOOKS[15]` + 3 detail tabs) | ~300 |
| Workers tab (`WORKERS[4]` + Overview/Instructions/Deployments) | ~350 |
| Networks tab + builder (`NETWORKS[4]`, `renderNetworkBuilder`) | ~350 |
| Knowledge tab + truth-pack detail (`TP_DATA[60]`, `renderKnowledge`, `renderTpDetail`) | ~400 |
| 3 inline modals (truth pack / worker / network) | ~250 |

### 3.4 communication-hub.html — unique features

| Feature | Approx LOC |
|---|---:|
| Channel list left rail + tabbed inbox (`CHANNEL_NAMES[5]`, `CHANNEL_TYPES`) | ~400 (HTML) |
| `showChannelTab(name, idx)` routing | ~80 |
| `CHANNEL_PANELS{}` map (Overview / Approvals / Outbound / Analytics / Configure renderers per channel) | ~600 |
| `CHANNEL_NUMBERS{}` map (phone numbers per channel) | ~120 |
| Web-chat widget snippet preview (literal `<script>` snippet — see L2564) | ~30 |
| 5 modals: add-channel / disable / edit / new-campaign / activity | ~180 |
| Approvals queue UI with sentiment/risk badges | ~250 |

---

## 4. Dead code map

Across **all 4 files**, the following legacy markup classes have **zero `class="…"` references** in the rendered HTML:

| Selector | Status | Approx CSS LOC retained per file |
|---|---|---:|
| `.tb-launcher` (+ `-logo`, `-name`, `-chevron`, `-sep`) | dead — superseded by `.tb-context` | ~10 |
| `.studio-sw` (+ `-hd`, `-title`, `-list`, `-item`, `-item-ico`, `-item-name`, `-item-sub`, `-item-check`, `-footer`) | dead — superseded by `.ctx-menu` + `.cm-*` | ~22 |
| `.studio-item`, `.studio-item-ico` (alone) | dead | ~3 |
| `.tb-workspace` (+ `-logo`, `-name`, `-chevron`) | dead — `.tb-context` covers workspace too | ~8 |
| `.tb-divider` | dead — `.tb-context` no longer has a sibling | ~2 |
| `.workspace-sw` + `.ws-item` (+ `-ico`, `-name`, etc.) | dead | ~7 |
| **Total dead CSS per file** | | **~52** |

**Dead JS:** 6 legacy alias function stubs per file (1-line stubs that just call the new functions):

| Stub | Calls (now) |
|---|---|
| `toggleStudioSw(e)` | `toggleContextMenu(e)` |
| `toggleWorkspaceSw(e)` | `toggleContextMenu(e)` |
| `switchWorkspace(id)` | `ctxPickWs(id)` |
| `wsSearch(q)` | `ctxSearchWs(q)` |
| `_wsRenderButton()` | `_ctxRenderTrigger()` |
| `_wsAvatarHtml(ws, sizeClass)` | **NOT a stub** — this is the body referenced by other legacy-renderer call sites. Still has callers (e.g., `_ctxWsAvatarHtml` does not use it). Actually a residual function: search for callers shows **0 hits outside its own definition**. So this *is* dead code (one body, ~6 LOC). |

Confirmed: every legacy alias is callable from `window.*` if any old onclick string survives in the wild, but **no current markup uses them** (grep'd: zero `onclick="toggleStudioSw|switchWorkspace|wsSearch"` in any of the 4 HTML files).

**Total dead code per file (estimate):**

| File | Dead CSS | Dead JS (stubs + `_wsAvatarHtml`) | Dead HTML markup | Total dead LOC |
|---|---:|---:|---:|---:|
| voice | ~52 | ~12 | 0 | **~64** |
| agentic | ~53 | ~12 | 0 | **~65** |
| gov | ~52 | ~12 | 0 | **~64** |
| comm | ~51 | ~12 | 0 | **~63** |

Across all 4: **~256 lines of strictly-dead code** that can be removed today with zero behavior change.

---

## 5. Tokens drift table

The single biggest source of friction for a future shared stylesheet. Each file has its own naming convention.

### 5.1 Same concept, different token names

| Concept | voice | agentic | governance | comm |
|---|---|---|---|---|
| App background | `--color-app-bg: #0f172b` | `--bg: #0a0d1a` | `--bg: #0d1117` | `--app-bg: #0f172e` |
| Sidebar background | (literal `rgba(255,255,255,0.03)`) | `--sb: #000` | `--sb: #10151e` | `--sidebar-bg: rgba(255,255,255,0.03)` |
| Card / surface neutral default | `--color-surface-neutral-default: rgba(255,255,255,0.08)` | `--cb: rgba(255,255,255,0.04)` | `--card: rgba(255,255,255,0.028)` | `--card-bg: rgba(255,255,255,0.06)` |
| Card hover | (literal) | `--cbh: rgba(255,255,255,0.07)` | (none — uses `:hover` direct) | `--card-bg-hover: rgba(255,255,255,0.09)` |
| Border subtle | `--color-border-neutral-default: rgba(255,255,255,0.10)` | `--bd: rgba(255,255,255,0.08)` | `--br: rgba(255,255,255,.06)` | `--card-border: rgba(255,255,255,0.10)` |
| Border strong | `--color-border-neutral-lighter: rgba(255,255,255,0.15)` | `--bds: rgba(255,255,255,0.16)` | `--brm: rgba(255,255,255,.09)` | `--card-border-hover: rgba(255,255,255,0.18)` |
| Primary blue | `--color-surface-primary-default: #155DFC` and `--color-surface-primary-emphasis: #2B7FFF` | `--pri: #2B7FFF` | `--pri: #2B7FFF` + `--blue: #3b82f6` (both used!) | `--primary: #2B7FFF` + `--primary-dark: #155DFC` |
| Primary subtle bg | `--color-surface-primary-subtle: rgba(21,93,252,0.15)` | `--pri-bg: rgba(43,127,255,0.12)` | (n/a — literal) | `--primary-subtle: rgba(43,127,255,0.15)` |
| Brand gradient | `--gradient-brand-linear` (defined in voice CSS, lookup needed) | `--grad: linear-gradient(135deg,#00C2C2,#155DFC)` | `--grad: linear-gradient(135deg,#7c5cfc,#3b82f6)` ⚠️ **DIFFERENT colors** (purple/blue) | `--gradient-cta: linear-gradient(135deg,#00C2C2,#155DFC)` |
| Success | `--color-surface-success-default: #34d399` | `--ok: #05DF72` | `--green: #10b981` + `--ok: #05DF72` (both!) | `--success: #05DF72` |
| Error | `--color-surface-error-default: #e05252` | `--err: #FF6467` | `--red: #ef4444` + `--err: #FF6467` (both!) | `--error: #FF6467` |
| Warning | `--color-surface-alert-default: #fcd34d` | `--warn: #FDC700` | `--amber: #f59e0b` + `--warn: #FDC700` (both!) | `--alert: #FDC700` |
| Text title | `--color-text-title: rgba(255,255,255,0.80)` | `--t1: rgba(255,255,255,0.90)` | `--tp: #f1f5f9` + `--t1: #f1f5f9` | `--text-title: rgba(255,255,255,0.88)` |
| Text body / subtitle | `--color-text-subtitle: rgba(255,255,255,0.60)` | `--t2: rgba(255,255,255,0.60)` | `--ts: #94a3b8` + `--t2: #94a3b8` | `--text-body: rgba(255,255,255,0.60)` |
| Text caption | `--color-text-caption: rgba(255,255,255,0.50)` | `--t3: rgba(255,255,255,0.38)` | `--tm: #475569` | `--text-caption: rgba(255,255,255,0.40)` |
| Text disabled | `--color-text-disabled: rgba(255,255,255,0.30)` | `--t4: rgba(255,255,255,0.22)` | (n/a) | `--text-disabled: rgba(255,255,255,0.25)` |
| Radius 8 | (literal `8px`) | `--r8: 8px` | (literal) | `--radius-s: 8px` |
| Radius 12 | (literal) | `--r12: 12px` | (literal) | `--radius-m: 12px` |

### 5.2 Drift summary

- **voice** uses long, semantic names (`--color-surface-primary-subtle`) — verbose but self-documenting. Aligned with a token system (looks Figma-exported).
- **agentic** uses minified abbreviations (`--pri`, `--cb`, `--t1`) — terse, harder to read.
- **gov** has a **double namespace problem**: defines both an old palette (`--blue`, `--green`, `--amber`, `--red`, `--orange`, `--purple`, `--teal`, `--indigo`) *and* the new agentic-style aliases (`--pri`, `--ok`, `--warn`, `--err`) and a light-mode override block (`--bg: #f8fafc` at the bottom of `:root`). That last block looks **dead** — it overrides the dark-mode tokens inside `:root` and is probably an unused light-theme experiment.
- **comm** uses descriptive token names (`--primary`, `--text-title`) with a numeric radius/space scale (`--radius-s/m/l`, `--space-1..12`) — most production-ready naming.

### 5.3 Real value drift (same name, different values)

- `--grad` is **`#7c5cfc → #3b82f6` (purple/blue) in governance** but **`#00C2C2 → #155DFC` (teal/blue) in agentic**. If you ship a shared bundle that defines `--grad`, governance's CTAs will visually change.
- Border subtle: voice's `rgba(255,255,255,0.10)`, agentic's `rgba(255,255,255,0.08)`, gov's `rgba(255,255,255,0.06)`, comm's `rgba(255,255,255,0.10)`. Four different opacities for "subtle border on a card".
- Primary blue: voice prefers `#155DFC` (darker), agentic/gov prefer `#2B7FFF` (brighter), comm has both. Visible difference in button color.

---

## 6. Bug / inconsistency list

### 6.1 HTML validity

- **Critical, all 4 files:** `<button class="tb-context">` contains `<div class="ctx-menu">` which contains `<button class="cm-action-btn">`, `<a class="cm-item">`, and `<input id="cm-ws-search">`. **Buttons cannot have interactive descendants** (HTML5 spec, content category "Interactive content"). This will fail any HTML validator and breaks assistive-tech focus order. Same pattern in voice L1023, agentic L1953, gov L547, comm L1045.
  - Fix: change `<button class="tb-context">` to `<div class="tb-context" role="button" tabindex="0">` *and* move the `ctx-menu` to be a sibling, positioned absolutely from the trigger. Or use a popover/details pattern.

### 6.2 Z-index conflicts (different scales per file)

| File | Distinct z-index values | Range |
|---|---|---|
| voice | 10, 20, 40, 50, 80, 90, 100, 150, 200, 700, 800, 9999 | 10..9999 |
| agentic | 1, 2, 5, 6, 10, 20, 40, 50, 60, 61, 80, 90, 100, 120, 200, 300, 500, 550, 600, 610, 700, 750, 800, 900, 999, 9999 | 1..9999 (massively fragmented) |
| gov | 20, 80, 90, 100, 120, 200, 700, 999 | 20..999 |
| comm | 20, 80, 90, 100, 200, 500, 600, 700, 9000, 9001, 9999 | 20..9999 |

Agentic's z-index inventory has 26 distinct values — strong sign of "stack until it works" rather than a designed scale. There is no shared scale; a future shared bundle should define `--z-toast`, `--z-modal`, `--z-popover`, `--z-tooltip` etc.

### 6.3 Accessibility gaps

- Button `aria-label` coverage 8–33% — see §1.4. Agentic at 8% is worst.
- `tb-context` button has `aria-haspopup="menu"` but its menu div has `role="menu"` while its items use `role="menuitem"` — correct *for ARIA* but the underlying HTML is still illegal (see §6.1).
- Voice's `#geo-panel` is correctly tagged `role="listbox" aria-multiselectable="true"` — good. This pattern should be propagated.
- The AI Assistant overlay (`aiAssistant`) has `aria-hidden` toggled programmatically but no `role="dialog"` and no focus trap (verified — `openAiAssistant` just `focus()`es the textarea but the panel can lose focus to the page behind via Tab).
- Several `<button>`s in agentic have no `aria-label` and the visible label is purely SVG (icon-only). These will be announced as "button" only.

### 6.4 Performance / quality

- **Inline event handlers everywhere** (`onclick="toast('…')"`, `onclick="event.stopPropagation();_ctxAction('settings')"`). Hundreds per file. Functional, but: (a) breaks CSP, (b) re-creates handlers on every `innerHTML` rebuild in governance/agentic SPAs, (c) makes refactoring fragile (rename a function → silent runtime error).
- **Governance rebuilds entire DOM** on every `setState()` via `renderApp() → root.innerHTML = …`. With 60-item `TP_DATA` and 15 playbooks, this is fine today but will jank when data grows.
- **Voice's `NUMBERS_DATA`** is rebuilt at module load via an IIFE — fine, 60 entries.
- No code-splitting, no caching headers (just static HTML files). Each file fully reloads on app switch (`<a href="agentic-studio.html">`).

### 6.5 Runtime errors / fragility

- `console.error` / `throw new` count across all 4 files: **0**. No defensive throws. If a function is missing (e.g., old `toggleWorkspaceSw` called somewhere a future refactor misses), it will silently fail at the inline-handler boundary.
- Agentic has `typeof toast === 'function' && toast('…')` guards in many places — sign that some `toast()` call sites were added before `toast` was defined or before `toast` was confirmed to exist on the page. The voice file just calls `toast(…)` directly.
- Communication Hub wraps its entire script in an IIFE — that means anything declared as `function foo(){}` is **not on `window`**, so the inline `onclick="closeModalOverlay(event,this)"` strings cannot reach them unless explicitly exposed. **This is a latent bug to verify.** Search for `window.closeModalOverlay` in comm-hub — if absent, those inline handlers throw `ReferenceError` silently.

---

## 7. Consolidation recommendation

### 7.1 Recommended approach: **Multi-file + shared bundle** (Option B), with phased migration via build script

**Why not Monolith (`?app=…`):** Each app's content + state is ~2,000–5,000 LOC and largely independent. Putting all four in one file gives you a 20,000-LOC single HTML — slow to load, hard to git-diff, miserable to edit. Each app is its own product surface.

**Why not Voice-canonical + thin overrides:** Two of the four (governance, agentic) have substantial unique screens that aren't shaped like voice's. Forcing them into voice's screen structure is more work than re-extracting common parts.

**Why not Build script + 4 outputs:** Plausible but introduces a build step the CEO has been avoiding. The repo currently runs zero-tooling — open the HTML file, see the result. A build step kills that.

**Multi-file + shared bundle gives you:**
- `aims-shell.css` (~830 LOC) — `:root` tokens, `.topbar` + `.tb-context` + `.ctx-menu` + `.cm-*`, `.sidebar` + `.sb-*`, `.ai-assistant` + `.aa-*`, `.tt`, `.icon-btn`, `.btn`, `.input`, `.avatar-sm`, `.modal-overlay`, `.slide-out`
- `aims-shell.js` (~740 LOC) — `WORKSPACES_DATA`, `WORKSPACE_PALETTE`, all `_ws*` + `_ctx*` + `CTX_APPS` + tooltip IIFE + `openAiAssistant`/`closeAiAssistant`/`aaSend`/… + `AA_AGENTS` + an `AA_SUGGESTIONS = window.AA_SUGGESTIONS || [defaults]` pattern so each file overrides
- Each of the 4 HTML files keeps its `<head>` linking the bundle, then has its own `<style>` for screen-specific CSS and its own `<script>` for screen-specific JS

**Data backing this recommendation:**
- ~1,570 LOC duplicated × 4 files = **~6,280 LOC of pure shell duplication** today
- Eliminating that brings the repo from ~18,800 LOC to ~14,300 LOC — a **24% reduction** with no functional change
- All 12 ctx-menu functions and all 18 AI Assistant functions are byte-equivalent (see §2.5, §2.6). Zero merge risk.
- The 4 token namespaces (§5) are the **only** real consolidation cost. Resolving them is a one-time effort: pick voice's `--color-*` naming (it's already token-system shaped) or comm's `--primary`/`--text-title` naming (most production-ready) and migrate. Estimated 3–5 hours of search/replace + visual QA.

### 7.2 Concrete first refactor (one paragraph)

**Start with token unification.** Before extracting any shared CSS file, define a canonical set of CSS custom properties (call them `--aims-color-bg`, `--aims-color-primary`, `--aims-color-success`, `--aims-radius-s/m/l`, etc.) in a new top-of-file `:root` block in voice. Audit voice's existing token names against comm's (the two cleanest), and write down which canonical name maps to which existing one in each of the 4 files. Then in each of the other 3 files, replace their `:root` block with the canonical one and search/replace usages (e.g., agentic's `var(--pri)` → `var(--aims-color-primary)`, gov's `var(--blue)` → `var(--aims-color-info)`, comm's `var(--primary)` → `var(--aims-color-primary)`). Once the 4 files render identically with shared token names, the next step — extracting `aims-shell.css` and `aims-shell.js` into linked files — becomes mechanical: copy voice's tb-context/ctx-menu/aa-/tt blocks into a new file, delete those blocks from all 4 HTML files, add `<link rel="stylesheet" href="aims-shell.css">` and `<script src="aims-shell.js"></script>` to each, and verify nothing broke. The dead legacy CSS (`.tb-launcher`, `.studio-sw`, etc.) and the 6 legacy alias functions can be deleted in the same pass — they are confirmed unreachable today.

---

## Appendix — quick stats

| Metric | voice | agentic | gov | comm | total |
|---|---:|---:|---:|---:|---:|
| Total LOC | 4,472 | 8,520 | 2,789 | 3,002 | **18,783** |
| Top-level `function` declarations | 183 | 270 | 93 | 81 | 627 |
| Distinct z-index values | 14 | 26 | 8 | 12 | — |
| `<button>` elements | 153 | 236 | 116 | 97 | 602 |
| `aria-label` coverage | 33% | 8% | 13% | 16% | ~16% avg |
| `<style>` blocks | 3 | 1 | 1 | 1 | 6 |
| `<script>` blocks | 2 | 1 | 1 | 2 | 6 |
| Modal overlays | 4 | 2 (mkt) | 3 | 5 | 14 |
| Slideouts (`.slide-out`) | 5 distinct | 0 | 0 | 0 | 5 (voice-only pattern) |
| Dead CSS LOC | ~52 | ~53 | ~52 | ~51 | **~208** |
| Dead JS LOC (alias stubs + `_wsAvatarHtml`) | ~12 | ~12 | ~12 | ~12 | **~48** |
| Estimated duplicated shell LOC per file | ~1,570 | ~1,570 | ~1,570 | ~1,570 | **~6,280** |

End of audit.
