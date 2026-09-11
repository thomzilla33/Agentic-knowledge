# 04 · Review de Edgardo Sierra

**Fuente:** transcripción *"Diseño de Administración y Permisos"*, 2026-09-03.
**Alcance:** el review es del **Admin Console**, no del UCP. Pero cuatro de sus observaciones cambian cómo hay que construir el UCP, y una es la que resolvió el nombre de la pestaña Activity.

---

## Lo que toca directamente al UCP

### 1. "Activity siempre déjalo de último" → **no aplica a nuestra pestaña Activity**

Edgardo habla del **audit log** — el componente de auditoría que quiere idéntico en todas las superficies. Nuestra pestaña Activity es otra cosa: comunicaciones, notas, eventos y tareas de una entidad.

**Consecuencia:** son dos vistas distintas que hoy comparten nombre. Recomendación registrada en ARP-1407 y ARP-1415: **nuestra vista se queda como Activity; la de gobernanza se renombra a Audit.**

### 2. El audit log se diseña una vez y se replica idéntico

> *"Se debe ver exactamente igual en todos lados. Entonces lo diseñas en uno y ya se replica para todos lados."*

**Consecuencia para el UCP:** cuando la entidad tenga su vista de auditoría, **no se diseña de nuevo**. Se monta el mismo componente. Lo único que cambia por contexto son los filtros que no se pueden quitar.

Sus columnas fijas: tiempo · usuario · tipo de acción · recurso · descripción · resultado · **fuente**. La fuente importa porque no todo viene de la UI — puede venir por API.

### 3. Los permisos se entran **por la app**, no directo

> *"Antes de yo poder darle permiso a usted sobre el Data Studio, alguien le tiene que haber dado acceso al Data Studio."*

**Consecuencia para el UCP:** el modelo de roles de nuestros tres companions asume permisos directos sobre pestañas y widgets. Si el modelo real es de dos niveles — acceso a la app, y después permisos dentro — los companions necesitan una pasada. **No está resuelto.**

### 4. Los privilegios no son jerárquicos

> *"Usted puede ser Tester de un agente y no tener permiso de chatear con él en el día a día."*

No heredan como viewer → editor → owner. Son mini-roles que se solapan o no.

**Consecuencia para el UCP:** los Role Templates que escribí (Sales, Service, People Ops, Read-only) están redactados como si fueran acumulativos. Hay que revisarlos contra el modelo real de backend.

### 5. Recursos: *Who has access*

> *"Google tiene eso y se llama Who has access. Y Amazon también lo tiene. Y normalmente son funciones que están muy escondidas, pero son muy importantes para un administrador."*

Marcado por él como lo más urgente — el backend ya viene en camino desde el equipo de data.

**Consecuencia para el UCP:** un registro es un recurso. En algún momento va a necesitar su propio *quién tiene acceso a esto*. **No está en ningún ticket nuestro.**

---

## Qué ticket absorbe cada cosa

| Observación | Dónde quedó |
|---|---|
| Activity vs audit log | ARP-1407 (open question) y ARP-1415 (decisions log) |
| Audit log se diseña una vez | **Sin dueño** — es del Admin Console |
| Permisos por app, dos niveles | **Sin dueño** — invalida parcialmente ARP-1412, ARP-1417, ARP-1420 |
| Privilegios no jerárquicos | **Sin dueño** — mismo impacto |
| Who has access por recurso | **Sin dueño** |
| Todo lo demás (35 observaciones) | Admin Console. Fuera del alcance del UCP |

> **Lo más importante de esta sección:** tres de las cinco observaciones que tocan el UCP **no tienen ticket**. Y dos de ellas ponen en duda el modelo de roles que escribí en los tres companions. Quien tome esto debería hablar con Edgardo antes de que ingeniería construya los permisos.

---

## El review completo, como lo dio

Agrupado por la superficie que estaba mirando. ⚑ marca lo que él mismo llamó *funcionalidad cruzada* — tiene que existir en dos lugares o no sirve.


## OV · Overview
_Lo aprobó casi entero: integraciones conectadas, usuarios activos y billing se quedan como están._

**OV-1.** Agregar al Overview qué apps están activas, junto a integraciones y usuarios.
> "Aquí te diría poner, de pronto, algo de estudios. ¿Qué estudios están activos?"


## US · Lista de usuarios
_Dos cambios de fondo — la nomenclatura y los tipos de usuario — y tres de layout._

