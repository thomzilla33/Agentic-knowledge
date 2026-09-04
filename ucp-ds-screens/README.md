# UCP — vista actualizada (pantallas del Design System)

Dos pantallas de prototipo y dos componentes para **`cachilupis/aims-os-design-system`**,
compuestos con los componentes reales de `src/components/ui/` y construidos contra
el nodo de Figma del **Entity Header** (`19815-101547`).

Viven aquí porque esta sesión no tiene permiso de push sobre el repo del DS
(`add_repo` rechaza adjuntar repos de otro owner). El código ya está escrito,
tipado y verificado **dentro de un clon real del DS** — solo falta abrir el PR allá.

**Una sola card** en la galería de prototipos, y el flujo completo detrás:

| Card | `id` | Link una vez desplegado |
|---|---|---|
| UCP - Contacts Last version | `proto-thomas-ucp-contacts` | `aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts` |

El perfil no tiene card propia: se llega abriendo una fila del roster, que es el
flujo real. Un solo punto de entrada, y `pm-thomas-ucp-profile.tsx` a propósito
no exporta un default — exporta `UcpProfileView`, que el roster monta.

---

## Cómo aplicarlo en el repo del DS

```bash
cd ~/aims-os-ds                 # tu clon de cachilupis/aims-os-design-system
git checkout -b pm-thomas/ucp-vista-actualizada
git apply /ruta/a/ucp-ds-screens/ucp-screens.patch
npm run build                   # debe pasar con 0 errores
npm run dev                     # localhost:5173 → sidebar → Prototypes
```

El patch toca 7 archivos: 2 componentes nuevos en `experimental/`, 3 en
`src/screens/`, **2 líneas** en `src/App.tsx` (1 import + 1 entrada en
`PROTOTYPE_PAGES`), y **borra** `src/screens/pm-thomas-universal-profile.tsx`.
`App.tsx` está protegido por CODEOWNERS, así que el PR necesita review de
**@cachilupis** — es el comportamiento esperado, no un bloqueo.

### Se retira el prototipo Universal Profile

`pm-thomas-universal-profile.tsx` y su card salen del repo: este trabajo lo
reemplaza, y era la card vieja del mismo concepto. El archivo se borra en vez de
quedar sin registrar porque el `audit-tokens.cjs` cuenta huérfanos sobre
`src/screens/**` y su ratchet de CI falla el PR si cualquier categoría sube —
dejarlo habría llevado `orphan` de 0 a 1. Contadores antes y después del cambio:
`errors=0 orphan=0 shadow=0 main_overuse=0 card_reimpl=0`.

Qué se pierde y qué no: el screen viejo no aportaba nada que el nuevo no tenga,
y varias cosas que ya violaban las reglas vigentes — la lista hecha con
`CardContainer` + divs a mano en vez de `EntityList`, sin `Filters`, sin
`Pagination`, sin `EmptyState`, y `RecordHeader` donde ahora va el Entity
Header. Su historial queda en git si alguien lo necesita.

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
- **El chrome del registro queda pineado al hacer scroll** — header, Next Best
  Action y tabs — en la zona de header de `ScreenLayout`, que está fuera del
  contenedor con scroll. Al bajar, el header colapsa al **estado Minimum** que
  el propio spec define: *"Only visual, title and state. No description, no
  tags, no metadata. The header stays valid."* Más la fila de acciones, que es
  fija y nunca se comprime.

  **El orden dentro del bloque pineado es el del spec, no una preferencia.** La
  card del Next Best Action tiene que ir directamente debajo del header y nunca
  bajo una capa de navegación: renderizada debajo de los tabs se lee como si
  perteneciera al tab activo en vez de al registro. Por eso pinear los tabs
  obligó a pinear la card por encima de ellos.

  **Y la card se aparta al hacer scroll.** Medido en navegador a 1440×1000: con
  los tres elementos fijos el bloque ocupaba 429px al descansar y solo bajaba a
  389 al hacer scroll, porque el colapso Minimum encoge el header pero la card
  seguía a tamaño completo. Eso es exactamente lo que la regla 2 de la propia
  card objeta — *"stacked cards push the real content below the fold"* — solo que
  de forma permanente. La card ahora sale del bloque pineado al hacer scroll:
  429 → **221px**, el mismo valor que un registro sin recomendación. Al
  descansar mantiene su posición correcta debajo del header, y vuelve al subir.
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

