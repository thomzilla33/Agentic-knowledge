# 02 · Decisiones y por qué

Cada decisión con la razón que la sostiene. Si alguien quiere revertir una, acá está el argumento que tiene que derribar.

---

## A. Arquitectura del perfil

### El tab strip es un contrato, no una pantalla

Se define **una vez** y lo recibe toda entidad publicada: `Overview · Activity · Intelligence · Knowledge` + módulos de industria al final.

**Por qué:** la alternativa es que alguien decida a mano qué pestañas tiene cada tipo. Con tres tipos se aguanta; con vehículos, dealerships, pólizas, activos y lo que traiga cada industria, no. Y produce perfiles que se navegan distinto según el tipo, que es exactamente el problema que un *perfil unificado* existe para resolver.

**Consecuencia:** agregar una quinta pestaña base es un cambio de contrato, no una feature. Y esto **bloquea ARP-468**: no se puede construir el canvas de widgets sin saber dónde aterriza.

### Overview es la única pestaña personalizable

Las otras tres son fijas.

**Por qué:** Overview responde *"¿qué debería mirar de esto?"*, y eso cambia según el trabajo de cada quien. Activity, Intelligence y Knowledge responden preguntas con una sola respuesta correcta — qué pasó, qué infirió la IA, de qué estamos seguros. Personalizarlas solo produce versiones incompletas de la verdad.

### Los módulos de industria van después de Knowledge, nunca intercalados

**Por qué:** si un pack puede insertarse entre las base, el usuario que trabaja dos industrias ve dos navegaciones distintas. El orden estable vale más que la relevancia local.

### Cada widget de Overview carga y falla por su cuenta

**Por qué:** un canvas que espera al widget más lento se siente roto aunque funcione. Y un widget que falla no debe llevarse la pantalla: el usuario todavía puede trabajar con el resto.

### El widget propio del tipo va antes que los de estudio

**Por qué:** responde *"qué es esto"*. Eso se lee antes que *"qué tan seguros estamos de esto"*.

---

## B. Nomenclatura

### Activity (esta vista) vs Audit (la de gobernanza)

Se llaman distinto porque son cosas distintas, con público distinto.

| | Activity | Audit |
|---|---|---|
| Responde | ¿Qué está pasando con esta entidad? | ¿Quién cambió qué, cuándo, desde dónde? |
| Lo lee | quien trabaja el registro | compliance y seguridad |
| Contiene | comunicaciones, notas, eventos, tareas | eventos de sistema con IP, session ID, antes/después |

**Por qué no se renombró Activity a Timeline, History o Log:** las **tareas pendientes** rompen todos los candidatos en pasado. Una tarea asignada no es historia, es trabajo. Un nombre en pasado miente sobre un cuarto de su contenido.

**Lo que dijo Edgardo** — *"Activity siempre déjalo de último"* — se refiere al **audit log**, no a esta vista. Confirmado leyendo el contexto de la transcripción. La recomendación es renombrar **esa** a Audit para que dejen de colisionar.

### `Next Best Action` (NBA), no `AI Read`

**Por qué:** *AI Read* describe quién lo produjo. *Next Best Action* describe qué hacer con ello. El usuario no necesita saber que lo escribió un modelo; necesita saber qué sigue.

**Caso borde deliberado:** sin next best action, **no hay card**. Ni vacía ni con texto de relleno. La ausencia es la señal — si hubiera algo que hacer, estaría ahí.

### El tag del tipo `person` dice **Customer**, no "Person"

**Por qué:** describe qué es el registro en el negocio, no qué clase de objeto es en el modelo de datos.

### Sources es el plano; Source Drives es lo que lo llena

Los tres planos del canon: **Truth** (100%, facts verificados) · **Sandbox** (~80%, claims pendientes) · **Sources** (~60%, documentos crudos).

**Por qué importa:** el prototipo vigente los confunde — el Overview dice *Sources* y la pestaña dice *Drives*. El canon manda: el plano es Sources, los Source Drives son las carpetas y documentos de las unidades compartidas de la empresa que lo alimentan. Ver `01-ESTADO.md`.

---

## C. Listado y filtros

### Los filtros son por tipo, con contadores

Cada tipo publica su propio juego de facetas: un customer filtra por cuenta, un empleado por departamento, una compañía por industria. Se decide por **frecuencia de uso**, según `docs/FILTERS_SPEC.md`.

### Una opción con cero resultados se deshabilita, no desaparece

**Por qué:** una opción que desaparece le dice al usuario que no existe. Una deshabilitada con contador en cero le dice que existe y que su filtro actual la vació. Lo segundo es información; lo primero es ruido.

### Cambiar de tipo limpia los filtros y avisa

**Por qué:** las facetas no son las mismas entre tipos. Arrastrar el filtro de "departamento" a una lista de compañías produce resultados que nadie pidió. Se limpian — y se dice que se limpiaron, para que el usuario no crea que el filtro sigue puesto.

