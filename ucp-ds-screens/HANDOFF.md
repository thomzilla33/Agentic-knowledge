# Desplegar el UCP en cachilupis/aims-os-design-system

Dos caminos. El primero es más rápido si la sesión sigue viva.

---

## Camino A — pegar esto en la sesión del DS

Abre `session_011MonPF1SciRiy6p321gVvC` ("UCP — abrir PR en el design system")
y pega el mensaje completo de abajo. Está interrumpida con el patch viejo, así
que lo primero que hace el mensaje es decirle que lo descarte.

> Alto: el patch que estabas por aplicar quedó obsoleto. Descártalo y usa el
> nuevo — cambió de 8 archivos a 5 y ya no borra nada.
>
> Contexto: `main` de este repo avanzó 13 commits desde la base del patch viejo.
> El PR #46 reescribió `RecordHeader` (+1331/−535) — su agnosticism pass eliminó
> las variantes cerradas uep/ucp/uvp, su redesign reintrodujo el Next Best Action
> como bloque protagonista dentro del header, y ganó loading por zona y masking
> por campo. Esos eran los tres argumentos con los que el patch viejo justificaba
> un `EntityHeader` aparte. El PR #97 agregó un check de duplicate-component que
> el patch viejo habría disparado.
>
> Además el patch viejo borraba `src/screens/pm-thomas-universal-profile.tsx`
> como huérfano. NO lo es: cuatro commits lo han estado desarrollando y está
> registrado en `App.tsx` como prototipo vivo.
>
> El prototipo ya fue reconstruido sobre `RecordHeader`. Pasos:
>
> 1. Descarta lo aplicado: `git checkout -- . && git clean -fd src/`
> 2. `git checkout main && git pull && git checkout -B claude/ucp-unified-contact-profile`
> 3. Baja el patch nuevo:
>    ```
>    BR=claude/ucp-vista-actualizada-431vm5
>    RAW=https://raw.githubusercontent.com/thomzilla33/Agentic-knowledge/$BR/ucp-ds-screens
>    curl -sSL -o /tmp/ucp.patch $RAW/ucp-screens.patch
>    curl -sSL -o /tmp/ucp-pr.md $RAW/PR.md
>    ```
> 4. Verifica integridad: `wc -c /tmp/ucp.patch` debe dar **142267** y
>    `grep -c '^diff --git' /tmp/ucp.patch` debe dar **5**. Si no, no sigas.
> 5. `git apply /tmp/ucp.patch`, y confirma con `git status --short` que hay
>    5 archivos y **cero borrados**. Un archivo borrado = bajaste el patch viejo.
> 6. `npm ci && npm run build` (0 errores) y `node scripts/audit-ratchet.cjs`
>    (debe decir "No new DS warnings"). `.husky/pre-push` corre ese mismo
>    ratchet — no lo saltes con `--no-verify`.
> 7. `npm run dev`, a 1440×1000: Prototypes → "UCP - Contacts Last version".
>    Comprueba el listado, abrir un registro, los cuatro tabs, y Amy Chen — debe
>    salir con tag "Locked" y el cuerpo explicando el scope `finance.read`.
> 8. Commit, push, y:
>    ```
>    gh pr create --base main \
>      --title "UCP — Unified Contact Profile, built on RecordHeader" \
>      --body-file /tmp/ucp-pr.md --reviewer cachilupis
>    ```
>
> El PR necesita review de @cachilupis porque `entity-list.tsx` y `App.tsx` están
> bajo CODEOWNERS. Es esperado, no un bloqueo. Reporta la URL del PR y el CI; si
> sale rojo, diagnostícalo y arréglalo.

---

## Camino B — a mano, ~3 minutos

```bash
cd ~/aims-os-ds
git checkout main && git pull
git checkout -b claude/ucp-unified-contact-profile

BR=claude/ucp-vista-actualizada-431vm5
RAW=https://raw.githubusercontent.com/thomzilla33/Agentic-knowledge/$BR/ucp-ds-screens
curl -sSL -o /tmp/ucp.patch $RAW/ucp-screens.patch
curl -sSL -o /tmp/ucp-pr.md $RAW/PR.md

wc -c /tmp/ucp.patch                        # 142267
git apply /tmp/ucp.patch
git status --short                          # 5 archivos, 0 borrados

npm ci
npm run build                               # 0 errores
node scripts/audit-ratchet.cjs              # "No new DS warnings"
npm run dev                                 # revísalo antes de pushear

git add -A
git commit -m "UCP — Unified Contact Profile, built on RecordHeader"
git push -u origin claude/ucp-unified-contact-profile

gh pr create --base main \
  --title "UCP — Unified Contact Profile, built on RecordHeader" \
  --body-file /tmp/ucp-pr.md --reviewer cachilupis
```

---

## Después del PR

Vercel comenta la URL de preview en el PR — ahí revisas el prototipo desplegado
antes de mergear. El merge a `main` lo lleva a producción.

Michael tiene que aprobar: `entity-list.tsx` y `App.tsx` están bajo CODEOWNERS.
El `PR.md` le explica los dos cambios y le deja dos preguntas concretas.

## Si algo falla

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `wc -c` ≠ 142267 | descarga cortada | vuelve a bajarlo |
| `git status` muestra un borrado | bajaste el patch viejo | verifica la rama en la URL |
| `git apply` falla | `main` avanzó otra vez | `git apply --3way`, resuelve leyendo ambos lados |
| el ratchet sube un contador | `main` cambió | **no** uses `--no-verify`; mándame el output |