## Los estados del header

El component set de Figma es `Property 1 = Default | Loading | Restricted` ×
`Size = Default | Responsive`, más los cinco estados que el componente declara
como propios. Estaban todos implementados en `entity-header.tsx`, pero el
prototipo solo renderizaba dos de ellos — Default y Minimum. Un estado que
existe en el archivo y no se ve corriendo no está revisado: nadie puede aprobar
lo que no se puede abrir. Los tres que faltaban ahora se llegan navegando.

### Restricted — una regla de entitlement, no un flag

Restricted lo decide **lo que tiene el viewer contra lo que pide el registro**,
nunca una propiedad del registro. En `ucpShared.ts`:

```ts
export const VIEWER_SCOPES: readonly string[] = ["contacts.read", "hr.read", "drives.read"]

export function restrictionFor(c: UcpContact): { scope: string; note: string } | null
```

Thomas es PM: lee contactos y RRHH, y **no** lee finanzas. Esa omisión es el
punto — es lo que hace el estado alcanzable desde una regla real. El único
registro con scope es **Amy Chen**, la CFO de Meridian: `requiredScope:
"finance.read"`. El mismo registro se renderiza completo para alguien que sí
tenga el scope; no hay nada especial en la fila.

Lo que cambia, y por qué:

- **El header baja a identidad + estado.** Se retira el grupo de tags y la
  metadata; sobreviven visual, título, source y state badge. `(i)`, `Ask` y `⋮`
  quedan deshabilitados: los tres leen valores.
- **El título va a fuerza completa, no atenuado.** Esto lo cambié: antes iba en
  `--field-supporting`. Restricted gobierna los **valores** de la entidad, no su
  identidad — el nombre ya está visible en el listado del que vino el viewer, y
  atenuarlo dice que el nombre mismo es incierto. Las prioridades 1 a 3 no se
  bajan **ni se debilitan**.
- **El cuerpo sigue al header.** Los tabs quedan montados y siguen cambiando —
  son parte de la forma del registro, y esconderlos falsearía lo que el tenant
  tiene. Pero el contenido se reemplaza por un `EmptyState` que nombra el scope.
  Dejar los hechos, el timeline y los drives en pantalla bajo un header que dice
  *"estos valores están gobernados"* sería la página contradiciendo al header.
- **El panel de Preview del listado tiene la misma puerta.** Imprimía el read del
  agente, el email y los conteos de hechos. Un preview que filtra lo que el
  perfil protege deja la restricción como decoración — el panel es la puerta más
  fácil, así que tiene que ser la misma puerta. Sobrevive lo de nivel directorio:
  Record ID, Owner, Source.
- **La fila del listado lo marca.** Un ítem `🔒 Restricted` en la metadata
  superior, con el scope en el tooltip. Enterarse de que un registro está
  gobernado **después** de abrirlo es la versión de esto que desperdicia un clic.

El texto no culpa al viewer ni sugiere que el registro esté roto: *"The record
exists and is intact — request the scope to read it."* Es un estado, no un fallo.

### Loading — el primer paint de un fetch

El registro se busca, así que existe un instante en el que no está. El skeleton
del header es lo que va ahí, con la disposición que le corresponde a su `size`.
Se re-arma por `contact.id`: navegar de un contacto a otro es un fetch nuevo, no
un re-render del anterior.

Y el cuerpo acompaña. Un `LoadingBody` de skeletons reemplaza el contenido del
tab, porque una pantalla que dice "cargando" en un lugar y muestra valores
terminados en otro está afirmando dos cosas distintas del mismo registro. No es
un `EmptyState`: *"nothing here"* es falso mientras el dato viene en camino.

La card del Next Best Action tampoco aparece mientras carga — es una propuesta
derivada de valores que todavía no llegaron.

### Responsive — el breakpoint es el de la card, no el del viewport

El spec es explícito: *"the breakpoint it responds to is the card's, not the
viewport's"*, y es la razón por la que `size` es una prop y no un media query —
un header dentro de un panel lateral de 640px en un monitor de 1920 tiene que
reflowear, y un media query nunca dispararía.

