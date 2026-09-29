# CLAUDE.md

Guía para Claude Code (y para cualquier persona) al trabajar en este repositorio.
Todo el producto y sus datos están en **español (Argentina)**. Escribí código,
comentarios y textos de UI en español rioplatense para mantener consistencia.

> **El estado de hoy (qué hay en producción, qué falta) NO está acá: está en `ESTADO.md`.**
> Cómo se trabaja: `protocol.md` (manda sobre el proceso). Producto y datos: `context.md`.
> Verificación: **`.\verify.ps1`** (exit 0). Reglas por zona: `.claude/rules/` (cargan solas).
> Ciclo de tarea: **`/arrancar-tarea`** → **`/cerrar-tarea`**. Deploy: **`/deploy`**.
> ⚠️ **Pushear a `main` DEPLOYA el hosting a producción** (GitHub Actions). No es un push inocente.

---

## 1. Qué es

**Gym Tracker** es una PWA para que un grupo de amigos registre sus
entrenamientos, compita en un ranking y se mantenga la constancia. Cada usuario
sube una foto de evidencia + tipo y músculos del entreno + PRs opcionales, y la
app arma un calendario personal, un muro de actividad grupal y estadísticas.

- **Producción:** https://gym-tracker-1aaba.web.app
- **Proyecto Firebase:** `gym-tracker-1aaba`
- **Idioma de datos y UI:** español · detalle de producto, usuarios y datos: **`context.md`**

---

## 2. Arquitectura (monorepo)

```
gym-tracker/
├── frontend/          # App React 19 + TypeScript (Create React App)
│   ├── src/
│   │   ├── config/       # firebase.js (init SDK), constants.js (admin/VIP/chistes)
│   │   ├── hooks/        # useAuth, useGrupo, useStreak, useTheme
│   │   ├── services/     # capa de acceso a Firestore/Storage (SIN JSX)
│   │   ├── components/   # UI (Navbar, TrainingSelector, cuerpo/, ui/ = Hoja, Estados...)
│   │   ├── pages/        # vistas de nivel superior (Home, Feed, Stats, Admin...)
│   │   ├── utils/        # helpers puros (date.ts)
│   │   └── types/        # index.ts — interfaces TS compartidas
├── backend/           # Cloud Functions (Node 22, firebase-functions 6 con API v2)
│   └── src/
│       ├── index.js         # entrypoint: initializeApp() + exports
│       ├── constants.js     # ESPEJO de frontend/src/config/constants.js
│       ├── auth/            # onUserCreated (trigger), verificarAcceso (callable)
│       ├── grupos/         # repararMiembros (scheduled)
│       └── categorias/     # restaurarCategorias (callable)
├── firestore.rules    # reglas de seguridad de Firestore
├── storage.rules      # reglas de seguridad de Storage
└── firebase.json      # hosting (frontend/build) + functions + rules
```

### Patrón de capas (frontend)
- **`services/`** = única capa que habla con Firestore/Storage. No contiene JSX ni
  hooks. Devuelve datos tipados. **Toda** lectura/escritura nueva va acá.
- **`hooks/`** = estado + suscripciones (ej. `useStreak` usa `onSnapshot`).
- **`pages/` y `components/`** = presentación. Llaman a services/hooks; no importan
  `firebase/firestore` directamente (`verify.ps1` lo controla, sin excepciones).

### El backend "verifica", el cliente "cae en fallback"
`authService.verificarEstadoUsuario` llama primero a la Cloud Function
`verificarAcceso`; si falla (Functions no desplegado, etc.) usa un fallback local
equivalente. La misma lógica vive en dos lados a propósito.

---

## 3. Comandos

### Frontend (`cd frontend`)
```bash
npm install            # instalar dependencias
npm start              # dev server en http://localhost:3000
npm run build          # build de producción → frontend/build
npm test               # tests (Jest + Testing Library, watch)
CI=true npm test       # tests una sola vez (para CI / verificación)
npx tsc --noEmit       # solo typecheck, sin emitir
```

### Backend (`cd backend`)
```bash
npm install
npm run serve          # emulador de Functions
npm run deploy         # firebase deploy --only functions
npm run logs           # ver logs de las funciones
```

### Verificación y deploy (desde la raíz)
```powershell
.\verify.ps1           # invariantes + typecheck + tests + build → exit 0 = verde
.\verify.ps1 -Rapido   # sin build, para iterar
```
**Hosting** se deploya solo con cada push a `main`. **Functions, rules e índices** son manuales
(`firebase deploy --only ...`); el agente tiene `firebase deploy` denegado y usa **`/deploy`**.

> **Nota de entorno:** el shell principal es PowerShell en Windows. Los `&&`
> encadenados de arriba son de Bash; en PowerShell usá `;` o el tool de Bash.

---

## 4. Reglas y convenciones importantes

### 4.1 Fechas SIEMPRE en hora local — nunca `toISOString()` para la clave del día
Los usuarios están en Argentina (UTC-3). `new Date(y, m, d).toISOString()`
convierte a UTC y **corre la fecha un día hacia atrás** (00:00 -03:00 → día
anterior en UTC). Esto rompía los rangos de mes/año en las queries.

✅ Usá siempre los helpers de `src/utils/date.ts`:
`formatDateLocal(date)`, `inicioMesLocal(date)`, `finMesLocal(date)`.
La clave de un día es `"YYYY-MM-DD"` en hora local. Los `asistencia.fecha` se
guardan con ese formato.