**US-1.** Renombrar la columna **Role** a **User type**. No es un rol y confundirlos rompe el modelo.
> "Tienes que tener en cuenta algo aquí y es que esto no es un role. Esto es un user type."

**US-2.** Limitar los user types del tenant a `Admin`, `Owner` y `Member`. `Super Admin` queda reservado al back office interno.
> "El Super Admin es reservado para nosotros… en nuestro propio Back Office vamos a poder crear Super Admin."

**US-3.** Agregar acciones rápidas por usuario en un menú de tres puntos: resetear contraseña, desactivar usuario.
> "No los tenés que poner aquí como botones, sino puede ser un menú de tres puntos acá."

**US-4.** Agregar la columna **Departamento**.

**US-5.** Aprovechar el espacio vacío: tarjetas, o columnas individuales (nombre, correo) en vez de todo metido en un bloque.
> "No me parece mal que la lista de usuarios sea una tabla, pero aprovechemos mejor el espacio para que no se vea tan vacío."


## PF · Perfil de usuario
_La sección más reescrita. El cambio estructural es que a los permisos se entra por la app, no directo._

**PF-1.** Entrar a los permisos **por la app**: primero se otorga acceso a la app, después se dan permisos dentro de ella.
> "Antes de yo poder darle permiso a usted sobre el Data Studio, alguien le tiene que haber dado acceso al Data Studio."

**PF-2.** Separar **ver** permisos de **otorgarlos**: un tab de solo lectura y una acción aparte que abre la edición.
> "Yo por permisos puedo controlar que usted puede ver los permisos de un usuario, pero usted no le puede cambiar los permisos."

**PF-3.** En la vista de solo lectura, un switcher entre mostrar solo los otorgados y mostrar todos.
> "Puede ser un switcher que diga como mostrar solamente permisos o mostrar todos los permisos."

**PF-4.** En la vista de edición, mostrar de dónde viene cada permiso pero permitir otorgarlo directo al usuario, sin tocar el rol.
> "Yo estoy teniendo el permiso de dos lados. Y ya el motor se encarga de resolver. En caso de que a mí me quiten el rol, pues yo continúo con mi permiso."

**PF-5.** Al abrir una app desde el perfil, no sacar del perfil: la zona del usuario se queda y solo cambia la zona derecha, con breadcrumb.
> "No tenés que hacer como hace Jira que te saca el profile, sino que sería como que la pantalla estuviera partida."

**PF-6.** Dentro de la app: tabs de Permisos, Grupos, Roles y Activity, más las acciones Grant / Remove / Disable access.

**PF-7.** Reordenar los tabs a `Apps` · `Roles` · `Groups` · `Resources` · `Security` · `Activity`.
> "Activity siempre déjalo de último."

**PF-8.** Agregar el tab **Resources** — hoy no existe.  ⚑ **funcionalidad cruzada**

**PF-9.** Permitir que el administrador edite la información del perfil. Hoy no hay forma.
> "Te falta es una forma de editar esta información. Todo el perfil del usuario es editable por el administrador."

**PF-10.** Ampliar las acciones del usuario: suspender acceso, remover, resetear contraseña, **resetear MFA** (distinto de la contraseña) y actualizar usuario.

**PF-11.** En el tab de roles y grupos, poder agregar y quitar desde el perfil, con el catálogo de roles disponibles.
> "En vez de yo tener que irme al rol, entrar a miembros y removerte allá, yo aquí digo sáqueme de ese rol."


## RL · Roles
_Aprobó la estructura. Lo que falta es la trazabilidad de quién otorgó qué, y el mismo split de lectura y edición._

**RL-1.** En los miembros del rol, mostrar **quién** dio el acceso y **cuándo**.
> "¿Quién le dio acceso a este rol y cuándo? Aquí directamente."

**RL-2.** Botón de quitar al miembro del rol, además de desactivarlo.

**RL-3.** Mismo split de solo lectura y edición para los permisos del rol.

**RL-4.** Poder editar el nombre y la descripción del rol, arriba a la derecha.

**RL-5.** Cambiar los tabs de permisos por tarjetas pequeñas.
> "En vez de ser tabs, los puedes poner tarjeticas como estas, un poquito más chiquitas."

**RL-6.** Agregar el tab de auditoría — el mismo componente de todas partes.  ⚑ **funcionalidad cruzada**

**RL-7.** El Overview del rol queda a criterio: no aporta mucho.
> "Realmente aquí no es tan importante el tener Overview."


## GR · Grupos
_Lo mismo que roles, más el tab de recursos._

