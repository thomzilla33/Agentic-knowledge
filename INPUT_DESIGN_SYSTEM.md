# Input Design System

> **Core principle (per architect's feedback):** Build a design system of **inputs**, not of nodes. Every node type composes from the same small catalog of input renderers. Adding a new node type = picking which fields it shows. Adding a new field key = appending to `FIELD_DEFS`. Adding a new input type = writing one renderer in `FIELD_RENDERERS`.

This document is the **contract** between the data model and the UI for any node configuration in Agentic Studio.

---

## The 3-layer model

```
┌─────────────────────────────────────────────────────────────────┐
│ NODE_TYPE_CONFIG[node.t]                                        │
│   { avatar, color, label, sections, modalTabs }                 │
│   • sections.{input,config,output,advanced} = field keys[]      │
│   • modalTabs = ordered tab names for the full Configure modal  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ references by key
┌─────────────────────────────────────────────────────────────────┐
│ FIELD_DEFS[fieldKey]                                            │
│   { label, type, options?, min?, max?, step?, required?,        │
│     placeholder?, help? }                                       │
│   • type ∈ { text, textarea, number, slider, toggle, select,    │
│              multi-select, code, json, chips, url, kv, date,    │
│              datetime }                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ dispatched by type
┌─────────────────────────────────────────────────────────────────┐
│ FIELD_RENDERERS[type]   (node, key, def) → HTML                 │
│   • Reads value via getNodeFieldValue(node, key)                │
│   • Writes via setNodeFieldValue(nodeId, key, value)            │
│   • Renders required validation, help text, oninput auto-save   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Input types catalog (14)

Every input below renders inside a `.ins-fld` wrapper with label + optional help. Auto-saves to `node.config[key]` on every change.

| Type | Use for | Notes |
|---|---|---|
| **`text`** | Single-line strings, identifiers, expressions, dotted paths | Required + invalid state supported |
| **`textarea`** | Multi-line prompts, descriptions, long instructions | 4 rows default, resizable vertically |
| **`number`** | Counts, milliseconds, hours, ports | `min` / `max` / `step` clamp |
| **`slider`** | Bounded continuous values (temperature, top-K, similarity) | Live numeric readout next to track |
| **`toggle`** | Boolean flags (rerank, persist audit, validate output) | Pill switch, keyboard-activatable |
| **`select`** | Pick one from a known small set | `options: [{v,l}]` |
| **`multi-select`** | Pick N from a known small set | Renders as checkboxes |
| **`code`** | One-line expressions, JSON paths, monospace | `font-family: ui-monospace` |
| **`json`** | Read-only structured preview | Pretty-printed, syntax-highlighted |
| **`chips`** | Pick N from a small known set (visual variant of multi-select) | Toggleable rounded pills |
| **`url`** | URLs with validation hint | `type="url"`, placeholder `https://…` |
| **`kv`** | Key→value mapping (input/output state mapping) | Add/remove rows |
| **`date`** ⭐ NEW (A3.8) | A calendar date (`YYYY-MM-DD`) | Native `<input type="date">` with dark-theme styling |
| **`datetime`** ⭐ NEW (A3.8) | A wall-clock instant (`YYYY-MM-DDTHH:mm`) | Native `<input type="datetime-local">` |

### Field def schema

```js
const FIELD_DEFS = {
  fieldKey: {
    label:       'Display label',         // required
    type:        'text' | 'textarea' | …, // required
    options:     [{v: 'value', l: 'Label'}],  // for select / multi-select / chips
    min:         0,                       // for number / slider / date
    max:         100,                     // for number / slider / date
    step:        1,                       // for number / slider
    required:    true,                    // optional — surfaces * + red border when empty
    placeholder: 'hint…',                 // optional
    help:        'small grey text under the input',  // optional
  },
};
```

---

## Currently-defined fields (35 total)

Grouped by the node type they belong to. A field defined here can be added to ANY node's section list — the system is composable.

### Trigger
- `triggerType` (select, required) — Webhook / Schedule / Manual / API
- `endpoint` (text) — URL, cron expression, topic name
- `auth` (select) — None / HMAC SHA256 / Bearer / OAuth 2.0
- `rateLimit` (number) — Requests per minute
- `timeoutMs` (number) — Request timeout in ms
- `scheduleStart` (date) — Workflow stays inactive until this date
- `scheduleEnd` (date) — Workflow auto-suspends after this date

### Agent
- `mapFromState` (select) — Which state key feeds this agent
- `systemPrompt` (textarea) — System prompt override
- `model` (select) — Model selector

### RAG (Knowledge)
- `query` (text, required) — Query mapping
- `packs` (multi-select) — Knowledge Packs
- `drives` (multi-select) — Source Drives
- `topK` (slider) — Top-K results
- `rerank` (toggle) — Re-rank results
- `minSimilarity` (slider) — Min similarity threshold

### Workflow
- `workflowRef` (select, required) — Sub-workflow to invoke
- `errorHandling` (select) — Retry / Fallback / Fail fast
- `inputMapping` (kv) — Map state → workflow input
- `outputMapping` (kv) — Map workflow output → state

### Condition
- `expression` (code, required) — Condition expression
- `branches` (chips) — Branch labels
- `defaultBranch` (select) — Default branch

### Action
- `actionType` (select, required) — HTTP / Transform / Store
- `idempotencyKey` (text) — Idempotency key

### Wait
- `waitType` (select, required) — Human / Event / Duration
- `resumeOn` (text) — Resume condition expression
- `timeoutHours` (number) — Timeout in hours
- `escalateTo` (text) — Escalation email
- `resumeAtTime` (datetime) — Exact wall-clock time to resume

### Output
- `outputSchema` (select) — JSON / Text / Custom schema
- `notifications` (multi-select) — Slack / Email / Webhook
- `persistAuditTrail` (toggle) — Persist audit trail
- `webhookCallback` (url) — Webhook callback URL
- `retentionUntil` (date) — Retain audit trail until

---

## Per-node section layouts

Each node type declares which fields appear in each section. The Inspector renders sections collapsible, with Configuration open by default.

```js
const NODE_TYPE_CONFIG = {
  trigger: {
    avatar: '⚡', color: 'var(--warn)', label: 'Trigger',
    sections: {
      input:    [],
      config:   ['triggerType','endpoint','auth','rateLimit','timeoutMs'],
      output:   [],
      advanced: ['scheduleStart','scheduleEnd'],
    },
    modalTabs: ['Source','Authentication','Schema','Rate limits','Logs','Testing'],
  },
  // … 7 more node types
};
```

---

## How to add a new field type

1. Add a renderer to `FIELD_RENDERERS` in `agentic-studio.html`:
   ```js
   FIELD_RENDERERS.myType = function(node, key, def) {
     const v = getNodeFieldValue(node, key) ?? '';
     return `<div class="ins-fld" data-fld="${key}">
       <div class="ins-fld-lbl">${_ie(def.label)}</div>
       <input class="ins-fld-input" value="${_iea(v)}"
         oninput="setNodeFieldValue('${node.id}','${key}', this.value)" />
     </div>`;
   };
   ```
2. Add styles if needed under `.ins-fld-*` in the CSS block.
3. Reference your type in `FIELD_DEFS[newKey] = { ..., type: 'myType' }`.
4. Add the key to a node type's section in `NODE_TYPE_CONFIG`.

That's it. The Inspector picks it up automatically.

---

## How to add a new node type

1. Pick a `t` identifier (e.g. `'webhook-event'`).
2. Add an entry to `NODE_TYPE_CONFIG`:
   ```js
   'webhook-event': {
     avatar: '🪝',
     color: 'var(--cyan)',
     label: 'Webhook Event',
     sections: { input: ['…'], config: ['…'], output: ['…'] },
     modalTabs: ['Source','Auth','Testing'],
   }
   ```
3. Add any new field keys to `FIELD_DEFS`.
4. Done. The node type works in the Inspector + Modal automatically.

---

## Anti-patterns (when NOT to use a generic input)

The architect's principle "design system of INPUTS, not of nodes" has a critical refinement: **rich composed surfaces are first-class components, not collections of basic inputs**. Shoehorning these into `multi-select` would sacrifice UX that differentiates us from n8n/Zapier.

| Surface | Why generic input fails | What it is instead |
|---|---|---|
| **Knowledge Picker** (RAG `packs` + `drives` + reference files) | Needs 3 source tabs, drag-drop of files, attestation status, blast-radius badges, scoping rule explainer | A dedicated modal component (`enterNodeKnowledgePicker`) reached via "Manage knowledge" |
| **Tool selector** (agent tools) | Needs MCP server health status, connection state, scope settings per tool, per-node copy-on-write override | Tab in the Agent Modal (`tabTools`) |
| **Audit trail drill-down** | Email → claim → doc → SME chain. Federal-audit ROI story (Mike's pitch). | Dedicated `runDetailOv` slide-out + the Execution Trace panel |
| **Execution Trace step detail** | 4 tabs (Overview/Input/Output/Config), JSON with syntax highlighting, copy buttons per block | `tm-step-det` with tabs and `jsonPretty()` |
| **Per-node override management** | Tools + prompt suffix copy-on-write + reset buttons + "Modified for this node" pills | Built into `tabBehavior` / `tabTools` with `nodeOverrideField()` |

**Rule of thumb:** if the surface has its own data layer (Packs catalog), its own state lifecycle (attestation), or its own visual story (federal audit), it gets its own component. Generic inputs are for plain values.

---

## Reference paths

| Concept | Location in `agentic-studio.html` |
|---|---|
| `NODE_TYPE_CONFIG` | ~line 8188 |
| `FIELD_DEFS` | ~line 8215 |
| `FIELD_RENDERERS` | ~line 8273 |
| `getNodeFieldValue` / `setNodeFieldValue` | search "function getNodeFieldValue" |
| `renderNodeInspector` | dispatcher that builds the Inspector body per node type |
| `openNodeConfigModal` | dispatcher that opens the full Configure modal per type |
| Inspector CSS | `.ins-fld-*` rules around line 1029 |
| Modal CSS | `.agt-mod-*` rules in the modal block |

---

## Validation against architect's feedback

| Architect's recommendation | Status |
|---|---|
| "Usar tabs + secciones colapsables" | ✅ `Input` / `Configuration` / `Output` / `Advanced` collapsible sections (A3.2) + 6–8 sidebar tabs per modal (A3.3) |
| "Inputs complejos → abrir en modal" | ✅ Knowledge Picker, full Agent editor, Execution Trace tabs, type-specific Configure modals all open in dedicated modals |
| "Crear design system de INPUTS, no de nodos" | ✅ Exactly this document. `FIELD_RENDERERS` + `FIELD_DEFS` + `NODE_TYPE_CONFIG` is the composition pattern |
| "Priorizar: text, textarea, dropdown, multiselect, fechas, toggles" | ✅ All 6 shipped (`text`, `textarea`, `select`, `multi-select`, `date`/`datetime`, `toggle`) |

---

## Next steps (post-Wednesday demo)

- **Provider-grouped Node Library** for when we cross ~30 tools (Salesforce, Slack, HubSpot, etc.). Today's Native/Workflows/Agents flat list scales to ~50; beyond that we need nested groups.
- **Favorites / Recents** at the top of the Node Library — once we have 20+ user-facing items.
- **Field interdependency** (`if X then show Y`) — currently fields are independent. Some surfaces (`workflowRef` → input/output mapping schema) would benefit.
- **Date range picker** — composing `date + date` as a single field type with a range UI.
- **Schema editor** for `outputSchema = custom` — out of scope for v1; treat as future Vendor work.
