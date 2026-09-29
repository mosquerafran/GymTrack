# Seguridad fase 2: aislamiento entre grupos

- **Fecha:** 2026-09-28
- **Tipo:** bugfix (seguridad)
- **Estado:** ✅ hecho en código · ⏳ deploy en 4 pasos (índice → functions → push → rules)

## Qué
- **Cloud Functions nuevas** (`backend/src/grupos/gestionGrupos.js`):
  - `crearGrupo({ nombre })`: crea el grupo con el usuario de admin y **código único** (reintenta si
    choca).
  - `unirseAGrupo({ codigo })`: busca el código **en el servidor** y agrega al usuario con
    `arrayUnion`. Si el código está repetido (grupos de antes), no adivina: pide que el admin lo agregue.
  - Las dos exigen `email_verified` y validan la entrada; los mensajes le llegan al usuario.
- **Rules**:
  - `grupos`: leen solo los miembros (y el admin global). `create: false` (solo la function). Un
    miembro solo puede **sacarse** a sí mismo (agregarse, solo vía function).
  - `asistencias`: se leen las propias y las de tus grupos. Nuevo campo `sexo` (validado).
  - `usuarios`: cada uno lee **su** doc; el admin global, todos (Aprobaciones).
  - `usuariosPendientes` / `usuariosPermitidos`: cada uno solo su registro.
- **Frontend**:
  - `gruposService`: crear/unirse por callable; agregar/quitar miembros con `arrayUnion`/`arrayRemove`
    (antes reescribía la lista: dos cambios a la vez se pisaban); miembros por id del grupo.
  - `cargarAsistenciasMes` filtra por `grupoId` en la query (índice nuevo `grupoId + fecha`).
  - El **sexo se guarda en cada entreno** (`asistencias.sexo`): el muro y el detalle dibujan el
    cuerpito sin leer los docs de usuario de los demás. Se borró `cargarSexosPorUid`.

## Por qué
Cualquier logueado (y cualquiera puede loguearse: auto-aprobación) leía grupos, códigos de
invitación, entrenos, notas, fotos y emails de TODOS los grupos. Riesgo §9.2 de `context.md`.

## Cómo se verificó
- **69 tests** en el emulador (`tests/rules`): 62 de rules (uno por cada query real de la app:
  muro, mes, stats, racha, calendario, lista de grupos; más los abusos: leer grupo/entreno/usuario
  ajeno, query sin filtro de grupo, agregarse solo, crear grupo desde el cliente) y **7 de las
  functions** (`funciones.test.js`, con `firebase-functions-test` + firebase-admin del backend).
- **Sabotaje**: reabrir la lectura de `asistencias` y `usuarios` → fallan exactamente los 2 tests de
  "no leer lo ajeno".
- `.\verify.ps1` completo en verde (Jest 50/50, build, typecheck). El CI de PR instala el backend.

## Hallazgos
- **Una query que *podría* traer un doc prohibido se rechaza entera**, aunque todos los que trae
  sean legibles. Por eso `cargarAsistenciasMes` (solo rango de fecha) tenía que filtrar por grupo.
- **Entrenos viejos con `grupoId` vacío**: ya no se ven en el detalle del día (en muro, stats y racha
  ya no aparecían). No se borró nada.
- Pipe de PowerShell + `Select-Object -First N` corta el proceso de npm → exit 255 falso. Y
  `Set-Content -Encoding ascii` rompe tildes: editar JSON con node.

## Incidente de deploy (resuelto)
- `firebase deploy --only firestore:indexe` (typo) **no dio error**: deployó índices **y reglas**.
  Las reglas de la fase 2 quedaron en producción antes que las functions y el frontend (detalle del
  día, unirse/crear grupo y miembros del admin rotos). Se volvió a las reglas de `ce634a2` con
  `git show ce634a2:firestore.rules` + deploy de rules, en minutos. Lección en la skill `/deploy`.

## Notas / pendientes
- **Orden de deploy** (en `ESTADO.md`): índice → functions → push → rules.
- **App Check** (bloquear scripts que no son la app): necesita configurar reCAPTCHA en la consola.
- Los nombres de `categorias` siguen legibles para cualquier logueado (a sabiendas).
