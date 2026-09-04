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
