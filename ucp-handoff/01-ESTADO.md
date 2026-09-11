# 01 · Estado actual

## Fuente de verdad

| | Qué es | Estado |
|---|---|---|
| **Prototipo vigente** | https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts | **Es la referencia.** Los 15 tickets apuntan acá |
| Build histórico — roster | https://thomzilla33.github.io/Agentic-knowledge/ucp-contacts.html | Registro del origen. Quedó atrás |
| Build histórico — experimento | https://thomzilla33.github.io/Agentic-knowledge/ucp-entity-workspace.html | Registro del origen. Quedó atrás |
| Figma | https://www.figma.com/design/ZC49wFfu7IA9orIF6SGKdr/Unified-Customer-Profile?node-id=7292-253451 | Header de entidad y layout base |
| Transferencia visual | https://claude.ai/code/artifact/06448a5c-ae51-45a4-9f81-cd193dcc44be | Recorrido del prototipo en 6 pasos |

---

## Qué pasó con nuestro trabajo

Nuestro código llegó al repositorio del design system (`cachilupis/aims-os-design-system`) y está desplegado en Vercel. Lo verifiqué por strings exactos en el bundle: `No people on this account`, `publishes a different set of facets`, `Account owner`, `Headquarters`, `Employment` — todos nuestros.

Pero **alguien lo llevó considerablemente más adelante**. Lo que está desplegado hoy, verificado renderizándolo (no leyendo el bundle):

| Lo que dejamos nosotros | Lo que hay hoy en Vercel |
|---|---|
| Roster con 3 tipos | Rail ENTITIES con **5**: Customers 7 · Employees 4 · Companies 5 · Policies 2 · Assets 2 |
| Overview + pestañas de estudio | **Overview · Activity · Intelligence · Knowledge**, más **People** en compañías |
| — | Activity con chips `All · Communications · Notes · Events · Tasks`, filtros de estado y período, agrupado por día, con resumen de IA por fila |
| — | Widget `KNOWLEDGE` en Overview: 5 Truth / 3 Sandbox / 3 Sources |
| — | `CONNECTIONS` incluyendo activos (`AST-2290 Service loaner`, `AST-2314 Diagnostic rig`) |
| — | Intelligence con `SUGGESTIONS · 3 · Sorted by impact × urgency` y el estado **`Held`** |

El header de un registro lee: `Renewal in 28 days · 11 facts · 4 stores · 41 open · Tier 1`.

> **Nota de método:** el proxy de la sesión no llega a Vercel con un navegador headless. Bajé los assets con `curl` y los serví en `127.0.0.1:8100` para renderizarlos. Todo lo de arriba lo vi en pantalla.

---

## Las dos inconsistencias sin resolver

Ambas están en el prototipo vigente, en el mismo registro. Hay que cerrarlas con quien lo llevó adelante antes de que ingeniería construya.

### 1. Sources vs Drives — el mismo plano con dos nombres

El widget `KNOWLEDGE` del Overview llama **Sources** a la tercera sección. La pestaña Knowledge la llama **Drives**.

**Resolución según el canon** (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`): el **plano** se llama *Sources*; los *Source Drives* son el contenedor — carpetas y documentos de las unidades compartidas de la empresa — que lo alimenta. Es decir: **el Overview está bien y la pestaña está mal nombrada.**

Queda escrito como bloqueante en **ARP-1419**.

### 2. El assistant se genericizó

Nuestra prop `assistantLabel` producía `Ask about this company` en compañías. En el prototipo vigente el botón dice `Ask about this entity` en todos los tipos; la variante por tipo no aparece en el bundle.

Puede ser una decisión deliberada de simplificación. **No está documentada en ningún lado**, así que hay que preguntarla, no asumirla.

---

## Qué es real y qué es mockeado

| | Estado |
|---|---|
| Todos los datos del prototipo | **Mockeados.** Fixtures en el repo del design system |
| Los tipos de entidad | Mockeados, pero el modelo que los publica es real |
| Permisos y enmascarado | Simulados con `VIEWER_SCOPES` — un array fijo de tres scopes |
| Resúmenes de IA y sugerencias | Texto fijo. No hay motor detrás |
| El estado `Held` | Comportamiento de UI real, política de gobernanza **sin confirmar** |
| Paginación, filtros, búsqueda | Reales sobre los fixtures |
| Creación por stepper | Panel con campos; el stepper paso a paso **no existe todavía** |

---

## Estado en Jira

**Boulder:** [ARP-375 · Unified Contact Profile](https://aims-os.atlassian.net/browse/ARP-375) — *Selected for Development*

| Clave | Ticket | Tipo | Versión |
|---|---|---|---|
| [ARP-1406](https://aims-os.atlassian.net/browse/ARP-1406) | Listado — lista, paginación y creación | Feature | v2.0 |
| [ARP-1409](https://aims-os.atlassian.net/browse/ARP-1409) | Lista por tipo | Sub Feature | v2.0 |
| [ARP-1410](https://aims-os.atlassian.net/browse/ARP-1410) | Paginación | Sub Feature | v2.0 |
| [ARP-1411](https://aims-os.atlassian.net/browse/ARP-1411) | Creación por stepper | Sub Feature | v2.0 |
| [ARP-1412](https://aims-os.atlassian.net/browse/ARP-1412) | Access & Permissions — Listado | Sub Feature | v2.0 |
| [ARP-1407](https://aims-os.atlassian.net/browse/ARP-1407) | Perfil — espinazo, Overview y Activity | Feature | v2.0 |
| [ARP-1413](https://aims-os.atlassian.net/browse/ARP-1413) | Contrato de tabs y extensión | Sub Feature | v2.0 |
| [ARP-1414](https://aims-os.atlassian.net/browse/ARP-1414) | Overview | Sub Feature | v2.0 |
| [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) | Activity | Sub Feature | v2.0 |
| [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) | Notas | Sub Feature | v2.0 |
| [ARP-1417](https://aims-os.atlassian.net/browse/ARP-1417) | Access & Permissions — Perfil | Sub Feature | v2.0 |
| [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) | **[Next Round]** Intelligence y Knowledge | Feature | v2.1 |
| [ARP-1418](https://aims-os.atlassian.net/browse/ARP-1418) | **[Next Round]** Intelligence | Sub Feature | v2.1 |
| [ARP-1419](https://aims-os.atlassian.net/browse/ARP-1419) | **[Next Round]** Knowledge | Sub Feature | v2.1 |
| [ARP-1420](https://aims-os.atlassian.net/browse/ARP-1420) | **[Next Round]** Access & Permissions | Sub Feature | v2.1 |

**Enlaces creados:** ARP-1407 *blocks* ARP-468 · cada companion de A&P *relates to* su Feature.

**Todos están en Backlog y sin estimar** — a propósito. No entran a sprint hasta que el equipo los estime y se cierre lo de [`06-PENDIENTES.md`](06-PENDIENTES.md).

**Tickets preexistentes que no toqué:**

| Clave | Qué es | Ojo |
|---|---|---|
| ARP-376 | UCP v1 — Facelift | Done |
| ARP-468 | Feature, *Selected for Development* | Tiene **8 sub-features** propias (ARP-502 a ARP-510) |
| ARP-520 | Feature, `{Test}`, Backlog | Tiene **7 sub-features** propias (ARP-521 a ARP-527). **No es un duplicado vacío** — es un desglose más limpio que el de ARP-468. Ver `06-PENDIENTES.md` |
