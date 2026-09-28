# context.md — Gym Tracker

Contexto de producto, usuarios, dominio y estado actual. Complementa a
`CLAUDE.md` (guía técnica) y `protocol.md` (cómo trabajar en el repo).

---

## 1. El producto en una frase

App para que un grupo de amigos registre entrenamientos con **foto de evidencia**,
compita en un **ranking de constancia** y se motive con rachas, medallas y un
**muro de actividad** estilo red social.

## 2. Usuarios

- **Grupo principal:** "Gym ave Miller 2026", 4 amigos (miembros VIP), en Argentina.
- **Admin maestro:** `mosquerafran265@gmail.com` (Francisco). Ve el panel de Admin y
  las Aprobaciones globales.
- **Miembros VIP** (`MIEMBROS_MILLER`): auto-aprobados y auto-agregados al grupo
  Miller; se les restauran sus categorías por defecto si se quedan sin ninguna.
- **Usuarios nuevos:** hoy se **auto-aprueban** al entrar (ver Riesgos). Existe
  toda la maquinaria de "pendiente/aprobado/rechazado" y una pantalla de
  Aprobaciones por si se quiere volver a un modelo cerrado.

El tono del producto es de joda entre amigos: los "chistes motivacionales"
(`CHISTES` en `constants.js`) son insultos cariñosos rioplatenses que aparecen al
guardar un entreno y en el Home.

## 3. Flujos principales

1. **Login** con Google (popup) → `useAuth` verifica estado vía Cloud Function
   `verificarAcceso` (con fallback local).
2. **Selección de grupo** (`GrupoSelector`): crear grupo (te volvés admin), unirte
   con código `GYM-XXXX`, o entrar a uno existente. Se guarda en `localStorage`.
3. **Home**: frase motivacional + calendario personal (mis días marcados) +
   `TrainingSelector` para registrar el día seleccionado.
4. **Registrar entreno** (`TrainingSelector`): foto **obligatoria** → categoría →
   PRs opcionales (ejercicio + kg + reps) → mensaje del día. Comprime la foto,
   la sube a Storage y crea el doc en `asistencias`.
5. **Muro** (`Feed`): últimos entrenos del grupo (foto, categoría, notas, PRs),
   ordenados por fecha/hora.
6. **Ranking/Stats** (`Stats`): panel personal (constancia %, racha actual y récord,
   progreso de la semana contra la meta semanal, heatmap del año calendario) +
   desglose por categoría + ranking del grupo con podio top-3 y comparativa semanal.
   Períodos: este mes / últimos 6 meses / este año. (Worklogs `2026-07-06/07` y `08`.)
7. **Detalle de día** (`DiaDetalle`): explorar el calendario, ver quién entrenó
   cada día, y **editar/borrar los registros propios** (incluso de días pasados).
8. **Ajustes** (`Settings`): CRUD de categorías propias (nombre, si "cuenta" para
   el ranking, activa/inactiva) y la meta semanal (1 a 7 días).
9. **Admin**: gestionar miembros del grupo. **Aprobaciones**: aprobar/rechazar
   usuarios globalmente (solo admin maestro).

## 4. Reglas de dominio

- **"Día entrenado" que cuenta al ranking**: un día suma si el usuario registró al
  menos una asistencia cuya **categoría tiene `cuenta=true`**. Se cuentan **días
  únicos**, no cantidad de entrenos (entrenar dos veces el mismo día = 1 día).
- **Categorías**: son **por usuario**. Cada uno tiene su propio set (ej. "Push",
  "Legs", "Fútbol"). Algunas no cuentan (ej. "Fútbol" puede marcarse `cuenta=false`).
- **Racha (`streak`)**: días consecutivos hasta hoy (o ayer) con al menos una
  asistencia. Se calcula en tiempo real con `onSnapshot` (`useStreak`).
- **Medallas** (`gamificationService`): por volumen (1/10/50 entrenos) y por
  horario (madrugador <8am, noctámbulo ≥21hs), derivadas del `timestamp`.
- **Foto obligatoria**: sin foto no se puede guardar.

## 5. Modelo de datos (detalle)

### `asistencias` (el corazón de la app)
```
userId       string   uid de Firebase Auth (dueño; base de las reglas de seguridad)
userName     string   displayName al momento de registrar (se usa para agrupar/ranking)
fecha        string   "YYYY-MM-DD" en HORA LOCAL
timestamp    number   Date.now() al crear (orden del feed + medallas de horario)
categoriaId  string   id del doc en `categorias` (docs viejos: campo `catId`)
notas        string   "mensaje del día"
rutina       array    [{ nombre, peso?, reps?, series? }]  (PRs)
imagenUrl    string   URL de descarga en Storage (o null)
grupoId      string   grupo al que pertenece
likes        array    userIds que reaccionaron (feature mayormente inactiva en la UI)
```

