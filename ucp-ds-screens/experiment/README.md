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

## Qué cambia y por qué

**Los tabs llevan vistas guardadas, no tipos.** Un tab strip *afirma que lo que
muestra es el conjunto*; ocho tabs de cuarenta tipos no son un resumen de
cuarenta, son ocho arbitrarios, en un orden igual para todos los tenants cuando
el set es por tenant. Una vista responde "where am I?" honestamente — estoy en
**mi** vista — y está acotada por la atención de una persona, no por el schema.

**El catálogo completo vive detrás de "All entities"**, agrupado por el modelo de
Data Studio al que pertenece cada tipo, con governance status y conteos. Es la
agrupación que el schema ya tiene, no una inventada para esta pantalla.

**El tipo pasa a ser un filtro.** Que es donde el DS ya dijo que se decide el
dataset: *"Filters as the single source of truth for the dataset."*

## El bug era anterior a la escala

`Tabs` está documentado como **"Where am I?"** — navegación primaria. Los tabs por
tipo cambian qué filas se listan sin cambiar dónde estás, así que son un segundo
source of truth del dataset. Eso ya estaba mal con tres tipos; cuarenta solo lo
hace visible.

## Lo que no es solo escalamiento

Cuando el tipo deja de ser un lugar, **"todo lo de Riverbend"** se vuelve
expresable: vehicles + dealerships + customers en una lista. La vista *My open
work* del preview lista una compañía, dos customers, un vehículo y una dealership
juntos. Un tab strip no puede decir eso.

## Con 3 tipos no cambia nada

Las vistas se auto-generan una por tipo legible, así que un tenant chico ve
exactamente lo que veía antes. El cambio solo se vuelve visible cuando hace falta.

## Preguntas abiertas

1. **¿"Model" puede aparecer en la superficie de registros?** Lo usé como
   agrupación del catálogo porque es la del schema y ya carga governance. Pero
   puede ser concepto interno de Data Studio, y la agrupación de cara al usuario
   ser la Category del modelo. Es de Michael.
2. **Tipos sin permiso: ¿bloqueados o invisibles?** Los muestro con candado y el
   scope nombrado — mismo criterio que un registro gobernado. Esconderlos falsea
   lo que el tenant tiene, pero es decisión de gobernanza.
3. **Tabs del detalle por tipo.** `CLAUDE.md` dice que el detalle lleva tabs
   específicos por tipo ("Runs, Members, Triggers"). Los cuatro actuales
   (Overview · Snapshot · Activity · Drives) son genéricos y por plano de
   conocimiento. ¿Quién define los tabs de un vehicle? La respuesta natural es el
   modelo — el mismo lugar de donde salen los campos — pero hay que escribirlo.

## Lo que no construí

**Repair orders**, que se descartaron explícitamente. Los tipos de dealership del
registro son vehicles, dealerships, test drives y trade-ins.
