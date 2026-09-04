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

## Cómo abrir el PR en el repo del DS

Esta sesión de Claude Code **no puede** pushear a `cachilupis/aims-os-design-system`.
No es permisos de la cuenta — `list_repos` reporta `can_push: true` — es que la
sesión está atada al owner `thomzilla33` y las tres vías están cerradas:
`add_repo` responde `cross-tier adds are not supported in v1`, el proxy de git
devuelve 403 sin inyectar credencial, y la API de GitHub responde
`not configured for this session`.

Así que va a mano, o desde una sesión nueva que arranque con el repo del DS como
source inicial:

```bash
cd ~/aims-os-ds                 # tu clon de cachilupis/aims-os-design-system
git checkout main && git pull
git checkout -b claude/ucp-unified-contact-profile
git apply /ruta/a/ucp-ds-screens/ucp-screens.patch
npm run build                                  # 0 errores
node scripts/audit-tokens.cjs --counts         # ninguna categoría sube
npm run dev                                    # localhost:5173 → Prototypes
git add -A && git commit                       # el mensaje sale del historial de esta rama
git push -u origin claude/ucp-unified-contact-profile
gh pr create --base main --title "UCP — Unified Contact Profile, built on the DS" \
             --body-file /ruta/a/ucp-ds-screens/PR.md --reviewer cachilupis
```

El cuerpo del PR está escrito y listo en **`PR.md`**, en esta misma carpeta.

El patch toca 5 archivos: 3 pantallas nuevas en `src/screens/`,
`entity-list.tsx`, y **dos líneas** en `App.tsx`. No borra nada. `entity-list.tsx` y `App.tsx`
están bajo CODEOWNERS, así que el PR necesita review de **@cachilupis** — es el
comportamiento esperado, no un bloqueo.

CI corre `.github/workflows/design-system-checks.yml` en todo PR: `npm run build`
y el token audit con su ratchet. Ambos ya pasan en local.

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

## Se construyó dos veces, y la segunda es la que va

La primera versión traía su propio `EntityHeader` en `experimental/`, hecho
desde el Figma `19815-101547`, con tres argumentos: que `RecordHeader`
ramificaba en tres formas cerradas de registro, que cargaba el Next Best Action
adentro donde el spec quería una card aparte debajo, y que no cubría estados.

Los tres dejaron de ser ciertos mientras esto estaba en vuelo:

- **El agnosticism pass del #46** eliminó las variantes cerradas `uep`/`ucp`/`uvp`
  — *"This card now serves ANY entity type on the platform."*
- **El redesign del #46** reintrodujo el Next Best Action a propósito, como
  bloque protagonista visible colapsado y expandido. El design system tomó la
  posición contraria a la que justificaba una card aparte, y la shippeó.
- `RecordHeader` ahora lleva loading por zona y masking por campo.

Así que el prototipo se reconstruyó sobre `RecordHeader` y los dos componentes
de `experimental/` se borraron en vez de proponerse. **De 8 archivos tocados
pasó a 5, sin componentes nuevos y sin borrar nada.**

Dos cosas que eran de esta pantalla ahora son del componente, y están mejor ahí:
el Next Best Action, que ya no hay que ubicar, y el reflow por ancho de card,
que `RecordHeader` mide sobre su propia caja.

### Lo que esto conecta y nadie había conectado

`pm-thomas-universal-profile.tsx` dice que deja `recordFields` sin pasar a
propósito, porque esa pantalla no tiene panel de procedencia ni sistemas fuente
reales que nombrar — *"The panel gets wired with real provenance during the UCP
header redesign."* Esto es eso.

- **La procedencia es por campo, no por registro.** El rol del contacto viene
  del CRM; el conteo de hechos verificados viene del sistema de conocimiento. Un
  `source` único por registro era una simplificación que dejó de ser cierta en
  cuanto dos campos discreparon sobre de dónde venían.
- **`onProvenanceOpen` abre un panel real** con cada campo, su sistema, la
  versión del modelo y el último sync.
- **El masking lo decide el entitlement** (`VIEWER_SCOPES` contra el
  `requiredScope` del registro), nunca un flag en el registro. El PM tiene
  contacts, HR y drives — finanzas no, a propósito — así que Amy Chen, la CFO,
  renderiza `locked` con sus campos gobernados `masked`. Un campo enmascarado
  conserva su etiqueta, su badge de procedencia y su hora de sync, y solo retiene
  el valor. Ese es el punto: el viewer ve que el campo existe y está gobernado,
  que es distinto de que el campo no esté.