### `categorias`
```
userId  string   dueño
nombre  string   ej. "Pecho-Espalda"
cuenta  bool     ¿suma al ranking de días?
activo  bool     ¿aparece en el selector? (false = archivada)
```

### `grupos`
```
nombre           string
adminEmail       string   dueño del grupo
miembros         array    emails (¡no uids!)
codigoInvitacion string   "GYM-XXXX"
creadoEn         string   ISO
```

### `usuarios` (doc id = email)
```
uid, email, displayName, photoURL
estado    "aprobado" | "pendiente" | "rechazado"
creadoEn  string ISO
migrado?  bool   (vino de una colección legacy)
metaSemanal? number  días por semana (1-7) que se propone el usuario; si falta,
                     se usa META_SEMANAL_DEFAULT. La escribe cada uno en su doc.
```

> **Ojo con las identidades:** `asistencias` usa `userId` (uid) para seguridad pero
> agrupa el ranking/feed por `userName` (displayName). `grupos.miembros` usa
> **email**. Son tres identificadores distintos conviviendo.

## 6. Backend (Cloud Functions, región us-central1)

| Función | Tipo | Qué hace |
|---------|------|----------|
| `onUserCreated` | trigger `usuarios/{email}` | Al crearse el doc, setea `estado` (aprobado si admin/VIP, si no pendiente) y restaura categorías por defecto de VIPs. |
| `verificarAcceso` | callable | Verifica/crea/migra el usuario al loguear. Devuelve `{ estado }`. |
| `repararMiembrosVip` | scheduled 24h | Garantiza que los VIP estén en el grupo Miller. |
| `restaurarCategorias` | callable | Restaura categorías por defecto de un usuario sin categorías. |

## 7. Stack

- **Frontend:** React 19, TypeScript (strict), Create React App (react-scripts 5),
  Tailwind (config propia con tokens `primary/accent/surface/textMain...`),
  lucide-react (íconos), sweetalert2 (modales), react-calendar,
  browser-image-compression, Firebase Web SDK v12 con persistencia offline.
- **Backend:** Node 22, firebase-functions 6 (API v2), firebase-admin.
- **Infra:** Firebase Hosting + Firestore + Storage + Cloud Functions. CI de deploy
  vía GitHub Actions (`.github/workflows/firebase-hosting-*`).

## 8. Estado actual

Vive en **`ESTADO.md`** (qué hay en producción, qué falta, qué riesgo está abierto).
La historia de cada cambio, en `worklog/`.

## 9. Riesgos conocidos / decisiones abiertas

1. **Auto-aprobación de usuarios nuevos.** `verificarAcceso` aprueba a cualquiera
   que se loguee. Si se quiere cerrar el registro, cambiar el paso 6 de
   `verificarAcceso.js` (y el fallback en `authService.ts`) a `estado: "pendiente"`.
2. **`grupos` editable por cualquier autenticado** (regla `allow update`). Permite
   que alguien modifique/vacíe grupos ajenos. Endurecer requiere reglas más finas
   (p. ej. permitir solo agregarse a sí mismo a `miembros`, o mover joins a una
   Cloud Function).
3. **Config de Firebase embebida en el cliente** (`firebase.js`). Es normal en apps
   web de Firebase (no es secreto), pero la seguridad recae 100% en las rules.
4. **`userName` como clave de agrupación**: si alguien cambia su displayName de
   Google, sus entrenos históricos quedan bajo el nombre viejo en ranking/feed.
5. **Cruft legacy en la raíz** del repo (ver CLAUDE.md §8).

## 10. Ideas de mejora futuras (backlog sugerido)

- ✅ ~~Índice compuesto para ordenar el feed en la query~~ — hecho el 2026-07-06
  (worklog `10`): el muro trae 50 desde el servidor. Falta confirmar que el índice
  esté deployado (`ESTADO.md` §2).
- Paginación real del feed ("ver más" después de los primeros 50).
- Centralizar `constants.js` (hoy duplicado front/back) en un paquete compartido.
  Mientras tanto, `constants.sync.test.ts` controla que no se desincronicen.
- Tests de los services (con emulador). `statsService.calcularRachas` y `utils/date`
  ya tienen tests.
- Reactivar y completar la feature de "likes" del feed, o removerla del modelo.
- Notificaciones push (recordatorio de racha en riesgo).
