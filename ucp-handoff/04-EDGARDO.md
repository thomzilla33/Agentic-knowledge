# 04 · Review de Edgardo Sierra

**Fuente:** transcripción *"Diseño de Administración y Permisos"*, 2026-09-03.
**Alcance:** el review es del **Admin Console**, no del UCP. De sus 40 observaciones, **una sola cambió algo del UCP** — y ya está resuelta. Las demás tocan el UCP de lejos o no lo tocan.

---

## Lo único que cambió el UCP

### "Activity siempre déjalo de último" → nos hizo ver que teníamos dos vistas con el mismo nombre

Edgardo habla del **audit log** — el componente de auditoría que quiere idéntico en todas las superficies. Nuestra pestaña Activity es otra cosa: comunicaciones, notas, eventos y tareas de una entidad.

**Resultado:** nuestra vista se queda como **Activity**; la de gobernanza se renombra a **Audit**. Registrado en ARP-1407 (open question) y ARP-1415 (decisions log). **Cerrado.**

---

## Lo que aplica al UCP más adelante

### El audit log se diseña una vez y se replica idéntico

> *"Se debe ver exactamente igual en todos lados. Entonces lo diseñas en uno y ya se replica para todos lados."*

El día que una entidad tenga vista de auditoría, **no se diseña de nuevo** — se monta el mismo componente. Lo único que cambia por contexto son los filtros que no se pueden quitar.

Sus columnas fijas: tiempo · usuario · tipo de acción · recurso · descripción · resultado · **fuente**. La fuente importa porque no todo viene de la UI — puede venir por API.

**El UCP no tiene vista de auditoría en esta entrega.** Esto es información para cuando la tenga, no un pendiente.

---

## Tres cosas que parecían tocar el UCP y no lo hacen

> Las marqué como riesgo alto en una primera pasada. Al contrastarlas contra lo que efectivamente quedó publicado en los tickets, ninguna de las tres sostiene ese peso. Lo dejo escrito para que nadie las vuelva a levantar como bloqueante.

### Permisos que se entran por la app, en dos niveles

> *"Antes de yo poder darle permiso a usted sobre el Data Studio, alguien le tiene que haber dado acceso al Data Studio."*

**Por qué no es un problema:** nuestros companions describen qué ve cada rol **dentro** del UCP. Si además hace falta un permiso previo de acceso al módulo, eso es una línea de prerrequisito en los companions, no un rediseño del modelo de roles.

### Los privilegios no son jerárquicos

> *"Usted puede ser Tester de un agente y no tener permiso de chatear con él en el día a día."*

**Por qué no es un problema:** los Role Templates de ARP-1412 son conjuntos declarados, no una escalera —

> Sales (Customers y Companies) · Service (los tres) · People Ops (Employees) · Read-only (los tres, sin crear)

People Ops no se solapa con Sales. Nada hereda de nada. El punto de Edgardo ya está satisfecho.

### *Who has access* por recurso

> *"Google tiene eso y se llama Who has access… son funciones que están muy escondidas, pero son muy importantes para un administrador."*

**Por qué no es un problema:** los tres companions excluyen permisos a nivel de registro individual de forma explícita, bajo *Not in this release*. Es un no-objetivo decidido, no un olvido. Sigue siendo urgente **para el Admin Console**, que es de lo que él estaba hablando.

---

## Resumen

| Observación | Relación con el UCP |
|---|---|
| Activity vs audit log | **Cerrada** — ARP-1407 y ARP-1415 |
| Audit log se diseña una vez | Aplica cuando el UCP tenga vista de auditoría. No la tiene |
| Permisos por app | Una línea de prerrequisito, si aplica |
| Privilegios no jerárquicos | Ya satisfecho |
| Who has access por recurso | No-objetivo declarado del UCP. Urgente para el Admin Console |
| Las otras 35 observaciones | Admin Console. Nada que ver con el UCP |

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
