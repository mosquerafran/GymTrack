---
paths:
  - "backend/**"
---

# Backend (Cloud Functions)

- **Node 22**, `firebase-functions` 6 con la API **v2** (`firebase-functions/v2/...`), región
  `us-central1`. Node 20 se decomisiona el **30/10/2026**: las functions quedan en el runtime con el
  que se **deployaron**, no con el que dice `package.json`. Ver `ESTADO.md`.
- **`initializeApp()` UNA sola vez, en `src/index.js`.** Un segundo llamado lanza *"The default
  Firebase app already exists"* y tumba el cold start de **todas** las funciones (pasó: worklog
  `2026-07-06/02`). En los módulos usá `getFirestore()` directo. `verify.ps1` lo controla.
- **`src/constants.js` es ESPEJO de `frontend/src/config/constants.js`** (`ADMIN_EMAIL`,
  `MIEMBROS_MILLER`, `CATEGORIAS_POR_DEFECTO`). Si tocás uno, tocá el otro:
  `frontend/src/config/constants.sync.test.ts` falla si difieren. `CHISTES` vive solo en el front.
- **La lógica de `verificarAcceso` está duplicada a propósito** en el cliente
  (`authService.verificarEstadoUsuario`, como fallback si la function no responde). Cambiar una sin
  la otra hace que el resultado dependa de si la function estaba caliente.
- **`crearGrupo` / `unirseAGrupo`** (`src/grupos/gestionGrupos.js`): los únicos caminos para crear
  un grupo o unirse (las rules lo bloquean en el cliente). Exigen `email_verified`; los mensajes de
  `HttpsError` le llegan tal cual al usuario (escribilos para él). Tests: `tests/rules/funciones.test.js`.
- **Auto-aprobación:** hoy `verificarAcceso` aprueba a cualquiera que se loguee. Es una decisión
  abierta (`context.md` §9.1): no la cambies sin que el dueño lo pida.
- **Probar sin tocar producción:** `npm run serve` levanta el emulador. El agente **no puede**
  deployar (está denegado en `.claude/settings.json`): para eso está `/deploy`.
