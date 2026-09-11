# 06 · Pendientes

Ordenado por lo que bloquea a más gente.

---

## A. Tres operaciones sobre Jira que **no ejecuté**

Las tres tocan tickets que ya existían y que otros pueden estar usando. Crear tickets nuevos es aditivo y reversible; cambiarle el tipo o cerrar el de otro, no. Quedan propuestas, no hechas.

### A1. Promover [ARP-468](https://aims-os.atlassian.net/browse/ARP-468) de Feature a Boulder

**Por qué:** ARP-468 tiene diez bloques del tamaño de Feature adentro (canvas, catálogo de widgets, registro de tipos, instalador de packs, y seis más). En la jerarquía de ARP un `Feature` solo puede contener `Version`s — **no otros Features**. Como está, esos diez bloques no se pueden representar.

**Qué implica:** cambiar el issue type de ARP-468 a `Boulder`, sacarlo de debajo de ARP-375, y partir su contenido en unos 8 Features.

**Riesgo:** es un ticket en *Selected for Development*. Alguien puede estar planificando contra él.

### A2. Cerrar [ARP-520](https://aims-os.atlassian.net/browse/ARP-520)

Es `{Test} UCP v2 — Universal Entity Profile Foundation`, duplicado exacto de ARP-468 con prefijo de prueba. Está en Backlog bajo ARP-375. **Ensucia el árbol del Boulder.**

**Riesgo:** bajo, pero es el ticket de alguien. Confirmar de quién antes de cerrarlo.

### A3. Renombrar ARP-375 de "Unified **Contact** Profile" a "Unified **Entity** Profile"

**Por qué:** el módulo dejó de ser de contactos. El prototipo vigente ya lista pólizas y activos. El nombre viejo va a hacer que alguien pregunte por qué hay vehículos en el "perfil de contacto".

**Riesgo:** mínimo — es solo el título. Pero es el Boulder del que cuelga todo.

---

## B. Lo que bloquea la estimación

| Qué | Ticket | Quién lo cierra |
|---|---|---|
| **Diseño del campo de escritura de notas.** El prototipo cubre cómo se leen, no cómo se escriben | [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) | Diseño |
| **Tareas pendientes en el hilo: ¿mezcladas o fijadas arriba?** Único TBD que cambia el diseño de una pestaña mandatoria | [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) | PM + diseño |
| **Los 15 están sin estimar** | todos | El equipo |

---

## C. Lo que hay que confirmar con otras personas

### Con quien llevó adelante el prototipo en Vercel

1. **Sources vs Drives.** El Overview y la pestaña Knowledge usan dos nombres para el mismo plano. El canon dice que va `Sources`. ¿Fue descuido o hay una razón? *(está escrito como bloqueante en ARP-1419)*
2. **`Ask about this entity` vs `Ask about this company`.** Nuestra variante por tipo desapareció. ¿Simplificación deliberada?
3. **El estado `Held`.** ¿Es política de gobernanza o comportamiento de demo? De la respuesta depende ARP-1418 y ARP-1420.
4. **Policies y Assets.** Aparecen como tipos en el rail, fuera del alcance que cerramos. ¿De dónde salieron y quién los pidió?

### Con Edgardo Sierra

5. **Permisos por app, en dos niveles** — *"antes de darte permiso sobre el Data Studio, alguien te tiene que haber dado acceso al Data Studio"*. Nuestros tres companions asumen permisos directos sobre pestañas y widgets. Si el modelo real es de dos niveles, **los tres necesitan una pasada**.
6. **Privilegios no jerárquicos.** Los Role Templates que escribí (Sales, Service, People Ops, Read-only) están redactados como acumulativos. Confirmar contra el modelo de backend.
7. **Who has access por recurso.** Un registro es un recurso. No está en ningún ticket nuestro.

> Los puntos 5 y 6 son los de mayor riesgo del paquete: **ponen en duda el modelo de roles de ARP-1412, ARP-1417 y ARP-1420.** Vale hablarlos antes de que ingeniería construya permisos.

### Con Michael

8. **Ocultar vs bloquear para tipos que el rol no puede leer.** La política del tenant existe en los tickets, pero no está decidida cuál es la default.
9. **`StudyWidget` y `ConnectionsContent` están duplicados** con `pm-thomas-universal-profile.tsx`.
10. **`record-header.tsx` fue modificado** mientras había cuatro ramas `ds/record-header-*` activas. Posible colisión.
11. **`Request access` es un stub.** El CTA existe; el flujo no.

---

## D. Lo que quedó sin hacer y no bloquea

- **El PR en el repo del design system.** Esta sesión nunca logró permisos de push a `cachilupis/aims-os-design-system` — verifiqué cuatro rutas, todas cerradas. El trabajo llegó igual por otra vía (está en `main` y desplegado en Vercel), así que el PR dejó de ser necesario. Si alguien quiere el historial limpio, los patches están en `ucp-ds-screens/`.
- **Suscripción de watch en los artifacts.** El gateway de esta sesión devuelve 404 al registrarla. Nadie va a ser notificado si alguien comenta las páginas publicadas.

---

## E. Si alguien quiere seguir construyendo el prototipo

Leer `05-REPLICA.md` primero, sobre todo:
- las reglas del design system que hacen fallar el ratchet en el pre-push
- que `viewerScopes.ts` es el **único** dueño del permiso del viewer — duplicarlo reintroduce el bug del valor enmascarado en una superficie y visible en otra
- la geometría de `MenuItem`, que es lo que más tiempo cuesta redescubrir
