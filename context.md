# context.md — Gym Tracker

Contexto de producto, usuarios, dominio y estado actual. Complementa a
`CLAUDE.md` (guía técnica) y `protocol.md` (cómo trabajar en el repo).

---

## 1. El producto en una frase

App para que un grupo de amigos registre entrenamientos con **foto de evidencia**,
compita en un **ranking de constancia** y se motive con rachas, medallas y un
**muro de actividad** estilo red social.

**Nombre de cara al usuario: Silverback** (desde 2026-09-28; el repo sigue llamándose
gym-tracker). Identidad: el gorila facetado de King Concretos (con permiso), blanco y negro
sobrio + rojo de marca, Poppins. Nombre en `frontend/src/config/marca.ts` (+ `public/`).

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
3. **Inicio** (`Home`): tarjeta "Hoy" (botón **Registrar entreno**, o "Hoy ya entrenaste"),
   la semana en curso contra la meta semanal, y el calendario del usuario. **Tocar un día**
   abre su detalle en un panel inferior. En el celu la navegación es una **barra inferior**
   (Inicio · Muro · **Registrar** al centro · Ranking · Ajustes); "atrás" del celu vuelve a la
   pantalla anterior o cierra el panel abierto (`hooks/useHistorial.ts`). (Worklog `2026-09-28/04`.)
4. **Registrar entreno** (`TrainingSelector`): se puede cargar **cualquier día hasta hoy** (la fecha
   de arriba se toca) y **varios entrenos por día**. Foto **opcional** (cámara o galería) →
   **tu categoría** (opcional: precarga tipo, músculos y nombre) → **tipo** (gym / fútbol / running / otro) → si es gym, **músculos** tocando el cuerpo
   (frente y espalda, modelo hombre o mujer; atajos Push/Pull/Legs/Torso/Core; o lista)
   → **etiqueta** libre opcional (sugiere las del usuario) → PRs opcionales → mensaje.
   Comprime la foto, la sube a Storage y crea el doc en `asistencias`. (Worklog `2026-09-28/03`.)
5. **Muro** (`Feed`): últimos entrenos del grupo (foto con el cuerpito de los músculos,
   etiqueta, tipo/músculos, notas, PRs), ordenados por fecha/hora.
6. **Ranking/Stats** (`Stats`): panel personal (constancia %, racha actual y récord,
   progreso de la semana contra la meta semanal, heatmap del año calendario) +
   **por músculo** (mapa de calor del cuerpo, días por músculo, olvidados ≥14 días, tren
   superior vs. inferior, "reyes" de cada zona del grupo) + ranking con podio y desglose
   por tipo + entrenos por tipo + heatmap anual. Períodos: semana / mes / año.
7. **Detalle de día** (`DetalleDia`, en un panel inferior): quién del grupo entrenó ese día,
   y **editar/borrar lo propio** (incluso días pasados). Si no registraste, "Registrar este día".
8. **Ajustes** (`Settings`): modelo del cuerpo (hombre/mujer), meta semanal (1 a 7 días),
   "Tus categorías" (nombre, tipo, músculos preseleccionados y **si suma al ranking**; se ocultan,
   no se borran), cambiar de
   grupo, admin del grupo / aprobaciones (si corresponde) y **cerrar sesión** (con confirmación).
9. **Admin**: gestionar miembros del grupo. **Aprobaciones**: aprobar/rechazar
   usuarios globalmente (solo admin maestro).

## 4. Reglas de dominio

- **"Día entrenado"**: suma lo que la **categoría de cada usuario** diga (`categorias.cuenta`):
  mi "Fútbol" puede no sumar y el de otro sí. Sin categoría, suma. Se decide **al leer**
  (`utils/entrenos.ts → cuentaDe`): cambiar la categoría cambia también lo pasado. Se cuentan
  **días únicos**: dos entrenos el mismo día = 1 día (si alguno suma). Músculos y "por tipo"
  cuentan todo, sume o no. (Del 2026-09-28 a la mañana siguiente rigió "todo suma".)
- **Tipo y músculos**: los entrenos nuevos traen `tipo` y `musculos[]`. Los viejos se
  interpretan al leer (`utils/entrenos.ts`, **sin migrar datos**): el tipo sale del nombre
  de la categoría ("Futbol" → fútbol, "Hikking" → otro, si no gym) y los músculos también
  ("Pierna-hombro" → piernas + hombros). Lo que no se reconoce ("Minubi 🥵") suma al
  ranking pero no al mapa de músculos.
- **Categorías** (colección `categorias`): **por usuario**, plantillas de entreno (tipo, músculos
  preseleccionados, si suma). Se ocultan (`activo=false`), no se borran: los entrenos viejos
  muestran su nombre y siguen sumando según ella. La **etiqueta** del entreno es texto libre aparte.
- **Racha (`streak`)**: días consecutivos hasta hoy (o ayer) con al menos una
  asistencia. Se calcula en tiempo real con `onSnapshot` (`useStreak`).
- **Medallas** (`gamificationService`): por volumen (1/10/50 entrenos) y por
  horario (madrugador <8am, noctámbulo ≥21hs), derivadas del `timestamp`.
- **Foto opcional** (desde 2026-09-28; antes era obligatoria): sin foto el entreno se guarda igual.

## 5. Modelo de datos (detalle)

### `asistencias` (el corazón de la app)
```
userId       string   uid de Firebase Auth (dueño; base de las reglas de seguridad)
userName     string   displayName al momento de registrar (se usa para agrupar/ranking)
fecha        string   "YYYY-MM-DD" en HORA LOCAL
timestamp    number   Date.now() al crear (orden del feed + medallas de horario)
tipo         string   "gym" | "futbol" | "running" | "otro"  (docs nuevos, desde 2026-09)
musculos     array    ids de config/entrenos.ts (solo si es gym; ej. ["pecho","triceps"])
etiqueta     string   texto libre opcional ("Push pesado")
categoriaId  string   LEGACY: docs viejos (o `catId`, más viejos). Los nuevos no lo escriben
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
tipo    string   "gym" | "futbol" | "running" | "otro"  (desde 2026-09; viejas: se deduce del nombre)
musculos array   preselección (solo gym; viejas: se deduce del nombre)
cuenta  bool     ¿los entrenos de esta categoría suman al ranking? (default: sí)
activo  bool     ¿aparece al registrar? (false = oculta; no se borran)
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
sexo?     "hombre" | "mujer"  modelo del cuerpo (registro, muro, stats). Default: hombre.
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
2. **Aislamiento entre grupos: resuelto** (fase 2, 2026-09-28). Cada uno lee solo sus grupos,
   los entrenos de sus grupos y su propio doc de `usuarios`. Crear y unirse van por Cloud
   Functions. Quedan abiertos, a sabiendas: los **nombres** de `categorias` (el muro los usa
   para los entrenos viejos) y las **fotos** (el link de Storage es una llave: lo ve solo quien
   puede leer el entreno). Si las Functions se caen, no se puede crear ni unirse a grupos.
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
