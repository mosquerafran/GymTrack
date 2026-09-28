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
- **Punto débil conocido:** `grupos` tiene `allow update: if request.auth != null` (cualquier
  autenticado edita cualquier grupo). Es intencional porque unirse es un `updateDoc` de `miembros[]`.
  Endurecerlo requiere cambiar el flujo de unirse (`context.md` §9.2). No lo "arregles" suelto:
  rompe el unirse a grupos.
- **Índices:** una query con `where` + `orderBy` en campos distintos necesita índice compuesto. Se
  declara en `firestore.indexes.json` y se deploya **antes** que el código que lo usa.
- **Qué deploya qué:**
  - **Hosting** → automático: **cada push a `main`** dispara `firebase-hosting-merge.yml`.
  - **Functions, rules, índices y Storage** → **manual**, con `firebase deploy --only ...`.
  - El workflow de **PR** buildea un preview (canal temporal) y corre typecheck + tests.
- El agente no puede ejecutar `firebase deploy` (denegado): el procedimiento está en `/deploy`.
