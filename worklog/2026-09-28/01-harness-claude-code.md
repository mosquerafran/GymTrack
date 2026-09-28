# Harness de Claude Code: auditoría y montaje

- **Fecha:** 2026-09-28
- **Tipo:** chore (harness del agente) + docs
- **Estado:** ✅ hecho (falta verificar en vivo que las skills carguen: ver Pendientes)

## Qué
Auditoría del harness de Claude Code con el procedimiento de la skill `auditar-harness` del repo
del ERP (`bd/.claude/skills/auditar-harness/`), y montaje de las piezas que faltaban.

- **`verify.ps1`** (nuevo): un comando que dice si está verde. Docs base + presupuesto de
  `CLAUDE.md` + tres invariantes por grep + carga del backend + typecheck + tests + build.
- **`frontend/src/config/constants.sync.test.ts`** (nuevo): congela que los dos `constants.js`
  sean idénticos.
- **`.claude/settings.json`** (nuevo, versionado): permisos en tres niveles (`deny` / `ask` /
  `allow`, en Bash **y** PowerShell) + hook que corre `verify.ps1` antes de cada `git push`.
- **`.claude/rules/`** (nuevo): `backend.md`, `datos-y-fechas.md`, `firebase-config.md`, todas con
  `paths:` para que carguen solo en su zona.
- **Skills** (nuevas): `/arrancar-tarea`, `/cerrar-tarea`, `/deploy` (esta última solo manual).
- **`ESTADO.md`** (nuevo): el estado vivo, separado de las reglas.
- **CI**: el workflow de PR ahora corre typecheck + tests antes del preview.
- **Docs**: `CLAUDE.md`, `context.md` y `protocol.md` corregidos (ver Hallazgos).

## Hallazgos (lo que se encontró, además de lo que se hizo)

1. **La skill de diseño no cargaba nunca.** Era `.claude/skills/frontend-design.md`, un `.md`
   suelto; Claude Code solo reconoce `skills/<nombre>/SKILL.md`. `protocol.md` §4 mandaba a usarla
   y el agente no la veía. → movida a `frontend-design/SKILL.md`.
2. **Node 20 en tres docs, Node 22 en el código.** `backend/package.json` pide Node 22 desde el
   2026-07-06, pero `CLAUDE.md`, `context.md` y `protocol.md` seguían diciendo 20.
3. **🔴 Nada registra si las functions ya corren en Node 22**, y Node 20 se decomisiona el
   **30/10/2026**. Una function queda en el runtime con el que se deployó, y los deploys de
   functions son manuales. → `ESTADO.md` §2, para verificar en la consola.
4. **`CLAUDE.md` §8 afirmaba lo contrario de lo que hace el código**: *"`cargarFeedGlobal` trae
   todas las asistencias y recorta en el cliente"*. Desde el worklog `10` usa índice + `limit(50)`.
   `context.md` §10 lo seguía listando como mejora pendiente.
5. **El fallback del muro esconde un índice sin deployar.** Si el índice falta, el muro funciona
   igual pero leyendo todo el grupo: nadie lo notaría. → `ESTADO.md` §2.
6. **Referencia rota**: `protocol.md` §3.7 mandaba a *"§7 del skill de diseño"*, que no existe (la
   skill tiene 5 secciones genéricas, en inglés).
7. **`context.md` §8 "Estado actual (2026-07-06)" había quedado viejo**: listaba 5 de los 10
   trabajos de ese día, y describía Stats "sin gráficos" cuando después se sumaron heatmap, podio,
   rachas y meta semanal. El modelo de datos no tenía `usuarios.metaSemanal`.
8. **Nada impedía un `firebase deploy`** ni un borrado en Firestore, cuando la regla de oro del
   repo es "los datos no se tocan". Solo había un `settings.local.json` (no versionado) con dos
   `allow`.
9. **El push a `main` es un deploy** (hosting por GitHub Actions) y no estaba dicho en ningún doc de
   proceso. Ahora está en `CLAUDE.md`, `protocol.md` §6, y el hook verifica antes de pushear.

