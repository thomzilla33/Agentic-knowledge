# 03 · Los 15 tickets, y por qué cada uno existe

**21 tickets** bajo el Boulder [ARP-375 · Universal Entity Profile](https://aims-os.atlassian.net/browse/ARP-375), todos en **Backlog** y **sin estimar**. Los 15 originales del 2026-09-11, más 6 creados el mismo día al descubrir que el árbol no cubría lo que alimenta a Intelligence y Knowledge.

## Jerarquía de ARP — para no equivocarse al crear más

```
Boulder   (nivel 3)  ← ARP-375
  Feature (nivel 2)  ← ARP-1406, ARP-1407, ARP-1408
    Version (nivel 1) ← lo que llamamos "Sub Feature". NO es la versión de producto
      Story / Bug (nivel 0)
```

**Un Feature no puede contener otro Feature.** Sus hijos solo pueden ser `Version`. Esto importa para ARP-468 — ver `06-PENDIENTES.md`.

## Versiones de producto

| Versión | Contenido | Estado |
|---|---|---|
| UCP v1 | ARP-376 — Facelift | Done |
| **UCP v2.0** | ARP-1406 y ARP-1407 con sus hijos — 11 tickets | **Esta entrega** |
| UCP v2.1 | ARP-1408 con sus hijos — 4 tickets, `[Next Round]` | Backlog |
| — | ARP-468 — plataforma de tipos, canvas, widgets, packs | Aparte |

**Labels:** `ucp-v2-0` en los once · `next-round` + `ucp-v2-1` en los cuatro · `access-permissions` en los tres companions.

---

# Feature 1 — [ARP-1406](https://aims-os.atlassian.net/browse/ARP-1406) · Listado

> **Por qué existe:** el perfil unificado no tiene puerta de entrada. Sin una lista desde la cual abrir un registro, el perfil es una pantalla a la que nadie llega.

### [ARP-1409](https://aims-os.atlassian.net/browse/ARP-1409) · Lista por tipo
La lista y el punto desde el que se abre cualquier perfil. **Por qué es su propio ticket:** concentra las reglas de qué se ve en una fila y cómo se marca un registro gobernado, que son decisiones que aplican a todos los tipos.

### [ARP-1410](https://aims-os.atlassian.net/browse/ARP-1410) · Paginación
**Por qué es su propio ticket:** tiene una regla que se rompe sola si va enterrada en el de la lista — nunca estado vacío y paginación juntos — y un reset que hay que aplicar en cuatro puntos distintos (cambio de tipo, filtro, orden, tamaño de página).

### [ARP-1411](https://aims-os.atlassian.net/browse/ARP-1411) · Creación por stepper
**Por qué es su propio ticket:** es el único flujo de alta y tiene su propio modelo de error (que no se pierda lo cargado).
**Corregido en el review:** el criterio decía *"va a la lista **o** al perfil"* — QA no puede decidir cuál. Ahora va al perfil del registro nuevo. Y el botón de crear pasó de oculto a **deshabilitado con tooltip**.
**TBD abiertos:** frames del stepper · detección de duplicados · confirmación al cancelar.

### [ARP-1412](https://aims-os.atlassian.net/browse/ARP-1412) · Access & Permissions
**Por qué existe:** ningún Feature entra a sprint sin su companion. Acá viven los **textos canónicos de tooltip** de toda la plataforma.

---

# Feature 2 — [ARP-1407](https://aims-os.atlassian.net/browse/ARP-1407) · Perfil: espinazo, Overview y Activity

> **Por qué existe:** fija el contrato de tabs que recibe toda entidad publicada, y entrega las dos pestañas mandatorias.
> **Bloquea [ARP-468](https://aims-os.atlassian.net/browse/ARP-468)** — no se puede construir el canvas sin saber dónde aterriza.

### [ARP-1413](https://aims-os.atlassian.net/browse/ARP-1413) · Contrato de tabs y extensión
No es una pantalla: es el componente que toda pantalla de perfil monta. **Por qué es su propio ticket:** es la pieza que bloquea a ARP-468, y mezclarla con Overview escondería esa dependencia.
**TBD abierto:** qué pasa cuando los módulos de industria desbordan el ancho.

### [ARP-1414](https://aims-os.atlassian.net/browse/ARP-1414) · Overview
El dashboard configurable. **Depende de ARP-468** para el canvas y el runtime de widgets; este ticket define el comportamiento sobre ese canvas.
**El mejor del lote** según la auditoría — cero TBD. Lo que lo salva es que los estados están especificados por widget, no por pantalla.

### [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) · Activity
Comunicaciones, notas, eventos y tareas en un hilo.
**Por qué los criterios se cierran por tipo de actividad:** las cuatro fuentes no van a estar listas a la vez. El ticket admite entrega por fases sin quedar a medias.
**TBD abierto y con peso de diseño:** las tareas pendientes no son pasado. Mezclarlas en un hilo cronológico son dos modos de lectura. Propuesta: fijarlas arriba. **Es el único TBD que cambia el diseño de una pestaña mandatoria** — cerrarlo primero.

### [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) · Notas
> ⚠️ **El más frágil de la entrega.** Único flujo de escritura del perfil, y el prototipo solo cubre cómo se **leen** las notas, no cómo se **escriben**.

**Corregido en el review:** el criterio 2 dependía de un TBD del propio ticket (¿el campo desaparece o se deshabilita para quien no es owner?). Cerrado: **deshabilitado con tooltip**.
**Sigue faltando:** el diseño del campo de escritura. Sin eso no se puede estimar.

### [ARP-1417](https://aims-os.atlassian.net/browse/ARP-1417) · Access & Permissions
Quién ve cada pestaña, quién arma su Overview, quién escribe notas. Con los textos de tooltip del perfil.

---

# Feature 3 — [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) · Intelligence y Knowledge

> 👥 **Dueños: Lex Paniagua y Julian Johnston.** → **[Brief dedicado](https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a)** — leer antes de tomar cualquiera de los hijos.

**Por qué es el trabajo abierto de verdad:** Overview y Activity **leen** fuentes que ya existen. Intelligence y Knowledge necesitan que algo **produzca** su contenido primero, y eso no existe. En el prototipo es texto fijo.

> **Cambio de alcance del 2026-09-11.** La versión original de este Feature decía *"este Feature los muestra, no los produce"* y dejaba el motor y el pipeline **fuera de todo ticket del árbol**. Eso dejaba las dos pestañas sin forma de existir: cualquiera que tomara ARP-1418 o ARP-1419 construiría una maqueta y no podría cerrarla. Se amplió el alcance y se crearon los dos tickets que faltaban.
>
> También salió el tag `[Next Round]` de los cuatro títulos: es trabajo activo, no backlog. La prioridad sigue en P2 para no competir con la entrega de UCP v2.0.

## Lo que produce el contenido — los dos que faltaban

### [ARP-1421](https://aims-os.atlassian.net/browse/ARP-1421) · 🆕 Motor de inferencia
Produce los cinco tipos de insight — resumen, señales, tags, next-best actions, deducciones — cada uno con confianza y procedencia. **Dos requisitos que no son obvios:** el motor corre con el alcance del viewer (lo que no puede leer, no puede inferir), y la inferencia es **reproducible** — un insight que cambia sin que cambie el dato es un bug.

### [ARP-1422](https://aims-os.atlassian.net/browse/ARP-1422) · 🆕 Pipeline de claims
Puebla los tres planos y mueve claims entre ellos, en una sola dirección: **Sources → Sandbox → Truth**, dejando rastro en cada paso. **La pregunta central que hoy no tiene respuesta escrita en ninguna parte:** qué hace que un fact sea «verificado» — quién o qué atestigua, y con qué evidencia.

## Las pestañas

### [ARP-1418](https://aims-os.atlassian.net/browse/ARP-1418) · Intelligence
La presentación. Todo output de IA agrupado en una pestaña en vez de una por tipo de insight. Lleva el estado **`Held`** del prototipo, que retiene una sugerencia mostrando el motivo.

### [ARP-1419](https://aims-os.atlassian.net/browse/ARP-1419) · Knowledge
Los tres planos con su confianza declarada. Lleva escrita la inconsistencia Sources-vs-Drives como bloqueante.

### [ARP-1420](https://aims-os.atlassian.net/browse/ARP-1420) · Access & Permissions
Quién ve cada insight y cada plano, con los textos de tooltip redactados.

## Las cuatro decisiones, ahora con ticket propio

Antes vivían enterradas en secciones de *Open questions*, donde nadie las cierra. En orden de lo que condiciona a lo demás:

| Ticket | Decisión | Por qué importa |
|---|---|---|
| [ARP-1424](https://aims-os.atlassian.net/browse/ARP-1424) | **Fuga por inferencia** | La única que, mal resuelta, produce un incidente de seguridad y no un bug de UX. Un resumen puede revelar un campo enmascarado sin mostrarlo nunca. Cambia la arquitectura del motor |
| [ARP-1423](https://aims-os.atlassian.net/browse/ARP-1423) | ¿`Held` es política o regla del motor? | Determina **qué ticket lo construye**. Sin decidirlo, se construye dos veces o ninguna |
| [ARP-1426](https://aims-os.atlassian.net/browse/ARP-1426) | ¿Dónde se promueve un claim a Truth? | Define si Knowledge tiene flujo de escritura. Hoy la respuesta es «solo Governance Studio» **por omisión, no por decisión** |
| [ARP-1425](https://aims-os.atlassian.net/browse/ARP-1425) | Sources vs Drives | El canon ya resuelve; falta confirmar con quien llevó el prototipo adelante |

---

## Qué se corrigió antes de publicar

La auditoría de tickets encontró tres violaciones **sistémicas** — repetidas en varios tickets, no errores sueltos:

| # | Violación | Dónde | Corrección |
|---|---|---|---|
| 1 | `deny by default` como criterio de aceptación | los 3 companions | Reescrito en términos de lo que el usuario ve |
| 2 | CTA de crear oculto sin permiso | ARP-1411, ARP-1412 | Deshabilitado con tooltip |
| 3 | Controles deshabilitados sin texto de tooltip | los 3 companions | Textos canónicos escritos en los companions |
| 4 | Lenguaje de implementación (*store propio*, *no se renderiza*, *stream no conectado*) | 4 lugares | Traducido a lenguaje de usuario |
| 5 | Criterio con "o" — no testeable | ARP-1411 | Se eligió una sola salida |
| 6 | Estados de pantalla evadidos (*"no aplica"*, *"ver sub features"*) | ARP-1410, ARP-1408 | Especificados |
| 7 | Criterio que dependía de un TBD del propio ticket | ARP-1416 | TBD cerrado |

**Lo que queda sin corregir a propósito:** los 15 tickets están **sin estimar**. Es del equipo, no mío.

---

## Dos plantillas canónicas en conflicto

Los 15 tickets siguen el formato de 13 secciones de `aims-os-prd-to-tickets`, que es contra el que los auditó `aims-os-ticket-reviewer`.

Pero el skill `jira-arp-ticket-creator` declara una plantilla distinta y también "locked":

| | `jira-arp-ticket-creator` | Lo que tienen los 15 |
|---|---|---|
| Feature | 6 secciones — Prototype Link · User Story · Description · Scope · Sub Feature Breakdown · Parent Boulder Reference | 13 secciones |
| Sub Feature | 5 secciones — Prototype Link · User Story · Description · Scope & Acceptance Criteria · Parent Feature Reference | 13 secciones |

**No se convirtieron al formato corto** porque eso destruiría información que el review exigió y que ingeniería necesita: los cuatro estados de pantalla por ticket, los textos canónicos de tooltip, los edge cases, los `_To be defined_` marcados y los decisions logs. Nada de eso tiene lugar en la plantilla corta.

**Queda como decisión del equipo:** o los 15 se quedan así, o alguien concilia las dos plantillas. Hoy un ticket creado con un skill y otro creado con el otro no se parecen, que es justo lo que las plantillas "locked" existían para evitar.

## Corrección aplicada el 2026-09-11

Tres títulos salieron con el ampersand escapado (`Access &amp; Permissions`, visible como texto literal) por un error al crearlos. Corregidos en ARP-1412, ARP-1417 y ARP-1420.
