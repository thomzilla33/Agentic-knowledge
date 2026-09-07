# Experimento — Entity Workspace

**Preview:** https://claude.ai/code/artifact/2db1a5f0-cecb-4c55-b68c-9bdb0d8931b0

Responde una pregunta: qué pasa con el listado cuando el tenant publica **12 tipos
de entidad** y no 3 — vehicles, dealerships, invoices, policies.

## Cómo revertirlo

**No haciendo nada.** Está en una rama aparte, en un artifact aparte, y en
archivos propios. Si no gusta, se borra la rama y no queda rastro.

- El preview aprobado sigue en su URL de siempre, sin tocar.
- `main` no cambió.
- La card aprobada (`UCP - Contacts Last version`) sigue viva **dentro del mismo
  bundle del experimento**, así que se pueden comparar una al lado de la otra sin
  cambiar de preview: sidebar → Prototypes.

Si gusta, aplicar cuesta 2 archivos nuevos + 2 líneas en `App.tsx`:

```
src/screens/entityRegistry.ts              # nuevo
src/screens/pm-thomas-entity-workspace.tsx # nuevo
src/App.tsx                                # +2 líneas, aditivas
```

`experiment.patch` trae exactamente eso.

## Revisado contra prior art

La primera versión ponía vistas cross-type en el tab strip primario y hacía de la
lista mixta la puerta por defecto al roster. Una investigación de 107 agentes
sobre fuentes primarias (Dataverse, Salesforce/SLDS, HubSpot, IBM Carbon, NN/g)
la contradice en tres puntos, y esta versión los corrige.

### 1 · El roster vuelve a ser type-scoped

Ninguna plataforma documentada lista tipos heterogéneos en una tabla de trabajo.
El patrón dominante es agrupar **por tipo** y renderizar el set de columnas propio
de cada tipo. Donde existe superficie mixta es **búsqueda**, y degradada a
propósito: Dataverse la limita a seis columnas, le quita el sort e indexa solo
algunos campos.

Y el filtrado cross-type colapsa al mínimo común denominador — Microsoft lo
deriva explícitamente: en la vista mixta solo quedan las tres facetas que existen
en todos los tipos (Owner, Modified On, Created On).

Se ve en el preview: la fila de un vehicle muestra su **VIN**. Una lista mixta no
puede mostrarlo, y la primera versión escondía esa pérdida mostrando solo campos
que por casualidad eran comunes.

### 2 · El catálogo se aplana y se ordena por uso

Agrupar por *model* no tiene prior art como estructura de cara al usuario:
Dataverse ordena por relevancia de resultados, Salesforce mantiene un "All Items"
plano y buscable encima de su agrupación por app, HubSpot no agrupa. Era inventar
un patrón.

Además la **amplitud** del menú importó más que la calidad de las etiquetas:
menús amplios y bien rotulados bajaron el fallback a búsqueda por debajo del 10%,
los estrechos lo subieron a ~40%. Así que es una lista plana ordenada por uso, y
el modelo queda **en la fila** como metadato — sigue siendo buscable, ya no es la
estructura.

### 3 · La lista mixta se separa como Inbox

Lo que el prior art no podía pesar: ninguna de esas plataformas tiene **Next Best
Action**. "Qué necesita una decisión" es cross-type por naturaleza y es un inbox
por naturaleza — que es justo el único rol que la evidencia sí le concede a una
lista mixta.

Así que vive en **My Work**, no en el roster, y sus columnas están **declaradas**
(`INBOX_COLUMNS`), no descubiertas por query. Eso convierte el piso de tres
facetas de Dataverse de sorpresa en contrato: agregar un tipo no puede vaciar una
columna en silencio.

### Lo que sobrevivió de la primera versión

- **La puerta "All entities"** — el App Launcher de Salesforce lista *"every item
  in Salesforce that you have permission to use"*: buscable y filtrado por
  permisos.
- **Vistas guardadas como tabs** — pero **dentro de un tipo**. Los tabs del index
  page de HubSpot son exactamente eso. Carbon sanciona tabs curados por el
  usuario *"to focus a specific data set"* y en la misma sección dice *"Do not use
  as navigation"*.

### El argumento que tuve que abandonar

"Se rompe a 12+ tipos" es débil: NN/g niega que exista un número mágico, y el
overflow de tabs de SLDS es un mecanismo de layout, no de descubrimiento. El
argumento bueno es **overflow + information scent + que el set no está acotado por
tenant**.