### Dos veces el instrumento mintió durante el propio trabajo
- **El conteo de líneas de `CLAUDE.md`**: `Measure-Object -Line` **no cuenta líneas vacías**. Dio
  157 para un archivo de 196 (y dio OK con 201). Corregido a `@(Get-Content).Count`.
- **Un chequeo por grep que nunca se vio fallar no prueba nada.** Por eso cada invariante se probó
  **al revés**: se plantaron violaciones en archivos temporales (y se borraron) y se desincronizó
  `constants.js` a propósito (y se restauró).

## Por qué
Las reglas de `CLAUDE.md` / `protocol.md` eran buenas, pero dependían de que el agente las
recordara. Lo que se puede chequear con un grep va al script; lo que es irreversible va a `deny`;
el estado que caduca va a un archivo que se sabe que caduca.

## Archivos tocados
- `verify.ps1` — **nuevo** (UTF-8 con BOM: PowerShell 5.1 lee sin BOM como ANSI y el `—` rompe el parseo).
- `frontend/src/config/constants.sync.test.ts` — **nuevo**.
- `.claude/settings.json` — **nuevo**.
- `.claude/rules/backend.md`, `datos-y-fechas.md`, `firebase-config.md` — **nuevos**.
- `.claude/skills/arrancar-tarea/`, `cerrar-tarea/`, `deploy/` — **nuevos**.
- `.claude/skills/frontend-design.md` → `.claude/skills/frontend-design/SKILL.md` — movido.
- `ESTADO.md` — **nuevo**.
- `CLAUDE.md` — puntero a ESTADO/verify/skills, Node 22, feed, `metaSemanal`, push = deploy; 196 líneas.
- `context.md` — §3 Stats y Ajustes, §5 `metaSemanal`, §7 Node 22, §8 → `ESTADO.md`, §10 backlog.
- `protocol.md` — §1 Node 22, §3.7 referencia rota, §4 ruta de la skill, §5 `verify.ps1`, §6 deploy, §8.
- `.github/workflows/firebase-hosting-pull-request.yml` — typecheck + tests.
- `.gitignore` — `verify-hook.log`.

## Cómo se verificó
- **Línea base, antes de tocar nada**: `tsc --noEmit` OK, 8/8 tests OK.
- `.\verify.ps1` → **exit 0**, `VERIFICACIÓN EN VERDE` (8 pasos, **11/11 tests**, build `Compiled successfully`).
- **Chequeos probados al revés**:
  - `initializeApp()` en un segundo archivo → falla y lista los 2 lugares.
  - `toISOString().split("T")[0]` y `.slice(0, 10)` → fallan los dos. `new Date().toISOString()`
    para un timestamp **no** da falso positivo.
  - `import ... from "firebase/firestore"` en `pages/` → falla.
  - `ADMIN_EMAIL` distinto en el backend → el test falla (`Expected … Received "otro@gmail.com"`).
    Archivo restaurado; `git status` del backend limpio.
- `.claude/settings.json` parsea como JSON (39 allow, 10 ask, 25 deny, 2 hooks).

## Pendientes
- ⬜ **Verificar en vivo que las 4 skills carguen**: abrir una sesión de Claude Code **dentro de
  este repo** y confirmar que aparecen `/arrancar-tarea`, `/cerrar-tarea`, `/deploy` y
  `frontend-design`. Se armaron desde otra sesión, así que no se pudo ver.
- ⬜ **El hook pre-push no se ejecutó nunca de verdad** (no hubo push). El primer `git push`
  desde Claude Code lo prueba: tiene que tardar ~2 min y dejar `verify-hook.log`.
- ⬜ **El workflow de PR** con typecheck + tests se prueba con el primer PR.
- ⬜ Los dos 🔴 de `ESTADO.md` §2 (runtime de las functions e índice del muro): **los verifica el dueño**.
- ⏸️ Fichas por módulo (`docs/specs/`): diferidas a propósito. El repo es chico y `context.md` ya
  cubre los flujos; escritas ahora serían una segunda copia que se desincroniza.
