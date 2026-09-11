# 05 - Technical replication

How to rebuild the prototype on another branch, and the design system rules you will run into.

---

## The two repositories

| Repo | What it is | Access |
|---|---|---|
| `cachilupis/aims-os-design-system` | **The design system.** The prototype's code lives here and Vercel deploys from here | Push controlled by CODEOWNERS |
| `thomzilla33/agentic-knowledge` | This repo. Documentation, GitHub Pages builds and the patches | Ours |

**Working branch:** `claude/ucp-vista-actualizada-431vm5` in `agentic-knowledge`.

---

## Recommended path: start from the code that is already deployed

The live prototype is **already on the design system's `main`**. To work on top of it:

```bash
git clone https://github.com/cachilupis/aims-os-design-system.git
cd aims-os-design-system
npm install
npm run dev          # open with ?proto=proto-thomas-ucp-contacts
```

This is the correct path. What follows is archaeology only.

## Alternative path: apply our patches

These are useful if someone wants to see **what we contributed** separately from what others added. They live in `ucp-ds-screens/` in this repo, generated against design system commit `9d8bea2`.

| Patch | Size | Files | Applies alone |
|---|---|---|---|
| `ucp-screens.patch` | 174,568 B | 8 | Yes - typechecks and builds |
| `experiment/experiment.patch` | 88,558 B | 5 | **No** - it stacks on the previous one, by design |
| `ucp-full.patch` | 259,808 B | 12 | Yes - both combined |

```bash
git checkout -b my-branch 9d8bea2
git apply ../Agentic-knowledge/ucp-ds-screens/ucp-full.patch
npx tsc --noEmit && npm run build
```

> **Warning:** these patches are against `9d8bea2`. Today's `main` is further ahead and contains its own version of these files. **They will conflict.** If what you want is to build, use the recommended path.

---

## Design system rules - the ones that break the build

They live in the design system repo's `CLAUDE.md`. These are the ones that cost time if you find them late.

### Colour
**No hex and no rgba in `.tsx` files.** Only `var(--token)`. There is an auditor that checks.

### Components
Only those in `ui/` and `layouts/` are used. Do not write new primitives.

### Screen structure
- Every screen is wrapped in `ScreenLayout`
- Pagination goes on `ScreenLayout`'s `pagination` prop, not loose
- `EntityList` goes inside `CardContainer size="sm" className="!p-0 overflow-hidden"`
- Overview-style tabs use `WidgetCanvasView`
- Every zero-result case carries `EmptyState`
- **Never `EmptyState` and `Pagination` together**

### Filters
Three layers: `Visible Filters` to `All Filters` to `Slideout`, plus chips for what is applied. What goes in the visible layer is decided by **frequency of use**, per `docs/FILTERS_SPEC.md`.

### The ratchet
```bash
node scripts/audit-tokens.cjs --counts   # counts violations by category
node scripts/audit-ratchet.cjs           # compares against origin/main
```
The ratchet **fails if any category goes up** relative to `main`. It also runs in `.husky/pre-push`, so a push with new violations is rejected locally.

Useful detail: orphan detection only walks `src/components`. A new module under `src/screens/` does not trigger it.

### CODEOWNERS
These paths need approval from `@cachilupis`:
```
/src/components/  /src/App.tsx  /src/index.css  /src/lib/  /tailwind.config.*  CLAUDE.md
```
`/src/screens/` **has no owner** - which is why all our work lives there.

---

## Files that matter

| File | What it does |
|---|---|
| `src/screens/viewerScopes.ts` | **The single owner of viewer permission.** `VIEWER_SCOPES` plus `hasScope()` plus `isMasked()`. Three different grains consume it: fields, rows and entity types. Duplicate it and the bug comes back where a price is visible on one surface and masked on another |
| `src/screens/ucpTypeModel.ts` | The per-type model: which widgets, which tabs, which facets each one publishes. `facetsForType()` is what makes the filters change with the type |
| `src/screens/ucpShared.ts` | Shared data and derivations. `getConnections()` derives from the contacts, not from fixed rows |
| `src/screens/pm-thomas-ucp-contacts.tsx` | The list |
| `src/screens/pm-thomas-ucp-profile.tsx` | The profile |
| `src/screens/pm-thomas-entity-workspace.tsx` | The unlimited-types experiment: dropdown with search plus a marketplace modal |

---

## Geometry that is expensive to rediscover

**`MenuItem`** - `size="sm"` gives `py-[8px] px-[8px] gap-[8px]`; `size="default"` gives `py-[8px] px-[16px] gap-[16px]`.
The `Menu` container is `w-[260px] max-h-[288px] overflow-y-auto rounded-[8px] py-[4px]`, **with no horizontal padding**.
Tokens: `--menu-bg`, `--menu-divider`, `--menu-item-text`.

> If you add your own row to a menu (a search field, say), copy that exact geometry. An input with its own border and padding ends up misaligned against the rows' icons - mine sat at 17px while the rows were at 8px.

**`useDropdownPosition`** measures in a layout effect. The anchor and the open flag have to change in the **same state commit**, or the flip calculation runs against an empty ref.

**`ModalDialog`** - `variant: "confirmation" | "content"`, props `slot` and `slotUnstyled`, `max-w-[900px]`.

---

## Capturing screenshots of the live prototype

The session proxy blocks a headless browser from reaching Vercel. The way around it:

```bash
mkdir shots && cd shots
curl -sO https://aims-os-design-system.vercel.app/          # save as index.html
mkdir assets && cd assets
curl -sO https://aims-os-design-system.vercel.app/assets/index-8tkXnTWw.css
curl -sO https://aims-os-design-system.vercel.app/assets/index-DECX7tIv.js
cd .. && python3 -m http.server 8137
```

Then point Playwright at `http://127.0.0.1:8137/?proto=proto-thomas-ucp-contacts`. The asset hashes change on each deploy; read them out of the fetched `index.html`.

Two things that cost time. The profile tabs at a 1440px viewport sit at y=241, with Overview at x=137, Activity at x=228, Intelligence at x=327 and Knowledge at x=438; `getByText('Knowledge')` fails because it is ambiguous with the KNOWLEDGE widget, so click by coordinate. And there is no PIL in this environment, so downscaling goes through a Playwright canvas with `toDataURL('image/jpeg', 0.86)`.

The seven captures are in `screenshots/` and every ticket links to the one that shows it.

---

## Publishing to GitHub Pages

The builds are single files with everything inlined (around 4 MB). They are generated from the design system and copied here:

```bash
npm run build                     # in the design system
cp dist/index.html ../Agentic-knowledge/ucp-contacts.html
```

`.nojekyll` is already at the repo root - do not delete it or Pages ignores the files.