Así que se mide la card, con `ResizeObserver`, siguiendo el patrón que el propio
DS ya usa en `adaptive-metric-grid.tsx`. Umbral: **760px** de ancho de card, que
es donde la fila única deja de caber.

**REFLOW = stack before you shrink.** Medido en navegador:

| Viewport | Ancho de card | Estado | Resultado |
|---|---|---|---|
| 1440 | ~1100px | `default` | Fila única, tags colapsados a `+1` |
| 1024 | ~912px | `default` | Fila única, `+1`, título entero |
| 820 | ~708px | `responsive` | Fila 1 identidad + acciones · fila 2 source + los 3 tags · fila 3 metadata |

El título no se encoge para salvar la fila: los tags colapsan en `+N` primero, y
cuando eso ya no alcanza, source y tags se van a su propia fila. Y `responsive` +
`minimum` vuelve a una sola fila — un minimum apilado serían tres filas de nada.

---

## Decisiones de producto

| Decisión | Resultado |
|---|---|
| Dominio | Genérico AIMS OS — Customer · Employee · Company, un solo perfil detrás de los tres |
| Overview | Tab dentro del UCP, y es un `WidgetCanvasView` porque la regla del DS lo exige |
| Layout del UCP | Híbrido: tabs fijos + canvas de widgets configurable en Overview |
| Navegación del listado | Tabs por tipo → `Filters`. Solo tarjetas en esta versión |
| Acción principal | `Create New {tipo}` como `primary`, siguiendo la pestaña activa; `Ask` baja a secondary |
| Documents | Reemplazado por **Drives** (Source Drives del catálogo de la compañía) |
| Snapshot | Nuevo tab: los hechos del registro por plano de conocimiento |

### Qué muestra la fila del listado

**Fila superior — contexto e identificador.** El `source` y el ID del registro.
El spec mantiene el source siempre visible como el ítem de contexto, un ítem y
nunca dos: los valores cubren cinco industrias y seis sistemas — Salesforce
(servicios financieros), Epic (salud), NetSuite (industrial), HubSpot (un piloto
que entró por marketing), CDK Global (automotriz) y Workday (los empleados).

**El source es consistente dentro de una cuenta.** Los contactos de Meridian
comparten Salesforce porque salen del mismo sistema; inventar variedad dentro de
una sola cuenta sería mentir sobre la procedencia, que es justo lo que ese slot
existe para declarar. La variedad va entre cuentas, donde existe de verdad.

Para que el DMS fuera honesto y no decorativo hubo que agregar una cuenta
automotriz: **Riverbend Auto Group** y su director de fixed operations, ambos
desde CDK Global. Ninguno de los 14 registros anteriores era automotriz, y
colgarle un DMS a una empresa de logística habría sido falso. El roster pasa a
16.