### Nunca estado vacío y paginación a la vez

Regla del design system. Son dos mensajes contradictorios: *"no hay nada"* junto a *"recorré las páginas"*.

### El CTA nombra lo que va a crear

*Create New Customer / Employee / Company*, siguiendo el tipo activo. No un genérico *Create*.

---

## D. Permisos y gobernanza

### Un registro gobernado se lista, marcado. No se esconde

**Por qué:** la existencia del registro rara vez es el secreto; sus valores sí. Esconderlo le impide al usuario saber que existe y pedir acceso. Marcarlo le dice qué permiso lo abriría.

### Deshabilitado con tooltip, no oculto

Ocultar se reserva a **tres casos**: compras, facturación, y acciones irreversibles a nivel plataforma.

> **Esta decisión revierte una anterior mía.** Yo había argumentado que el botón de crear debía ocultarse sin permiso, *"porque crear no es una acción que convenga anunciar a quien no puede hacerla"*. Es incorrecto: crear un registro no es ninguno de los tres casos. La auditoría de tickets lo detectó y se corrigió en ARP-1411 y ARP-1412. **Si alguien vuelve a proponer ocultarlo, este es el argumento que tiene que derribar.**

### Los textos de tooltip se escriben una vez

Están en ARP-1412 y ARP-1417. **Por qué:** sin un texto canónico, cada desarrollador inventa el suyo y la plataforma termina con cinco redacciones para lo mismo.

### El permiso que no se puede verificar se traduce a lo que el usuario ve

Nunca `deny by default` como criterio de aceptación. QA no puede construir una prueba con jerga de seguridad.

> ✗ *"Cuando el permiso no se puede verificar, no se ejecuta nada — deny by default."*
> ✓ *"Cuando la plataforma no logra confirmar los permisos de un usuario, el usuario no ve el contenido del registro y ve un mensaje que le explica que reintente o contacte a su administrador."*

El comportamiento es el mismo. La diferencia es que el segundo es verificable.

### Un valor gobernado se enmascara dentro del widget; el widget sigue visible

**Por qué:** esconder el widget entero le dice al usuario menos de lo que necesita. Ve el campo, ve su etiqueta, ve que está bloqueado y ve qué permiso lo abre.

> **Bug real que esto previno:** en una versión del prototipo el precio de un vehículo aparecía enmascarado en el header y **visible** en el widget comercial. La causa era que cada superficie declaraba el enmascarado por su cuenta. Se unificó: ambas derivan del mismo predicado (`viewerScopes.ts`), así que conceder el scope destapa las dos o ninguna.

---

## E. Alcance de la entrega

### Solo Contacts, Employees y Companies

**Por qué:** son los tres tipos que existen hoy en producción. Los demás llegan con la plataforma de tipos (ARP-468), y meterlos ahora obliga a construir el catálogo de tipos antes de tener un perfil que funcione.

### Intelligence y Knowledge se crean ahora aunque sean `[Next Round]`

**Por qué:** si solo existen los tickets de Overview y Activity, alguien va a construir un perfil de dos pestañas y creer que terminó. Los tickets existen para que el contrato se vea completo desde el board.

### El delivery se estructura como Features bajo el Boulder existente

No se creó un Boulder nuevo. **Por qué:** ARP-375 ya es el Boulder del UCP y ya tiene a ARP-376 (v1, Done) colgando. Un Boulder nuevo partiría la historia del módulo en dos.

**Aparte, y sin resolver:** ARP-468 y ARP-520 son dos desgloses distintos de la misma plataforma, con 8 y 7 sub-features respectivamente. Uno de los dos sobra. Si además sus bloques merecen ser Features, el padre tendría que ser un Boulder — pero eso es un juicio de tamaño, no una corrección obligatoria: hoy están como `Version`, que es legal. Ver `06-PENDIENTES.md`.

---

## F. Decisiones de interfaz menores, con su razón

| Decisión | Por qué |
|---|---|
| El header de la entidad es fijo al hacer scroll | El usuario pierde de vista de quién es el registro que está leyendo |
| Menú de fila abre hacia la izquierda | Se cortaba contra el borde derecho |
| Avatares para customers y employees; icono para compañías | Una compañía no tiene cara |
| La card de NBA es del tamaño de su texto | Una card de alto fijo con dos líneas adentro se lee como un error de layout |
| El catálogo de tipos es un dropdown con buscador, no un slide-out | Un slide-out para elegir de una lista es desproporcionado. El "ver todo" abre un modal tipo marketplace |
| "Browse all N types" fijado al pie del dropdown | La única fila que lleva a otro lado era la que había que scrollear para encontrar |
| Los estudios se llaman "estudios" (por ahora) | Edgardo propone renombrar a **Apps**. Sin resolver — ver `04-EDGARDO.md` |