## UP internos por tipo

Cada tipo abre en un perfil. **Hay una sola pantalla de perfil** —
`entityProfileView.tsx` — sin un solo `if (type === "vehicle")`. Los campos del
header, el tab strip y los widgets del Overview se leen del registro.

Eso es la tesis vuelta comprobable: abrí un customer, después un vehicle. El
chrome es idéntico, el contenido no, y no se escribió una pantalla para ninguno.

### La respuesta a la pregunta 3

`CLAUDE.md` dice que el detalle lleva tabs específicos por tipo. **Los define el
modelo** — el mismo lugar de donde salen los campos. Un tab strip escrito en otra
parte sería una segunda definición de la misma entidad, derivando de la primera.

Pero cuatro tabs son universales, y no por convención: son sobre **conocimiento**,
no sobre la cosa.

| Tab | Por qué aplica a cualquier entidad |
|---|---|
| Overview | qué debería mirar |
| Snapshot | qué sabemos y con cuánta certeza (Truth / Sandbox / Sources) |
| Activity | qué pasó |
| Drives | qué documentos lo respaldan |

Todo lo ingerido tiene claims, interacciones y papeles. Un vehicle tiene hechos y
rastro documental igual que un customer.

Lo que agrega el modelo encima es el dominio:

```
customer    Overview · Deals                    · Snapshot · Activity · Drives
employee    Overview · Reviews · Access         · Snapshot · Activity · Drives
vehicle     Overview · Service history · Ownership · Snapshot · Activity · Drives
dealership  Overview · Inventory · Staff        · Snapshot · Activity · Drives
```

Los tabs de dominio van **entre** el canvas y los planos de conocimiento: después
de "qué debería mirar", antes de "cómo lo sabemos". El historial de servicio de un
vehículo está más cerca de su overview que de su procedencia.

**Un tipo sin spec igual renderiza** — cuatro tabs, sin widgets de dominio. Por eso
publicar un tipo no cuesta nada en el perfil: funciona en el momento en que existe,
y el detalle de dominio llega después sin bloquearlo.

### Dos cosas que encontré construyéndolo

**Un bug mío:** le pasé `recordFields` a `RecordHeader` con un `onProvenanceOpen`
vacío. El componente no renderiza esos campos inline — su único efecto visible es
habilitar el botón ⓘ — así que había creado un botón vivo que no hacía nada, que
es peor que uno deshabilitado. Ahora el panel está conectado, y de paso es donde
la diferencia por tipo se vuelve visible: el vehicle muestra VIN, odómetro y su
precio **enmascarado** por `finance.read`.

**Un bug del DS, ahora arreglado:** el trigger del agente decía **"Ask about 2024"**
en el Ford F-150. `RecordHeader` toma el primer token del nombre (`Ask about
{firstName}`), que es correcto para una persona y absurdo para un vehículo. Es una
consecuencia del agnosticism pass que quedó a medias: el componente ya dice servir
*"Patient, Citizen, Student, anything the host platform defines tomorrow"*, pero
esa etiqueta sigue con forma de persona.

**Arreglado con una prop nueva:** `assistantLabel?: string` en `RecordHeader`.
Aditiva, default sin cambios.

```ts
assistantLabel?: string   // undefined → "Ask about {primer nombre}"
```

No puse una heurística en el componente a propósito. Desde el agnosticism pass
`RecordHeader` no sabe qué tipos existen, y adivinar por la forma del string
(¿empieza con dígito? ¿es un nombre de pila conocido?) sería meter ese
conocimiento de vuelta por la ventana, y estaría mal para el naming de algún
tenant desde el primer día. **Decide el host**, y solo en los tipos donde el
default se rompe — vehicle, deal, invoice, payout, policy, test drive, trade-in.
Customer, employee, company y dealership no la pasan: sus nombres son de persona
o de marca, y "Ask about Sandra" / "Ask about Riverbend" ya funcionan.

Un detalle que decidí: **el fallback por ancho sigue ganando.** Si la card es
angosta, la etiqueta baja a "Ask AI" pase lo que pase, porque ese colapso es por
espacio y no por naming. Y una etiqueta larga del host recibe la misma guarda de
longitud que un nombre largo — si no, un host bienintencionado podría romper la
fila de acciones.

Va con el ejemplo 11 en el playground de `record-header`, que muestra el default
roto y el override uno debajo del otro. Una prop del DS que no se puede ejercitar
en la página de su componente es el mismo problema que un estado que nadie
renderiza.