### 4.2 `constants.js` está DUPLICADO — mantené los dos en sync
`frontend/src/config/constants.js` y `backend/src/constants.js` comparten
`ADMIN_EMAIL`, `MIEMBROS_MILLER` y `CATEGORIAS_POR_DEFECTO`. Si tocás uno,
tocá el otro. (El frontend además tiene `CHISTES`, que el backend no necesita.)
Lo congela `frontend/src/config/constants.sync.test.ts`: si difieren, falla.

### 4.3 `initializeApp()` del backend se llama UNA sola vez
Solo en `backend/src/index.js`. Nunca en los módulos de funciones: un segundo
llamado lanza *"The default Firebase app already exists"* y tumba el cold start
de **todas** las funciones. `verify.ps1` lo controla.

### 4.4 Entrenos viejos (`categoriaId` / `catId`) vs. nuevos (`tipo`, `musculos`)
Desde 2026-09 se escribe `tipo`/`musculos[]`/`etiqueta` y ya no `categoriaId`. Los docs
viejos NO se migran: `utils/entrenos.ts` los interpreta al leer (tipo y músculos se
deducen del nombre de la categoría). Toda lectura de entrenos pasa por esas funciones.

### 4.5 Foto obligatoria
Registrar un entrenamiento **requiere** una foto (regla de producto: "sin foto no
hay gains"). Las fotos se comprimen en el cliente (`browser-image-compression`,
máx 1MB / 1024px) y se guardan en Storage bajo `entrenamientos/{userId}/`.
Al borrar una asistencia se borra también su foto (`eliminarAsistencia`).

### 4.6 Multi-grupo (multi-tenant)
Cada `asistencia` y `categoria` pertenece a un grupo vía `grupoId`. El grupo
activo se guarda en `localStorage` (`grupoActivo`). El grupo "Gym ave Miller 2026"
tiene miembros VIP que repara la función programada `repararMiembrosVip` (no el cliente).

---

## 5. Modelo de datos (Firestore) — resumen

| Colección              | Doc ID   | Campos clave |
|------------------------|----------|--------------|
| `usuarios`             | email    | `uid, email, displayName, photoURL, estado(aprobado/pendiente/rechazado), creadoEn, metaSemanal?, sexo?` |
| `grupos`               | auto     | `nombre, adminEmail, miembros[] (emails), codigoInvitacion (GYM-XXXX), creadoEn` |
| `categorias` (= etiquetas) | auto | `userId, nombre, activo(bool)` · `cuenta` es legacy, ya no se usa |
| `asistencias`          | auto     | `userId, userName, fecha(YYYY-MM-DD), timestamp, tipo, musculos[], etiqueta, notas, rutina[], imagenUrl, grupoId, likes[]` (viejos: `categoriaId`/`catId`) |
| `usuariosPendientes`, `usuariosPermitidos` | — | **legacy**, solo lectura para migración |

`rutina[]` = `[{ nombre, peso?, reps?, series? }]` (PRs del día).
**Todo entreno suma** al ranking de "días entrenados" (sin importar tipo ni etiqueta).
Vocabulario (tipos, 15 músculos, atajos): `config/entrenos.ts`. Detalle: `context.md`.

---

## 6. Seguridad (Firestore rules) — lo que hay que saber

- Todo requiere estar logueado; lo que depende del email exige `email_verified`.
- `usuarios`: nadie cambia su propio `estado`; solo el admin global (espejo de
  `ADMIN_EMAIL` **dentro de `firestore.rules`**: si cambia, cambialo ahí también).
- `asistencias`: se crean solo en un grupo del que sos miembro; al editar, dueño,
  grupo, usuario y fecha quedan fijos. Tipos y tamaños validados.
- **Lectura aislada** (fase 2): entrenos y grupos solo de tus grupos; `usuarios` solo el propio.
  Toda query de `asistencias` filtra por `grupoId` (o `userId`): si no, se rechaza ENTERA.
- **Crear grupo y unirse con código: Cloud Functions** (`gestionGrupos.js`). Tests: `tests/rules`
  (emulador + Java, en `verify.ps1`); todo cambio lleva caso de abuso y de flujo real.

---

## 7. Al hacer cambios

1. **No toques datos de producción** sin autorización explícita. Trabajá contra el
   código; para probar contra datos usá el emulador de Firebase.
2. Nueva lógica de datos → en `services/`, tipada, reutilizando helpers de `utils/`.
3. Fechas → helpers de `utils/date.ts`. Nunca `toISOString()` para el día.
4. Constantes admin/VIP → actualizá los **dos** `constants.js`.
5. Verificá antes de dar por hecho: **`.\verify.ps1`** con exit 0 (hay un hook que lo
   corre antes de cada `git push` y lo bloquea si falla).
6. Registrá lo hecho en `worklog/` (una carpeta por fecha; ver `worklog/README.md`) y
   actualizá **`ESTADO.md`**. `/cerrar-tarea` recorre todo esto.

---

## 8. Deuda técnica / cosas a saber (no romper)

- **Raíz del repo tiene cruft legacy**: `package.json`, `package-lock.json`,
  `node_modules/` y `build/` en la raíz son de la CRA original antes de separar en
  `frontend/`. La app real es `frontend/`. `firebase.json` sirve `frontend/build`.
  No dependas de los de la raíz.
- `@types/react` es 18 pero React es 19 — hay un pequeño desfasaje de tipos que
  `skipLibCheck` tolera. No lo "arregles" a la ligera.
- `cargarFeedGlobal` usa el índice `asistencias(grupoId, timestamp desc)` + `limit(50)`,
  **con fallback** a traer todo el grupo si el índice falta. El fallback esconde un índice
  sin deployar: el muro anda igual, pero caro. Ver `ESTADO.md` §2.
- `cargarAsistenciasMes` filtra el grupo en el cliente (no en la query) para no
  excluir documentos legacy con `grupoId` vacío.
