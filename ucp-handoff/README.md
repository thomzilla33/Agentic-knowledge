# UCP — Traspaso completo

**Autor:** Thomas González · **Fecha:** 2026-09-11 · **Motivo:** vacaciones; el equipo continúa sin mí.

Este paquete contiene todo lo necesario para tomar el Unified Contact Profile donde quedó: qué está construido, dónde vive, por qué cada decisión se tomó como se tomó, qué tickets existen en Jira y qué queda abierto.

---

## Lo primero que hay que saber

**El prototipo vigente no es nuestro build de GitHub Pages.** Está desplegado en Vercel y alguien lo llevó más adelante que nuestra rama:

> https://aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts

Los quince tickets de Jira apuntan ahí como **Design Reference**. Nuestro build en Pages queda como registro histórico del origen, no como referencia de construcción. El detalle de qué cambió está en [`01-ESTADO.md`](01-ESTADO.md).

---

## Índice

| Documento | Qué contiene | Para quién |
|---|---|---|
| [`01-ESTADO.md`](01-ESTADO.md) | Dónde está todo hoy: prototipos, repos, ramas, Jira. Qué es real y qué es mockeado. Las dos inconsistencias sin resolver. | Todos — empezar acá |
| [`02-DECISIONES.md`](02-DECISIONES.md) | Cada decisión de producto con su razón. Incluye las que se revirtieron y por qué. | PM y diseño |
| [`03-TICKETS.md`](03-TICKETS.md) | Los 15 tickets creados, con su clave de Jira, su nivel en la jerarquía y por qué cada uno existe. | Ingeniería y PM |
| [`04-EDGARDO.md`](04-EDGARDO.md) | El review de Edgardo Sierra: 40 observaciones, de las que **una sola** cambió algo del UCP. Incluye por qué tres que parecían aplicar no aplican. | PM |
| [`05-REPLICA.md`](05-REPLICA.md) | Cómo reconstruir el prototipo desde cero en otra rama: repo, patches, build, deploy, y las reglas del design system con las que vas a chocar. | Ingeniería y diseño |
| [`06-PENDIENTES.md`](06-PENDIENTES.md) | Lo que queda abierto, con nombre y apellido de quién puede cerrarlo. | Quien quede a cargo |

---

## Resumen en cinco líneas

1. El UCP tiene cuatro pestañas fijas — **Overview · Activity · Intelligence · Knowledge** — más módulos de industria al final. Eso es un contrato de plataforma, no una pantalla.
2. La entrega de hoy (**UCP v2.0**) cubre Contacts, Employees y Companies: listado, paginación, creación por stepper, y las dos pestañas mandatorias.
3. Intelligence y Knowledge quedan marcados **`[Next Round]`** (UCP v2.1) y ya están creados para que el contrato se vea completo.
4. Los 15 tickets están en Jira bajo el Boulder **ARP-375**, en estado Backlog y sin estimar.
5. Queda **una pregunta abierta para el equipo** — cuál de ARP-468 o ARP-520 está vivo — y un rename recomendado. Están en [`06-PENDIENTES.md`](06-PENDIENTES.md).
