# UCP — vista actualizada (pantallas del Design System)

Dos pantallas de prototipo para **`cachilupis/aims-os-design-system`**, compuestas
con los componentes reales de `src/components/ui/` y `src/components/layouts/`.

Viven aquí porque esta sesión no tiene permiso de push sobre el repo del DS
(`add_repo` rechaza adjuntar repos de otro owner). El código ya está escrito,
tipado y verificado **dentro de un clon real del DS** — solo falta abrir el PR allá.

| Prototipo | `id` | Link una vez desplegado |
|---|---|---|
| UCP — Contacts | `proto-thomas-ucp-contacts` | `aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-contacts` |
| UCP — Profile | `proto-thomas-ucp-profile` | `aims-os-design-system.vercel.app/?proto=proto-thomas-ucp-profile` |

---

## Cómo aplicarlo en el repo del DS

```bash
cd ~/aims-os-ds                 # tu clon de cachilupis/aims-os-design-system
git checkout -b pm-thomas/ucp-vista-actualizada
git apply /ruta/a/ucp-ds-screens/ucp-screens.patch
npm run build                   # debe pasar con 0 errores
npm run dev                     # localhost:5173 → sidebar → Prototypes
```

El patch toca 4 archivos: los 3 nuevos en `src/screens/` y **4 líneas** en
`src/App.tsx` (2 imports + 2 entradas en `PROTOTYPE_PAGES`). Ese archivo está
protegido por CODEOWNERS, así que el PR necesita review de **@cachilupis** —
es el comportamiento esperado, no un bloqueo.

Si prefieres copiar a mano, los archivos sueltos están en `src/screens/`.

---

## Decisiones de producto que quedaron fijadas

| Decisión | Resultado |
|---|---|
| Dominio | Genérico AIMS OS — Person · Employee · Company, un solo perfil detrás de los tres |
| Overview | Tab dentro del UCP (no vista aparte), y es un `WidgetCanvasView` porque la regla del DS lo exige |
| Layout del UCP | Híbrido: tabs fijos + canvas de widgets configurable en Overview |
| Navegación del listado | Tabs por tipo → `SwitchTab` tarjetas/tabla → `Filters` |
| Acción principal | Ninguna de creación. El registro llega por ingesta; el CTA es el concierge |
| Documents | Reemplazado por **Drives** (Source Drives del catálogo de la compañía) |
| Snapshot | Nuevo tab: los hechos del registro por plano de conocimiento |

### Mapeo de variantes de `RecordHeader`

`RecordHeader` solo tiene tres formas, y se eligen por los campos que el registro
realmente tiene — no por el nombre de la entidad:

| Tipo en el UCP | Variante | Por qué |
|---|---|---|
| `person` | `client` | Tiene compañía, deal value, lead source, expected close |
| `employee` | `employee` | Tiene manager, departamento, access role, start date |
| `company` | `customer` | Tiene tier, MRR, renewal date, open tickets |

### Snapshot = los planos de conocimiento, no un tab genérico

Los tres planos vienen del canon del repo (`TICKET_KNOWLEDGE_SYSTEM_PRODUCT.md`),
no están inventados:

| Plano | Confianza | Contenido |
|---|---|---|
| Truth | 100% | Hechos verificados. El agente los trata como verdad absoluta |
| Sandbox | ~80% | Claims no verificados y borradores. Probablemente ciertos, sin garantía |
| Sources | ~60% | Documentos crudos y material de referencia, para lookup y citación |

Cada hecho lleva su plano, su confianza, su fuente y su última verificación. Es lo
que hace auditable la lectura del concierge: cuando responde, muestra de qué plano
salió cada parte.

---

## Estructura

```
ucp-ds-screens/
├── ucp-screens.patch                        # el diff completo, listo para git apply
├── src/screens/
│   ├── ucpShared.ts                         # tipos + fixtures (14 contactos, hechos, actividad, drives)
│   ├── pm-thomas-ucp-contacts.tsx           # listado + navegación al perfil
│   └── pm-thomas-ucp-profile.tsx            # UCP: RecordHeader + 4 tabs + concierge
└── screenshots/                             # cada vista y cada estado, 1440×1000
```

`ucpShared.ts` sigue el precedente de `adminShared.ts`: un solo lugar para las
formas de datos, para que el listado y el perfil no se desincronicen.

---

## Verificación corrida

- `npx tsc -b --noEmit` → 0 errores
- `npm run build` → limpio
- `npm run audit:tokens` → 0 hallazgos sobre estos 3 archivos (los 39 warnings de
  spacing que reporta son preexistentes de otras pantallas)
- `grep 'rgba\|#hex'` sobre los 3 archivos → 0 resultados
- Navegador en `localhost:5173`, 1440×1000, sin errores de consola: cada tab, cada
  panel, los tres variantes de `RecordHeader`, el empty state filtrado, y la
  paginación reseteando en cada cambio de tab / filtro / orden

---

## `// DS-GAP:` que quedaron marcados

Uno solo, en ambas pantallas:

**`DS-GAP: agent chat panel`** — no existe componente de chat en
`src/components/ui/`; `record-header.tsx` lo dice explícitamente en su propio
encabezado ("There is no dedicated 'agent chat' component yet anywhere in
src/components/ui/"). Se compuso con `SlideOut` + `CardContainer` + `Tag` + `Chip`
+ `Input` + `Button`; las burbujas son el único arreglo propio y solo reordenan
tokens existentes. Es el candidato natural a componente nuevo si Design lo quiere
promover.

---

## Nota sobre el tab Logs

La convención del DS pone un tab **Logs** al final de toda página de detalle. Aquí
no está: los tabs elegidos fueron Overview · Snapshot · Activity · Drives. El
timeline de Activity ya cubre la traza de interacciones con su propia paginación,
pero si quieren la tabla de eventos de sistema aparte, agregarla es un tab más
siguiendo el patrón `Table` + `Filters` + `Pagination`.
