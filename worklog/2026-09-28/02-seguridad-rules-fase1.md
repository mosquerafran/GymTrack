# Seguridad fase 1: rules endurecidas + tests en emulador

- **Fecha:** 2026-09-28
- **Tipo:** bugfix (seguridad)
- **Estado:** ✅ hecho en código · ⏳ falta deploy (push + `/deploy rules`)

## Qué
- **`firestore.rules`** reescritas:
  - `grupos`: el admin del grupo (o el admin global) edita todo; cualquier otro solo puede
    agregarse o sacarse **a sí mismo** de `miembros`. Al crear: `miembros == [tu email]`, código
    `GYM-XXXX`, nombre ≤ 60.
  - `usuarios`: nadie cambia su propio `estado` ni puede borrar su doc; al crearlo solo puede nacer
    `aprobado`/`pendiente` (la auto-aprobación actual). El admin global cambia `estado` de otros y
    nada más. `metaSemanal` validada 1-7.
  - `asistencias`: crear solo en un grupo del que sos miembro, con tu `userId`, fecha `YYYY-MM-DD`,
    `likes` vacío. Editar solo el contenido (`categoriaId`, `notas`, `rutina`, `imagenUrl`,
    `timestampActualizacion` y los nuevos `tipo`/`musculos`/`etiqueta`). Límites de tamaño.
  - `categorias`: `userId` inmutable, `nombre` ≤ 40.
  - Todo lo que usa el email como identidad exige `email_verified`.
  - Al editar, **solo se validan los campos que cambian** (`camposTocados()`): un doc legacy con un
    campo "raro" (notas gigantes, `catId`, sin `grupoId`) sigue siendo editable.
- **`storage.rules`**: solo `image/*`, < 3 MB, en tu carpeta.
- **`Aprobaciones.tsx`**: `titleText` en vez de `title` (SweetAlert interpretaba el email como HTML)
  y usa el id del doc, no el campo `email` que escribe el propio usuario. La escritura pasa a
  `authService.cambiarEstadoUsuario()` → la allowlist legacy de `verify.ps1` queda vacía.
- **`gruposService.cargarGruposDeUsuario`**: se quitó la "reparación" del grupo Miller desde el
  cliente (con las rules nuevas fallaría; la hace `repararMiembrosVip` todos los días; y leía
  todos los grupos en cada carga).
- **`tests/rules/`**: 48 tests con `@firebase/rules-unit-testing` + `node --test` contra el
  emulador (proyecto `demo-gym-tracker`). Integrados a `verify.ps1` y al workflow de PR.

## Por qué
Auditoría de seguridad (skill `firebase-security-rules-auditor`): puntaje **1/5**. Cualquier
logueado podía hacerse admin de "Gym ave Miller 2026", vaciarlo y borrarlo; un rechazado podía
auto-aprobarse; se podían cargar entrenos en grupos ajenos; XSS almacenado contra el admin.

## Archivos tocados
- `firestore.rules`, `storage.rules` — reescritas
- `frontend/src/pages/Aprobaciones.tsx` — XSS + service
- `frontend/src/services/authService.ts` — `cambiarEstadoUsuario()`
- `frontend/src/services/gruposService.ts` — sin reparación VIP en cliente
- `tests/rules/` — nuevo (package.json, rules.test.js)
- `verify.ps1` — paso "Tests de rules", allowlist vacía
- `.github/workflows/firebase-hosting-pull-request.yml` — job `rules_tests`
- `CLAUDE.md` §2/§4.6/§6, `context.md` §9, `.claude/rules/*` — drift corregido

## Cómo se verificó
- `.\verify.ps1` completo: **VERIFICACIÓN EN VERDE** (48/48 rules, tsc, Jest 11/11, build).
- **Sabotaje:** se volvió a abrir `grupos` (`allow update: if true`) → fallaron exactamente los 6
  tests de abuso de grupos y `verify.ps1` quedó en rojo. Restaurado.
- Los tests incluyen el **flujo real** de cada service (unirse, salir, crear grupo, admin agrega/
  quita, fallback de alta de usuario, merge VIP, metaSemanal, registrar/editar/borrar entreno,
  categorías, subir foto), no solo los abusos.
- ⚠️ No probado contra producción ni en la app real (login con Google no se automatiza).

## Hallazgos
- **La pantalla de Aprobaciones estaba rota en producción**: la rule vieja de `usuarios` solo
  dejaba escribir tu propio doc, así que el admin no podía aprobar ni rechazar a nadie.
- **Un BOM rompe las rules**: al sabotear desde PowerShell 5 (`Set-Content -Encoding utf8`) el
  archivo quedó con BOM y el emulador no compiló (`token recognition error at: '﻿'`). Lo mismo
  pasaría en el deploy real. Editar rules con herramientas que escriban UTF-8 sin BOM.
- Java no estaba instalado: se instaló `Microsoft.OpenJDK.21` con winget. `verify.ps1` lo busca en
  `C:\Program Files\Microsoft\jdk-*` si no está en el PATH.
- `ADMIN_EMAIL` ahora tiene una **tercera copia**, en `firestore.rules` (documentado).

## Notas / pendientes
- **Orden de deploy obligatorio:** 1) push a `main` (hosting sin la reparación VIP), 2) `/deploy
  rules` (firestore + storage). Al revés, a los VIP/admin se les rompe la carga de grupos.
- **Fase 2** (necesita deploy de Functions): unirse vía callable con códigos únicos, cerrar lectura
  de `grupos`/`asistencias`/Storage por grupo, filtro `grupoId` en `cargarAsistenciasMes` (+ índice),
  App Check.
- Quedan del informe: ranking por `userName` (S5 parcial: se valida tamaño, no identidad), headers
  de seguridad en hosting, `permissions:` y pin por SHA en `firebase-hosting-merge.yml`.