**Fila inferior — metadata secundaria, cuatro ítems, solo valores.** Sin
etiquetas de campo en la fila: el tooltip es lo que nombra el campo, que es
exactamente la regla del spec (*"Icon — what kind of information this is · Text —
the value · Tooltip — the field label + context"*).

| Ítem | Ejemplo | Por qué está |
|---|---|---|
| Rol · Compañía | `VP of Operations · Meridian Corp` | El spec lo pone aquí explícitamente: un cargo y una compañía madre están bajo **NOT A SOURCE** — *"they belong in tags or in secondary metadata"* |
| Owner | `Priya Nair` | Solo el nombre. Para un customer, la persona a quien preguntar. El tooltip nombra el campo y agrega la última interacción |
| Hechos verificados | `5 verified` | Cuánto del registro está atestiguado — gobernanza lo requiere visible |
| Agente asignado | `Deal Concierge` | El spec lo nombra como metadata que califica, y AIMS OS es agent-first: todo registro tiene uno |

**Por qué no va un conteo de ítems abiertos**, que sería mejor que el agente en
ese cuarto lugar: solo está modelado en 7 de los 16 registros, y para los otros 9
imprimir "None open" sería falso en varios — Halden tiene dos checks de seguridad
abiertos, Riverbend tiene 41 órdenes de reparación vencidas. Ese número necesita
un campo real en el modelo antes de poder ir en la fila.

### La fila lleva el Next Best Action, no el resumen del agente

El bloque púrpura de la fila decía "AI read" y mostraba el titular del agente.
Ahora dice **Next Best Action** y lleva la recomendación del registro: título,
cuándo, y por qué. Sin el rationale sería una orden, no una propuesta — misma
regla que la card del perfil.

**El nombre exacto costó un rodeo.** `EntityList` renderiza la etiqueta como
`AI {action}` — el `AI ` está hardcodeado en `entity-list.tsx:426` — así que
pasar "Next Best Action" imprimía **"AI Next Best Action"**. El Next Best Action
es un concepto de producto con nombre propio, no una categoría de output de IA,
y tiene que leerse en la fila igual que en la card. Así que la etiqueta va
apagada (`showLabel: false`) y el nombre encabeza la primera línea. `action`
queda pasado igual, para cuando `entity-list.tsx` deje de prefijar y la etiqueta
con estilo pueda volver: es un carácter en un archivo bajo `CODEOWNERS`.

Y el `detail` pasó a ser un array en vez de una sola cadena corrida. La primera
línea es para lo que existe la fila — el nombre, la propuesta y el cuándo — y el
rationale se vuelve su propio bullet al expandir, que es donde el lector va a
decidir. Las diez recomendaciones traen uno, así que el bloque siempre tiene algo
en qué expandirse.

Un roster se escanea para decidir qué abrir a continuación, y la recomendación es
lo que responde eso. El resumen del agente no se perdió: sigue en el widget del
Overview y en el preview del ojo, donde hay espacio para él.

El bloque usa la misma familia púrpura que la card del Next Best Action en el
perfil, así que la fila y la card hablan el mismo idioma. Colapsa pasando los 80
caracteres y **View more** abre el registro, que es la ruta por defecto de la
propia card (*"the safe path is always the one that opens the record"*).

**El caso borde: sin acción, sin bloque.** Diez de los dieciséis registros
tienen una recomendación; los otros seis no llevan bloque en absoluto. Es la
regla 3 de la card aplicada a la fila — *"No Next Best Action, no card. The
container does not render. This is not an empty state: there is nothing to say
when there is nothing to do."*

La ausencia es la señal, y en un listado eso funciona mejor que un texto: se
escanea buscando púrpura para encontrar los registros que quieren una decisión.
Grace Okafor, Sarah Chen, David Park, Amy Chen, Marcus Webb y Elena Fischer son
las filas tranquilas.

### Fuera el SwitchTab de tarjetas/tabla

No va en esta versión. Se fue el `SwitchTab`, la vista de tabla y sus columnas.
Las tarjetas son el único layout, que además es el default del DS: *"The
SwitchTab component is not shown by default."*

### El tag de `person` dice Customer

`TYPE_LABEL.person` pasa de "Person" a **"Customer"**: estos registros son
contactos en cuentas de cliente y prospecto, y "Person" decía qué era la fila en
vez de qué es el registro. El discriminador interno sigue siendo `person` para
que el union de tipos no cambie.

Eso arrastró dos cosas por coherencia, y son las que conviene que revises: el tab
**"People" pasó a "Customers"** y el CTA a **"Create New Customer"**. Si preferías
que solo cambiara el tag y el tab siguiera diciendo People, son dos líneas.

### El CTA de creación nombra lo que va a crear

El botón principal del listado sigue la pestaña activa: **Create New Contact**
en All, y **Create New Customer / Employee / Company** en cada tipo. Un "Create"
genérico sobre un roster de tres tipos no dice qué va a construir, y el tipo ya
está decidido por la pestaña en la que estás.

Abre un `SlideOut` — un formulario de creación no es destructivo ni bloqueante,
así que no es `ModalDialog`. Seis campos por tipo, sin prop `label` en los
`Input` (en desktop el placeholder es la única pista de campo). En la pestaña
All el panel pide el tipo con Chips; en las otras el tipo viene fijo y el picker
no se renderiza.

**Un detalle que sale del spec del Entity Header:** un registro creado aquí
**no tiene source**. Source es el sistema del que se extrajo un registro, y el
spec dice que si la entidad nació en la plataforma el slot se quita en vez de
rellenarse. El panel lo dice explícitamente: sus hechos arrancan en el plano
Sandbox y se promueven al verificarse.

Dos notas sobre las decisiones que tomé aquí:

- **Usa `variant="primary"`, no `main`.** `main` es el gradiente que el spec del
  Entity Header reserva para `Ask` — el Personal Assistant, que *habla y no
  ejecuta*. Un botón de creación ejecuta, así que ponerle esa marca es la
  confusión exacta que el spec previene. La contra: `CLAUDE.md` dice que el CTA
  del `Header` va en `main`. Si prefieres seguir esa regla, es un prop.
- **`Ask` no desapareció, bajó a `secondaryAction`.** Quitar del todo el punto
  de entrada del asistente de una superficie es un cambio de producto más grande
  que cambiar una etiqueta, y el `Header` tiene el slot. Si lo quieres fuera,
  se borra.

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
│       ├── ucpShared.ts                         # tipos + fixtures (16 entidades) + entitlements
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
- `node scripts/audit-tokens.cjs --counts` → `errors=0 orphan=0 shadow=0
  main_overuse=0 card_reimpl=0`, igual que la base (los 39 warnings de spacing
  que reporta son preexistentes de otras pantallas). El ratchet de CI falla si
  alguna categoría sube; ninguna sube.
- `grep 'rgba\|#hex'` sobre los 5 archivos → 0 resultados
- Navegador en `localhost:5173`, 1440×1000, sin errores de consola: header con y
  sin NBA, variante `accept`, panel de Information, cada tab, cada panel, el
  empty state filtrado, y la paginación reseteando en cada cambio de tab /
  filtro / orden
- **Los estados, corriendo** (`screenshots/E*.png`): Loading en el primer paint
  (`E0`), Restricted en el perfil y cambiando de tab (`E1`, `E2`), la fila del
  listado marcándolo (`E3`), el Preview gobernado contra el normal (`E4`, `E5`),
  el reflow responsive a 820 y su Minimum (`E6`, `E7`), la fila única a 1024
  (`E8`), y Restricted a través del bundle compilado, no solo del dev server
  (`E9`)
- Verificado por asserts, no solo por captura: el Preview restringido no imprime
  el email ni el read del agente (`0` coincidencias de cada uno), `Ask` reporta
  `disabled=true`, y el Preview sin restricción sigue mostrando ambos

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
- **Restricted y el título atenuado.** Relacionado: el mock atenúa el bloque de
  identidad completo. Dejé el título a fuerza completa por el argumento de arriba
  (Restricted gobierna valores, no identidad, y las prioridades 1–3 no se
  debilitan). Si Design quiere el título atenuado, es la línea `color` de
  `Title`.
- **El `AI ` hardcodeado en `entity-list.tsx:426`.** La etiqueta del bloque de
  insight es `AI {action}`, sin forma de apagar solo el prefijo. Lo rodeé con
  `showLabel: false` y el nombre al inicio de la línea, que da el texto correcto
  pero pierde el peso tipográfico de la etiqueta (13px semibold `--foreground`
  → 12px medium `--muted-foreground`). Si Michael hace el prefijo opcional
  — `{ai.aiPrefix !== false && "AI "}` o similar — se recupera el estilo y se
  vuelve a `showLabel` por defecto.
- **El umbral de 760px.** Lo derivé midiendo dónde deja de caber la fila única
  con este contenido. El spec no da un número. Si Design fija uno, es la
  constante `HEADER_STACK_THRESHOLD`.
- **`Request access` no hace nada.** El `EmptyState` de Restricted ofrece el CTA
  correcto, pero no hay flujo de solicitud de scope en AIMS OS todavía. Queda
  como stub, igual que el resto de handlers del prototipo.
- **NBA por debajo del mínimo.** El spec deja abierto qué hacer si el motor
  devuelve menos del mínimo de rationale ("Open question with Engineering").
  Aquí `rationale` es opcional y la card renderiza sin él antes que perderse.
- **Tab Logs.** La convención del DS lo pone al final de toda página de detalle.
  Los tabs elegidos fueron Overview · Snapshot · Activity · Drives; Activity ya
  cubre la traza con su paginación.
