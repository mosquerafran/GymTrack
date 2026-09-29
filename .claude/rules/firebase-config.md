---
paths:
  - "firestore.rules"
  - "storage.rules"
  - "firestore.indexes.json"
  - "firebase.json"
  - ".firebaserc"
  - ".github/workflows/**"
---

# Reglas de seguridad, índices e infraestructura de Firebase

- **La seguridad recae 100% en las rules.** La config de Firebase del cliente (`firebase.js`) es
  pública por diseño; no es un secreto.
- **Cambiar `firestore.rules` o `storage.rules` es sensible** (`protocol.md` §0): antes de proponer
  el deploy, verificá que los usuarios actuales sigan pudiendo leer y escribir lo que ya usan. Con el
  emulador, no contra producción.
- **Tests de rules:** `tests/rules/rules.test.js` (emulador, proyecto `demo-*`, necesita Java).
  Corren en `verify.ps1` y en el CI de PR. Cada cambio de rules lleva un caso de abuso **y** un
  caso del flujo real que usa el service del frontend (si no, se rompe la app sin que nadie lo vea).
- **Deploy de rules y frontend juntos:** si una regla nueva prohíbe algo que el cliente hace hoy,
  primero se deploya el frontend (push) y **después** las rules.
- **Lectura aislada por grupo (fase 2):** una query de `asistencias` que no filtre por `grupoId`
  (o por `userId` propio) **se rechaza entera**, aunque todos los docs que traería fueran legibles.
  Toda query nueva lleva ese filtro, su índice en `firestore.indexes.json` y su test en
  `tests/rules` (hay uno por cada query de la app).
- **Crear grupo y unirse con código son Cloud Functions** (`backend/src/grupos/gestionGrupos.js`):
  las rules no dejan crear grupos ni agregarse a uno desde el cliente.
- **`ADMIN_EMAIL` también vive en `firestore.rules`** (`esAdminGlobal()`). Si cambia el admin, se
  cambia en los dos `constants.js` **y** en las rules.
- **Índices:** una query con `where` + `orderBy` en campos distintos necesita índice compuesto. Se
  declara en `firestore.indexes.json` y se deploya **antes** que el código que lo usa.
- **Qué deploya qué:**
  - **Hosting** → automático: **cada push a `main`** dispara `firebase-hosting-merge.yml`.
  - **Functions, rules, índices y Storage** → **manual**, con `firebase deploy --only ...`.
  - El workflow de **PR** buildea un preview (canal temporal) y corre typecheck + tests.
- El agente no puede ejecutar `firebase deploy` (denegado): el procedimiento está en `/deploy`.