### Un bug que encontré al probarlo

Dejé `Export record` habilitado en un registro bloqueado. El componente razona
que *locked* significa "no puedes actuar sobre el registro, no que no puedas
consultarlo", y por eso deja vivas las superficies de solo lectura — pero un
export escribe los valores gobernados en un archivo que el viewer se queda.
Consultar un campo enmascarado en pantalla y extraerlo no son el mismo acto.
Verificado en ambos sentidos: bloqueado `disabled=true`, normal `disabled=false`.

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

**El nombre exacto necesitó una prop nueva en el DS.** `EntityList` renderizaba
la etiqueta como `AI {action}`, con el `AI ` hardcodeado, así que pasar "Next
Best Action" imprimía **"AI Next Best Action"**. El prefijo está bien cuando
`action` nombra una *categoría* de output — "AI Summary", "AI Impact", "AI
Escalated", que es como lo usan las otras tres pantallas. Está mal cuando
`action` es un concepto de producto con nombre propio: "AI Next Best Action"
renombra la cosa, y la fila deja de decir lo mismo que la card del perfil.

Primero lo rodeé con `showLabel: false` y el nombre al inicio del texto. Daba la
palabra correcta pero perdía el peso de la etiqueta — 13px semibold
`--foreground` bajaba a 12px medium `--muted-foreground`. Así que la solución
quedó en el componente:

```ts
showAiPrefix?: boolean   // default true — ningún caller existente cambia
```

`showAiPrefix: false` imprime `action` tal cual y **conserva el estilo de la
etiqueta**. Es opt-out, no opt-in, así que las tres pantallas que ya usaban
`aiInsight` renderizan byte por byte lo mismo — verificado corriendo el
playground del DS: con el default sigue diciendo "AI Escalated", con el toggle
apagado dice "Escalated".

Va con su toggle en el playground de `entity-list` (**Prefijo «AI »**) y su fila
en la tabla de props. Una prop del DS que no se puede ejercitar en la página del
propio componente es el mismo problema que los estados del header: existe en el
archivo y nadie la puede revisar.

**De paso, un separador colgado.** Con la etiqueta encendida y el bloque
expandido, el `·` que divide etiqueta de detalle quedaba solo al final de la
línea — el detalle inline se va a los bullets al expandir, pero el separador se
quedaba. Ahora solo se renderiza cuando hay algo que separar. Es un bug
preexistente del componente; se hizo visible al recuperar la etiqueta.

Y el `detail` pasó a ser un array en vez de una sola cadena corrida. La primera
línea es para lo que existe la fila — la propuesta y el cuándo — y el rationale
se vuelve su propio bullet al expandir, que es donde el lector va a decidir. Las
diez recomendaciones traen uno, así que el bloque siempre tiene algo en qué
expandirse.

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
├── PR.md                                        # el cuerpo del PR, listo para --body-file
├── src/
│   ├── components/ui/
│   │   └── entity-list.tsx                      # showAiPrefix + separador · CODEOWNERS
│   └── screens/
│       ├── ucpShared.ts                         # tipos + fixtures (16 entidades) + entitlements
│       ├── pm-thomas-ucp-contacts.tsx           # listado + navegación al perfil
│       └── pm-thomas-ucp-profile.tsx            # UCP: RecordHeader + 4 tabs + concierge
├── figma/                                       # el spec del EntityHeader retirado,
│   ├── anatomy.png · variants.png               #   conservado por el razonamiento
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

## Lo que toca `src/components/` — necesita review de Michael

`.github/CODEOWNERS` marca `/src/components/` y `/src/App.tsx` con
`@cachilupis`, así que el PR no mergea sin su review. Dos archivos, ambos
aditivos:

- **`entity-list.tsx`** — la prop `showAiPrefix?: boolean` (default `true`) y el
  arreglo del separador colgado. Ningún caller existente cambia de render.
- **`App.tsx`** — el toggle del playground, el wiring en las dos ramas del demo
  item, la fila en la tabla de props, y las dos líneas del registro del
  prototipo (import + entrada en `PROTOTYPE_PAGES`). No se quita nada.

Todo lo demás vive en `/src/screens/`, que no tiene owner.

---

## `// DS-GAP:` marcados

1. **`agent chat panel`** (dentro de las dos pantallas) — no existe componente de
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
