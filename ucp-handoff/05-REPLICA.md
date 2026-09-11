# 05 · Réplica técnica

Cómo reconstruir el prototipo en otra rama, y las reglas del design system con las que vas a chocar.

---

## Los dos repos

| Repo | Qué es | Acceso |
|---|---|---|
| `cachilupis/aims-os-design-system` | **El design system.** Acá vive el código del prototipo y desde acá despliega Vercel | Push controlado por CODEOWNERS |
| `thomzilla33/agentic-knowledge` | Este repo. Documentación, builds de GitHub Pages y los patches | Nuestro |

**Rama de trabajo:** `claude/ucp-vista-actualizada-431vm5` en `agentic-knowledge`.

---

## Camino recomendado: partir del código que ya está desplegado

El prototipo vigente **ya está en `main` del design system**. Para trabajar sobre él:

```bash
git clone https://github.com/cachilupis/aims-os-design-system.git
cd aims-os-design-system
npm install
npm run dev          # abre con ?proto=proto-thomas-ucp-contacts
```

Este es el camino correcto. Lo de abajo es solo para arqueología.

## Camino alternativo: aplicar nuestros patches

Sirven si alguien quiere ver **qué aportamos nosotros** por separado de lo que agregó el resto. Están en `ucp-ds-screens/` de este repo, generados contra el commit `9d8bea2` del design system.

| Patch | Tamaño | Archivos | Aplica solo |
|---|---|---|---|
| `ucp-screens.patch` | 174 568 B | 8 | Sí — typecheckea y buildea |
| `experiment/experiment.patch` | 88 558 B | 5 | **No** — apila sobre el anterior, por diseño |
| `ucp-full.patch` | 259 808 B | 12 | Sí — los dos combinados |

```bash
git checkout -b mi-rama 9d8bea2
git apply ../Agentic-knowledge/ucp-ds-screens/ucp-full.patch
npx tsc --noEmit && npm run build
```

> **Advertencia:** estos patches están contra `9d8bea2`. El `main` actual está más adelante y contiene su propia versión de estos archivos. **Van a conflictuar.** Si lo que querés es construir, usá el camino recomendado.

---

## Reglas del design system — las que rompen el build

Están en el `CLAUDE.md` del repo del design system. Estas son las que cuestan tiempo si se descubren tarde:

### Color
**Cero hex y cero rgba en archivos `.tsx`.** Solo `var(--token)`. Hay un auditor que lo verifica.

### Componentes
Solo se usan los de `ui/` y `layouts/`. No se escriben primitivos nuevos.

### Estructura de pantalla
- Toda pantalla va envuelta en `ScreenLayout`
- La paginación va en la prop `pagination` de `ScreenLayout`, no suelta
- `EntityList` va dentro de `CardContainer size="sm" className="!p-0 overflow-hidden"`
- Las pestañas tipo Overview usan `WidgetCanvasView`
- Todo resultado cero lleva `EmptyState`
- **Nunca `EmptyState` y `Pagination` juntos**

### Filtros
Tres capas: `Visible Filters → All Filters → Slideout`, más chips de lo aplicado. Qué va en la capa visible se decide por **frecuencia de uso**, según `docs/FILTERS_SPEC.md`.

### El ratchet
```bash
node scripts/audit-tokens.cjs --counts   # cuenta violaciones por categoría
node scripts/audit-ratchet.cjs           # compara contra origin/main
```
El ratchet **falla si alguna categoría sube** respecto de `main`. Corre también en `.husky/pre-push`, así que un push con violaciones nuevas se rechaza localmente.

Dato útil: la detección de huérfanos solo recorre `src/components`. Un módulo nuevo bajo `src/screens/` no la dispara.

### CODEOWNERS
Estas rutas necesitan aprobación de `@cachilupis`:
```
/src/components/  /src/App.tsx  /src/index.css  /src/lib/  /tailwind.config.*  CLAUDE.md
```
`/src/screens/` **no tiene owner** — por eso todo nuestro trabajo vive ahí.

---

## Archivos que importan

| Archivo | Qué hace |
|---|---|
| `src/screens/viewerScopes.ts` | **Único dueño del permiso del viewer.** `VIEWER_SCOPES` + `hasScope()` + `isMasked()`. Tres granos distintos lo consumen: campos, filas y tipos de entidad. Si lo duplicás, vuelve el bug del precio visible en un lado y enmascarado en el otro |
| `src/screens/ucpTypeModel.ts` | El modelo por tipo: qué widgets, qué pestañas, qué facetas publica cada uno. `facetsForType()` es lo que hace que los filtros cambien según el tipo |
| `src/screens/ucpShared.ts` | Datos compartidos y derivaciones. `getConnections()` deriva de los contactos, no de filas fijas |
| `src/screens/pm-thomas-ucp-contacts.tsx` | El roster |
| `src/screens/pm-thomas-ucp-profile.tsx` | El perfil |
| `src/screens/pm-thomas-entity-workspace.tsx` | El experimento de tipos ilimitados: dropdown con buscador + modal marketplace |

---

## Geometría que cuesta redescubrir

**`MenuItem`** — `size="sm"` → `py-[8px] px-[8px] gap-[8px]` · `size="default"` → `py-[8px] px-[16px] gap-[16px]`.
El contenedor `Menu` es `w-[260px] max-h-[288px] overflow-y-auto rounded-[8px] py-[4px]`, **sin padding horizontal**.
Tokens: `--menu-bg`, `--menu-divider`, `--menu-item-text`.

> Si le agregás una fila propia a un menú (un buscador, por ejemplo), copiá esa geometría exacta. Un input con su propio borde y padding queda desalineado contra los iconos de las filas — el mío quedó a 17px cuando las filas estaban a 8px.

**`useDropdownPosition`** mide en un *layout effect*. El ancla y el flag de abierto tienen que cambiar en el **mismo commit de estado**, o el cálculo de volteo corre contra una ref vacía.

**`ModalDialog`** — `variant: "confirmation" | "content"`, props `slot` y `slotUnstyled`, `max-w-[900px]`.

---

## Publicar en GitHub Pages

Los builds son archivos únicos con todo inlineado (~4 MB). Se generan desde el design system y se copian acá:

```bash
npm run build                     # en el design system
cp dist/index.html ../Agentic-knowledge/ucp-contacts.html
```

`.nojekyll` ya está en la raíz del repo — no lo borres o Pages ignora los archivos.
