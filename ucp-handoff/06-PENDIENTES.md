# 06 · Pendientes

Ordenado por lo que bloquea a más gente.

---

## A. Una pregunta para el equipo, y un rename

Al describir estas operaciones se descubrió algo que cambia el cuadro: **ARP-520 no es un duplicado vacío de ARP-468. Tiene 7 sub-features propias**, y son un desglose más limpio que las 8 de ARP-468.

### A1. ¿Cuál de los dos está vivo, ARP-468 o ARP-520?

| ARP-468 — `Selected for Development` | ARP-520 — `{Test}`, Backlog |
|---|---|
| ARP-502 Role + Entity Layout Resolution | ARP-521 Entity Profiles & Canvas Standard |
| ARP-503 Widget Library Drawer | ARP-522 Widget Runtime & Standard Widgets |
| ARP-505 Layout Versioning, Rollback, Audit | ARP-523 Admin Layout Builder & Guardrails |
| ARP-506 Industry Pack Framework & Installer | ARP-524 Internal Widget Catalog & Safe Activation |
| ARP-507 RBAC/ABAC Enforcement | ARP-525 Permissions Enforcement |
| ARP-508 Drive/Folder & Records Widget | ARP-526 Versioning, Rollback, Auditability |
| ARP-509 Automotive Pack v1 | ARP-527 Industry Pack Framework v1 + Reference Pack |
| ARP-510 Contact List facelift | — |

Tres pares son casi el mismo ticket con mejor nombre: 507↔525, 505↔526, y 506+509↔527. El resto es inferencia — hay que leerlos para confirmar el mapeo.

**Uno de los dos sobra, pero no está claro cuál.** Si ARP-520 es la versión buena, lo que corresponde es quitarle el `{Test}` y cerrar ARP-468 — no al revés. **Es de quien los creó.**

> ⚠️ **No cerrar ARP-520 sin leer sus 7 hijos.** Una versión anterior de este documento lo recomendaba, tratándolo como un duplicado de prueba. Es incorrecto: cerrarlo cerraría el mejor desglose de los dos.

### A2. Promover ARP-468 a Boulder — vale discutirlo, no es forzoso

El argumento original era que *"un Feature no puede contener Features"*, y por lo tanto ARP-468 no podía representar sus diez bloques. Cierto pero irrelevante: **esos bloques ya existen como `Version`, que es perfectamente legal.** No hay nada roto que arreglar.

La pregunta real es de **tamaño**: si "Widget Runtime", "Admin Layout Builder" y "Permissions Enforcement" son cada uno del porte de un Feature, entonces merecen serlo y el padre debería ser un Boulder. Es un juicio del equipo.

### A3. Renombrar ARP-375 — ✅ hecho el 2026-09-11

ARP-375 pasó de «Unified Contact Profile» a **«Universal Entity Profile»**, igualando el nombre que ARP-468 y ARP-520 ya usaban. Ver la sección de nomenclatura en `02-DECISIONES.md`.

**Lo que queda de esto:** el cuerpo de ARP-375 todavía llama al módulo **«UCIH»**, un acrónimo que no aparece en ningún otro lado. No lo toqué — es texto que escribió alguien más y puede significar algo que desconozco. Vale preguntarlo.

---

## B. Lo que bloquea la estimación

| Qué | Ticket | Quién lo cierra |
|---|---|---|
| **Diseño del campo de escritura de notas.** El prototipo cubre cómo se leen, no cómo se escriben | [ARP-1416](https://aims-os.atlassian.net/browse/ARP-1416) | Diseño |
| **Tareas pendientes en el hilo: ¿mezcladas o fijadas arriba?** Único TBD que cambia el diseño de una pestaña mandatoria | [ARP-1415](https://aims-os.atlassian.net/browse/ARP-1415) | PM + diseño |
| **Los 21 están sin estimar** | todos | El equipo |
| **Intelligence y Knowledge** — el motor y el pipeline no existían en el árbol; ahora sí, y las 4 decisiones que bloquean tienen ticket | [ARP-1408](https://aims-os.atlassian.net/browse/ARP-1408) y sus hijos | **Lex y JJ** — ver el [brief](https://claude.ai/code/artifact/f7450401-5cd5-44ba-88b5-8a26a2a7608a) |

---

## C. Lo que hay que confirmar con otras personas

### Con quien llevó adelante el prototipo en Vercel

1. **Sources vs Drives.** El Overview y la pestaña Knowledge usan dos nombres para el mismo plano. El canon dice que va `Sources`. ¿Fue descuido o hay una razón? → ahora es [ARP-1425](https://aims-os.atlassian.net/browse/ARP-1425).
2. **`Ask about this entity` vs `Ask about this company`.** Nuestra variante por tipo desapareció. ¿Simplificación deliberada?
3. **El estado `Held`.** ¿Es política de gobernanza o comportamiento de demo? → ahora es [ARP-1423](https://aims-os.atlassian.net/browse/ARP-1423).
4. **Policies y Assets.** Aparecen como tipos en el rail, fuera del alcance que cerramos. ¿De dónde salieron y quién los pidió?

### Con Edgardo Sierra

5. **Nada bloqueante.** Su review es del Admin Console. Lo único que tocaba el UCP era el choque de nombres entre su *audit log* y nuestra pestaña Activity, y ya está resuelto (ARP-1407, ARP-1415). Ver `04-EDGARDO.md` para por qué los otros tres puntos que parecían aplicar no aplican.
6. **Para cuando el UCP tenga vista de auditoría:** el componente se diseña una vez y se replica idéntico — no se rediseña por superficie. No está en esta entrega.

### Con Michael

7. **Ocultar vs bloquear para tipos que el rol no puede leer.** La política del tenant existe en los tickets, pero no está decidida cuál es la default.
8. **`StudyWidget` y `ConnectionsContent` están duplicados** con `pm-thomas-universal-profile.tsx`.
9. **`record-header.tsx` fue modificado** mientras había cuatro ramas `ds/record-header-*` activas. Posible colisión.
10. **`Request access` es un stub.** El CTA existe; el flujo no.

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
