# UCP — vista actualizada (pantallas del Design System)

Dos pantallas de prototipo y dos componentes para **`cachilupis/aims-os-design-system`**,
compuestos con los componentes reales de `src/components/ui/` y construidos contra
el nodo de Figma del **Entity Header** (`19815-101547`).

Viven aquí porque esta sesión no tiene permiso de push sobre el repo del DS
(`add_repo` rechaza adjuntar repos de otro owner). El código ya está escrito,
tipado y verificado **dentro de un clon real del DS** — solo falta abrir el PR allá.

| Prototipo | `id` | Link una vez desplegado |
|---|---|---|
| UCP — Contacts | `proto-thomas-ucp-contacts` | `aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts` |
| UCP — Profile | `proto-thomas-ucp-profile` | `aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-profile` |

---

## Cómo aplicarlo en el repo del DS

```bash
cd ~/aims-os-ds                 # tu clon de cachilupis/aims-os-design-system
git checkout -b pm-thomas/ucp-vista-actualizada
git apply /ruta/a/ucp-ds-screens/ucp-screens.patch
npm run build                   # debe pasar con 0 errores
npm run dev                     # localhost:5173 → sidebar → Prototypes
```

El patch toca 6 archivos: 2 componentes en `experimental/`, 3 en `src/screens/`,
y **4 líneas** en `src/App.tsx` (2 imports + 2 entradas en `PROTOTYPE_PAGES`).
Ese archivo está protegido por CODEOWNERS, así que el PR necesita review de
**@cachilupis** — es el comportamiento esperado, no un bloqueo.

---

## El Entity Header

El header de la entidad es `src/components/experimental/entity-header.tsx`, no
`RecordHeader`. Va en `experimental/` con su comentario `// DS-GAP:` porque el
frame de Figma sigue marcado **WIP** y la regla del repo es que nada entra a
`ui/` sin que Michael lo promueva.

Es un componente distinto, no una variante de `RecordHeader`, por dos razones que
el spec deja explícitas:

- **Nada en la estructura es específico de una forma de registro.** El mismo
  esqueleto tiene que sostener un contacto, una orden de reparación y una tienda,
  así que la única bifurcación es avatar-vs-highlight-icon — y la decide si la
  entidad tiene identidad visual real (una cara o una marca), no su tipo.
  `RecordHeader` bifurca en `employee | customer | client`, que es justo lo que
  este spec evita.
- **El Next Best Action sale del header.** *"Under the header, never inside it…
  The header identifies the entity; the card proposes."* `RecordHeader` lo lleva
  dentro como Signal bar. Aquí es `next-best-action-card.tsx`, su propia Card.

### Las cuatro preguntas, en orden

El header responde cuatro cosas y no responde el *por qué* — eso es trabajo del
Overview:

| # | Pregunta | Slot |
|---|---|---|
| 1 | ¿Qué es esto? | visual + título |
| 2 | ¿Dónde se ubica? | source |
| 3 | ¿Cuál es su estado? | state badge |
| 4 | ¿Qué necesita atención? | tags |

### Reglas que quedaron implementadas, no solo leídas

- **No tiene contenedor propio.** El header nunca se coloca directo sobre la
  página y nunca se crea su propio fondo — *"a header with its own background
  inside a card produces a box within a box"*. Quien lo usa lo envuelve en
  `<CardContainer size="lg">`.
- **Source es un ítem, nunca dos.** Es el sistema del que se extrajo el registro
  — Salesforce, Workday, NetSuite. Un cargo, una ubicación, una región o una
  categoría **no** son source. Si la entidad nació en la plataforma, el slot se
  quita; no se rellena con otra cosa.
- **State badge: exactamente uno, gana el más bloqueante.** El resto de estados
  concurrentes bajan a tags. Por eso Kestrel muestra `Dormant` y no `Inactive`,
  y `Inactive` aparece como tag.
- **Los tags de la izquierda tienen dos colores, no once.** `error` si algo está
  roto o vencido, `alert` si necesita revisión, neutral todo lo demás. La prueba
  no es señal-vs-clasificación, es si alguien tiene que hacer algo al respecto.
  **La clasificación nunca lleva color** — eso es lo que deja que un tenant
  defina cien clasificaciones sin romper el sistema visual.
- **Metadata: máximo 6, apuntar a 4.** Siempre icono + texto, nunca icono solo, y
  cada ítem lleva tooltip que nombra el campo. Más de seis deja de ser una fila y
  se vuelve una sección — y eso va al Overview, no detrás de un chip `+N`.
- **La descripción está apagada por defecto.** Solo se enciende cuando el título
  es un código opaco (`RO-48291`). Ninguna de las 14 entidades del prototipo lo
  es, así que ninguna la lleva — que es exactamente lo que el spec predice.
- **Nada envuelve, nada se abrevia.** Título, tags, source y metadata truncan con
  elipsis y entregan el valor completo al tooltip. El título cede al final: los
  tags colapsan en `+N` antes de que el identificador pierda un carácter.
- **Las tres acciones no son tres botones.** `Ask` es el botón con gradiente que
  abre el Personal Assistant — habla, no ejecuta, y por eso no puede compartir la
  marca visual del Next Best Action, que sí pide una decisión. `(i)` abre el
  panel de procedencia de los campos en pantalla. El `⋮` es solo destructivas y
  secundarias, nunca un botón visible. Un panel lateral a la vez.

### El Next Best Action

`next-best-action-card.tsx`, `CardContainer variant="purple" size="lg"`, debajo
del header y a ancho completo.