**GR-1.** Mostrar quién dio el acceso al grupo y cuándo.

**GR-2.** Permitir **desactivar temporalmente**, además de remover.
> "Para no tener que quitarlo, pues puede ser como desactivarlo temporalmente."

**GR-3.** Tabs del grupo: `Members` · `Resources` · `Settings` · `Activity`.  ⚑ **funcionalidad cruzada**

**GR-4.** Poder editar el nombre y la descripción del grupo.


## AP · Apps y estudios
_Su tesis: los estudios son aplicaciones independientes unidas por un router, y la UI debería sentirse así._

**AP-1.** Evaluar renombrar **Estudios** a **Apps**.
> "Yo creo que la palabra estudios va a generar confusión."

**AP-2.** Ícono propio por app y más protagonismo visual, para que se sientan aplicaciones independientes.
> "Que se sienta como una serie de apps independientes que las unieron en un solo enrutador."

**AP-3.** En el perfil de la app, ver **quién tiene acceso** — el espejo de la vista del usuario.  ⚑ **funcionalidad cruzada**
> "Así como yo puedo ver, como usuario, a qué estudios tengo acceso. En la vista de estudios debería ver quiénes tienen acceso a ese estudio."

**AP-4.** Diferenciar **Disable Studio** (global, para todo el mundo) de remover el acceso de un usuario.
> "Este es general, o sea, activárselo a todo el mundo. Y el otro es removerle el acceso al estudio a un usuario."


## AU · Audit log
_Se define una vez y se replica en todas las superficies. Lo único que cambia por contexto son los filtros que no se pueden quitar._

**AU-1.** Columnas fijas: **tiempo, usuario, tipo de acción, recurso, descripción, resultado y fuente**.

**AU-2.** Incluir **fuente**. No todo va a venir de la UI.
> "La fuente no necesariamente va a ser solamente UI. Puede haber sido por API, por ejemplo."

**AU-3.** Detalle por evento para auditoría forense: permiso otorgado, User ID, recurso específico, IP, session ID y el antes/después.
> "Bueno, fue Sebastián, pero este IP no corresponde normalmente al IP de él, entonces probablemente le secuestraron eso."

**AU-4.** Filtros fijos: recurso, acción, usuario, tiempo, resultado y fuente. La descripción se busca con el buscador.

**AU-5.** Poder leer la descripción completa, no solo en el tooltip.

**AU-6.** Diseñarlo una sola vez y replicarlo idéntico.
> "Se debe ver exactamente igual en todos lados. Entonces lo diseñas en uno y ya se replica para todos lados."

**AU-7.** Botón de export.


## RS · Resources
_No existe todavía y es lo único que marcó con urgencia: el backend ya viene en camino desde el equipo de data._

**RS-1.** Nuevo tab **Resources** en usuarios y grupos: tipo de recurso, nombre, quién dio el acceso, cuándo, y un botón de remover.
> "Esto hay que retomarlo, parce, para que no se olvide, porfa, porque ya el equipo de data está terminando la parte del backend para controlar eso."

**RS-2.** **Who has access** por recurso, como vista separada del Share.
> "Google tiene eso y se llama Who has access. Y Amazon también lo tiene. Y normalmente son funciones que están muy escondidas, pero son muy importantes para un administrador."

**RS-3.** En el agente, una vista de administración fuera del Playground: Activity, Who has access, Settings y versiones.


## CO · Compartir recursos
_El modelo de privilegios ya está definido por backend. Lo que falta es que la UI de compartir lo refleje._

**CO-1.** Permitir seleccionar **varios privilegios** al compartir, no uno solo.
> "Lo importante es que yo puedo seleccionar múltiples privilegios. Yo puedo decirle usted puede editar y puede ver."

**CO-2.** Los privilegios **no son jerárquicos**. No heredan como viewer → editor → owner; son mini-roles que se solapan o no.
> "Usted puede ser Tester de un agente y no tener permiso de chatear con él en el día a día."

**CO-3.** Los privilegios los crea AIMS OS por debajo. El usuario solo los ve por nombre, con una explicación de qué habilitan.
> "Él no tiene por qué saber qué permisos le está dando. Aquí le podemos poner que diga con este permiso puedes hacer eso."

**CO-4.** Descripciones de permisos que no sean superfluas, con un slide-out de detalle.
> "Esta plataforma no es para los administradores… la industria automotriz no son técnicos, es alguien que le pusieron a administrar algo."