Verificado: el vehicle dice "Ask about this vehicle" y ya no "Ask about 2024"; el
customer sigue diciendo "Ask about Sandra"; y el universal-profile —el otro
consumidor— sigue en "Ask about James", sin cambios.

Vale decir que este bug **solo aparece en tipos que no son personas**. Es evidencia
de que construir los UP por tipo valía la pena.

---

## Filtros — la línea, y qué tan dinámicos

**Los quickfilters no son algo nuevo.** El patrón del DS ya es de tres capas —
`Visible Filters → All Filters → Slideout`, más chips — y `Filters` ya recibe
`slots` para la capa visible. Una fila aparte de quickfilters sería una **cuarta
capa** y un segundo source of truth del dataset, que el patrón de List View
prohíbe.

**Cuáles van inline lo decide la frecuencia, no la importancia.**
`FILTERS_SPEC.md` tiene la regla textual: algo se queda fuera del slideout
*"because it should always be visible (high-frequency)"*.

### Dinámicos: dos cosas distintas, una segura y una no

**Por tipo — sí, y sale gratis.** Las facetas las publica el modelo, el mismo
lugar de donde salen los campos. Un vehicle filtra por Condition y Store; un
customer por Status y Owner. Validado: Dataverse configura facetas por tabla, y
su vista mixta cae a las tres globales precisamente por esto.

**Por selección — solo conteos, no disponibilidad.** Cada opción muestra cuántos
quedarían, y **cero deshabilita en vez de remover**. Si al elegir *In service*
desapareciera la faceta *Store* porque ningún vehículo en taller está en Brandon,
perderías la salida: no podés ensanchar de vuelta. Es el fallo conocido de
esconder facetas vacías.

Verificado corriendo (`U3`): con *In service* aplicado, Store muestra
**Riverbend Tampa · 2** y **Riverbend Brandon · 0** — Brandon sigue ahí,
deshabilitado, no removido.

### Dos consecuencias que había que decidir

**Al cambiar de tipo los filtros no viajan.** Un filtro por Odometer no significa
nada en customers. Así que se limpian — y **se avisa**: *"Filters cleared —
Customers publishes a different set of facets."* Sin ese aviso el usuario cree que
la lista se rompió.

**El Inbox es estructuralmente más pobre.** Una superficie mixta solo puede
filtrarse por lo que todos los tipos tienen, así que cae a `COMMON_FACETS` — Type
y Owner. Declaradas, no derivadas de los resultados del momento: una faceta que
aparece y desaparece según las filas es una sorpresa. El slideout lo dice en vez
de esconderlo.

### Lo que ya estaba especificado y solo usé

`FILTERS_SPEC.md` define los chips: arriba de la lista, X por chip para quitarlo
sin abrir el slideout, "Clear all N". Y el slideout va draft-then-apply — abrir
toma una foto, los cambios mutan el borrador, Apply lo confirma, Cancel lo
descarta.

---

## Preguntas abiertas

1. **~~¿"Model" puede aparecer en la superficie de registros?~~ Respondida por la
   investigación: nadie agrupa por namespace de schema de cara al usuario.** El
   catálogo ya no agrupa por modelo; lo deja como metadato en la fila.

2. **Tipos sin permiso: ¿bloqueados o invisibles?** Los sigo mostrando con
   candado, y ahora sé que **voy contra la corriente**: Salesforce y Dataverse
   filtran, y la imposibilidad de HubSpot de ocultar un objeto sin acceso fue
   levantada por su comunidad como defecto. Lo mantengo porque el perfil ya
   muestra un registro gobernado en vez de esconderlo, y un catálogo que oculta un
   tipo responde "qué tiene este tenant" con algo falso. **Pero es decisión de
   Michael, no mía** — y los tres claims sobre ACLs de ServiceNow que habrían
   zanjado esto fueron refutados, así que no hay fuente primaria en ninguna
   dirección.

3. **Tabs del detalle por tipo.** Sin cambios: `CLAUDE.md` dice que el detalle
   lleva tabs específicos por tipo. Los cuatro actuales son genéricos y por plano
   de conocimiento. La respuesta natural es que los defina el modelo.

## Lo que no construí

**Repair orders**, que se descartaron explícitamente. Los tipos de dealership del
registro son vehicles, dealerships, test drives y trade-ins.