- **Nunca apila.** El motor ya priorizó, unificó y descartó. Si hay más, un
  contador lleva a la lista.
- **Sin acción, sin card.** No es un empty state: no hay nada que decir cuando no
  hay nada que hacer. En el prototipo, Marcus Webb, David Park, Elena Fischer,
  Sarah Chen, Amy Chen y Grace Okafor no tienen card — y el tab queda pegado al
  header.
- **Siempre declara cuándo y por qué.** Timestamp más rationale; sin rationale es
  una orden, no una propuesta. El rationale va en una línea y trunca al tooltip.
- **Aceptar asigna al agente, no ejecuta.** El agente ejecuta, el humano
  gobierna. Nunca "Call now". La variante por defecto es solo `View details`;
  `Accept` está reservada y aquí se usa en dos registros para mostrarla.

---

## Decisiones de producto

| Decisión | Resultado |
|---|---|
| Dominio | Genérico AIMS OS — Person · Employee · Company, un solo perfil detrás de los tres |
| Overview | Tab dentro del UCP, y es un `WidgetCanvasView` porque la regla del DS lo exige |
| Layout del UCP | Híbrido: tabs fijos + canvas de widgets configurable en Overview |
| Navegación del listado | Tabs por tipo → `SwitchTab` tarjetas/tabla → `Filters` |
| Acción principal | Ninguna de creación. El registro llega por ingesta; el CTA es `Ask` |
| Documents | Reemplazado por **Drives** (Source Drives del catálogo de la compañía) |
| Snapshot | Nuevo tab: los hechos del registro por plano de conocimiento |

### Una desviación deliberada de CLAUDE.md

La regla genérica de página de detalle pide `Header` con título, tag de estado y
breadcrumb. Aquí el `Header` de página muestra **solo `← Contacts`**.

El spec del Entity Header hace que su propio título sea el sujeto de la página
(*"the title carries the profile heading level"*, *"Title scale — larger. It is
the page subject"*), y la vista de Figma para esta superficie muestra únicamente
la lista padre encima de la card. Repetir nombre y estado dos veces con 40px de
separación es precisamente lo que ese spec evita. Está comentado en el archivo.

### Snapshot = los planos de conocimiento

Del canon del repo (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`), no inventado:

| Plano | Confianza | Contenido |
|---|---|---|
| Truth | 100% | Hechos verificados. El agente los trata como verdad absoluta |
| Sandbox | ~80% | Claims no verificados y borradores. Probablemente ciertos, sin garantía |
| Sources | ~60% | Documentos crudos y material de referencia, para lookup y citación |

Cada hecho lleva plano, confianza, fuente y última verificación. Cuando el
concierge responde, etiqueta de qué plano salió cada parte.

---

## Estructura

```
ucp-ds-screens/
├── ucp-screens.patch                            # el diff completo, listo para git apply
├── src/
│   ├── components/experimental/
│   │   ├── entity-header.tsx                    # DS-GAP · Figma 19815-101547
│   │   └── next-best-action-card.tsx            # DS-GAP · misma frame
│   └── screens/
│       ├── ucpShared.ts                         # tipos + fixtures (14 entidades)
│       ├── pm-thomas-ucp-contacts.tsx           # listado + navegación al perfil
│       └── pm-thomas-ucp-profile.tsx            # UCP: header + NBA + 4 tabs + concierge
├── figma/                                       # el spec del que salió esto
│   ├── anatomy.png · variants.png
│   ├── nba-anatomy.png · view1.png
└── screenshots/                                 # cada vista y cada estado, 1440×1000
```

---

## Verificación corrida

- `npx tsc -b --noEmit` → 0 errores
- `npm run build` → limpio
- `npm run audit:tokens` → 0 hallazgos sobre estos 5 archivos (los 39 warnings de
  spacing que reporta son preexistentes de otras pantallas)
- `grep 'rgba\|#hex'` sobre los 5 archivos → 0 resultados
- Navegador en `localhost:5173`, 1440×1000, sin errores de consola: header con y
  sin NBA, variante `accept`, panel de Information, cada tab, cada panel, el
  empty state filtrado, y la paginación reseteando en cada cambio de tab /
  filtro / orden

---

## `// DS-GAP:` marcados

1. **`entity-header.tsx`** — el frame de Figma sigue WIP. Cuando Michael lo cierre
   y le dé nodo definitivo, esto se promueve a `ui/` con `/aims-ds-component`.
2. **`next-best-action-card.tsx`** — misma frame, misma condición.
3. **`agent chat panel`** (dentro de las dos pantallas) — no existe componente de
   chat en `src/components/ui/`; `record-header.tsx` lo dice en su propio
   encabezado. Compuesto con `SlideOut` + `Tag` + `Chip` + `Input` + `Button`.

---

## Preguntas abiertas para Design

- **Restricted con tags.** El texto del spec dice *"No signals — the tag group is
  removed, not left empty"*, pero la variante `Property 1=Restricted` en Figma
  muestra los tags a la derecha, atenuados. Implementé lo que dice el texto (se
  quitan). Si el mock es la intención, es un cambio de una línea.
- **NBA por debajo del mínimo.** El spec deja abierto qué hacer si el motor
  devuelve menos del mínimo de rationale ("Open question with Engineering").
  Aquí `rationale` es opcional y la card renderiza sin él antes que perderse.
- **Tab Logs.** La convención del DS lo pone al final de toda página de detalle.
  Los tabs elegidos fueron Overview · Snapshot · Activity · Drives; Activity ya
  cubre la traza con su paginación.
