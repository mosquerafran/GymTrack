# Skills de terceros (vendoreadas)

Copiadas tal cual desde los repos oficiales listados en https://skills.sh (2026-09-28).
No las edites a mano: para actualizar, volvé a copiar la carpeta desde el repo.

| Skill (carpeta) | Origen | Commit | Para qué acá |
|---|---|---|---|
| `firebase-security-rules-auditor` | github.com/firebase/agent-skills | `daaf0e1` | Auditar `firestore.rules` / `storage.rules` (ej. el `allow update` de `grupos`) |
| `firestore-rules-creation` | github.com/firebase/agent-skills | `daaf0e1` | Endurecer / reescribir `firestore.rules` |
| `firebase-firestore` | github.com/firebase/agent-skills | `daaf0e1` | Queries, índices y modelo de datos (usar `references/standard/web_sdk_usage.md`) |
| `react-best-practices` | github.com/vercel-labs/agent-skills | `063bee9` | Performance React (ignorar reglas `server-*`/Next.js: esto es CRA) |
| `web-design-guidelines` | github.com/vercel-labs/agent-skills | `063bee9` | Auditoría UI/accesibilidad; baja las reglas en vivo desde GitHub de Vercel |
| `pwa-development` | github.com/croakingtoad/pwa-development (comunidad, MIT) | `7462af9` | Manifest, service worker, instalación, safe areas, quirks iOS/Android |

### Ojo con `pwa-development` en este proyecto
Es genérica, no sabe de Firebase. Al aplicarla:
- **No cachear Firestore ni Auth con el service worker** (`firestore.googleapis.com`,
  `identitytoolkit`, `securetoken`): son *Network Only*. Para offline de datos se usa la
  persistencia propia del SDK de Firestore, no el Cache API.
- Las fotos de Storage (`firebasestorage.googleapis.com`) sí pueden ir *Cache First* con
  `ExpirationPlugin` (límite de entradas), porque cada foto tiene URL con token fija.
- Esto es **CRA** (`react-scripts`), no Vite: el camino es `src/service-worker.js` +
  `serviceWorkerRegistration` del template `cra-template-pwa`, no `vite-plugin-pwa`.
- Un SW mal versionado deja a los usuarios en una versión vieja después del deploy:
  avisar de la actualización ("hay versión nueva, recargá") en vez de `skipWaiting` silencioso.

Las reglas del proyecto (`CLAUDE.md`, `.claude/rules/`, `protocol.md`) mandan sobre estas skills.
En particular: nada de `firebase deploy` desde el agente (usar `/deploy`).
