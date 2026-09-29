// Tests de firestore.rules y storage.rules contra el EMULADOR (proyecto demo-*,
// nunca producción). Correr con `npm test` desde tests/rules (necesita Java).
//
// Cada bloque prueba dos cosas: que el abuso falla y que el flujo real de la app
// (el que hacen los services del frontend) sigue funcionando.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

const ADMIN = { uid: "u-admin", email: "mosquerafran265@gmail.com" }; // ADMIN_EMAIL
const ANA = { uid: "u-ana", email: "ana@example.com" }; // admin del grupo g1
const BETO = { uid: "u-beto", email: "beto@example.com" }; // miembro de g1
const CARLA = { uid: "u-carla", email: "carla@example.com" }; // no es miembro de g1

let env;

const db = (u, verificado = true) =>
  env.authenticatedContext(u.uid, { email: u.email, email_verified: verificado }).firestore();
const storage = (u) =>
  env.authenticatedContext(u.uid, { email: u.email, email_verified: true }).storage();

const grupoG1 = {
  nombre: "Los del gym",
  adminEmail: ANA.email,
  miembros: [ANA.email, BETO.email],
  codigoInvitacion: "GYM-AB12",
  creadoEn: "2026-01-01T00:00:00.000Z",
};

// Lo que escribe guardarAsistencia (asistenciasService.ts)
const nuevaAsistencia = (u, extra = {}) => ({
  userId: u.uid,
  userName: "Beto",
  fecha: "2026-09-28",
  timestamp: Date.now(),
  categoriaId: "cat1",
  notas: "Piernas, sufrí",
  rutina: [{ nombre: "Sentadilla", peso: 100, reps: 5 }],
  imagenUrl: "https://firebasestorage.googleapis.com/v0/b/x/o/y.jpg",
  grupoId: "g1",
  likes: [],
  ...extra,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-gym-tracker",
    firestore: { rules: readFileSync(new URL("../../firestore.rules", import.meta.url), "utf8") },
    storage: { rules: readFileSync(new URL("../../storage.rules", import.meta.url), "utf8") },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const f = ctx.firestore();
    await setDoc(doc(f, "grupos/g1"), grupoG1);
    await setDoc(doc(f, "usuarios", BETO.email), {
      uid: BETO.uid, email: BETO.email, displayName: "Beto", estado: "aprobado",
    });
    await setDoc(doc(f, "usuarios", CARLA.email), {
      uid: CARLA.uid, email: CARLA.email, displayName: "Carla", estado: "rechazado",
    });
    await setDoc(doc(f, "usuarios", "pendiente@example.com"), {
      uid: "u-pend", email: "pendiente@example.com", estado: "pendiente",
    });
    await setDoc(doc(f, "asistencias/a1"), nuevaAsistencia(BETO));
    // Doc legacy: campo catId, sin grupo y con notas larguísimas.
    await setDoc(doc(f, "asistencias/legacy"), {
      userId: BETO.uid, userName: "Beto", fecha: "2025-01-10", timestamp: 1,
      catId: "cat-vieja", notas: "x".repeat(5000), grupoId: "",
    });
    await setDoc(doc(f, "grupos/g2"), {
      nombre: "Otro grupo", adminEmail: CARLA.email, miembros: [CARLA.email],
      codigoInvitacion: "GYM-ZZ22", creadoEn: "",
    });
    await setDoc(doc(f, "asistencias/ajena"), nuevaAsistencia(CARLA, { grupoId: "g2", userName: "Carla" }));
    await setDoc(doc(f, "usuariosPendientes", CARLA.email), { email: CARLA.email, estado: "pendiente" });
    await setDoc(doc(f, "usuariosPermitidos/viejo1"), { email: BETO.email });
    await setDoc(doc(f, "categorias/cat1"), { userId: BETO.uid, nombre: "Push", cuenta: true, activo: true });
    await setDoc(doc(f, "categorias/cat-larga"), { userId: BETO.uid, nombre: "n".repeat(80), cuenta: true });
  });
});

// ── Grupos ───────────────────────────────────────────────────────────────────
describe("grupos", () => {
  test("un miembro NO puede hacerse admin del grupo", async () => {
    await assertFails(updateDoc(doc(db(BETO), "grupos/g1"), { adminEmail: BETO.email }));
  });

  test("un miembro NO puede vaciar la lista de miembros", async () => {
    await assertFails(updateDoc(doc(db(BETO), "grupos/g1"), { miembros: [BETO.email] }));
  });

  test("un miembro NO puede cambiar el código de invitación", async () => {
    await assertFails(updateDoc(doc(db(BETO), "grupos/g1"), { codigoInvitacion: "GYM-ZZZZ" }));
  });

  test("un miembro NO puede borrar el grupo", async () => {
    await assertFails(deleteDoc(doc(db(BETO), "grupos/g1")));
  });

  test("fase 2: el cliente NO puede agregarse solo a un grupo (se une vía Cloud Function)", async () => {
    await assertFails(updateDoc(doc(db(CARLA), "grupos/g1"), {
      miembros: [...grupoG1.miembros, CARLA.email],
    }));
    await assertFails(updateDoc(doc(db(CARLA), "grupos/g1"), { miembros: arrayUnion(CARLA.email) }));
  });

  test("al unirse NO puede meter a otra persona", async () => {
    await assertFails(updateDoc(doc(db(CARLA), "grupos/g1"), {
      miembros: [...grupoG1.miembros, CARLA.email, "intruso@example.com"],
    }));
  });

  test("NO puede agregar a otro sin agregarse a sí mismo", async () => {
    await assertFails(updateDoc(doc(db(CARLA), "grupos/g1"), {
      miembros: [...grupoG1.miembros, "intruso@example.com"],
    }));
  });

  test("un miembro puede salirse a sí mismo (lista entera o arrayRemove)", async () => {
    await assertSucceeds(updateDoc(doc(db(BETO), "grupos/g1"), { miembros: arrayRemove(BETO.email) }));
  });

  test("un miembro NO puede sacar a otro", async () => {
    await assertFails(updateDoc(doc(db(BETO), "grupos/g1"), { miembros: arrayRemove(ANA.email) }));
  });

  test("con email NO verificado no puede unirse", async () => {
    await assertFails(updateDoc(doc(db(CARLA, false), "grupos/g1"), {
      miembros: [...grupoG1.miembros, CARLA.email],
    }));
  });

  test("el admin del grupo agrega y quita miembros (Admin.tsx, arrayUnion/arrayRemove)", async () => {
    await assertSucceeds(updateDoc(doc(db(ANA), "grupos/g1"), { miembros: arrayUnion("nuevo@example.com") }));
    await assertSucceeds(updateDoc(doc(db(ANA), "grupos/g1"), { miembros: arrayRemove(BETO.email) }));
  });

  test("el admin global edita un grupo ajeno", async () => {
    await assertSucceeds(updateDoc(doc(db(ADMIN), "grupos/g1"), {
      miembros: [...grupoG1.miembros, "vip@example.com"],
    }));
  });

  test("el admin del grupo puede borrarlo", async () => {
    await assertSucceeds(deleteDoc(doc(db(ANA), "grupos/g1")));
  });

  test("fase 2: el cliente NO crea grupos (crearGrupo es Cloud Function con código único)", async () => {
    await assertFails(setDoc(doc(db(CARLA), "grupos/g9"), {
      nombre: "Grupo de Carla", adminEmail: CARLA.email, miembros: [CARLA.email],
      codigoInvitacion: "GYM-X7K2", creadoEn: new Date().toISOString(),
    }));
  });

  test("crear grupo NO puede incluir a terceros ni un código inventado", async () => {
    await assertFails(setDoc(doc(db(CARLA), "grupos/g3"), {
      nombre: "Trampa", adminEmail: CARLA.email, miembros: [CARLA.email, BETO.email],
      codigoInvitacion: "GYM-X7K2", creadoEn: "",
    }));
    await assertFails(setDoc(doc(db(CARLA), "grupos/g4"), {
      nombre: "Trampa", adminEmail: CARLA.email, miembros: [CARLA.email],
      codigoInvitacion: "<script>", creadoEn: "",
    }));
  });

  test("un miembro lee su grupo y lista los suyos (cargarGruposDeUsuario)", async () => {
    await assertSucceeds(getDoc(doc(db(BETO), "grupos/g1")));
    const q = query(collection(db(BETO), "grupos"), where("miembros", "array-contains", BETO.email));
    await assertSucceeds(getDocs(q));
  });

  test("fase 2: NO lee grupos ajenos, ni listándolos ni buscando un código", async () => {
    await assertFails(getDoc(doc(db(CARLA), "grupos/g1")));
    await assertFails(getDocs(collection(db(CARLA), "grupos")));
    await assertFails(getDocs(query(collection(db(CARLA), "grupos"), where("codigoInvitacion", "==", "GYM-AB12"))));
  });

  test("el admin global lee cualquier grupo", async () => {
    await assertSucceeds(getDoc(doc(db(ADMIN), "grupos/g2")));
  });

  test("crear grupo a nombre de otro admin falla", async () => {
    await assertFails(setDoc(doc(db(CARLA), "grupos/g5"), {
      nombre: "X", adminEmail: ANA.email, miembros: [CARLA.email],
      codigoInvitacion: "GYM-AAAA", creadoEn: "",
    }));
  });
});

// ── Usuarios ─────────────────────────────────────────────────────────────────
describe("usuarios", () => {
  const nuevo = { uid: "u-nuevo", email: "nuevo@example.com" };

  test("un usuario nuevo crea su doc aprobado (fallback de authService)", async () => {
    await assertSucceeds(setDoc(doc(db(nuevo), "usuarios", nuevo.email), {
      uid: nuevo.uid, email: nuevo.email, displayName: "Nuevo", photoURL: "",
      estado: "aprobado", creadoEn: new Date().toISOString(),
    }));
  });

  test("NO puede crear su doc ya rechazado ni con uid ajeno", async () => {
    await assertFails(setDoc(doc(db(nuevo), "usuarios", nuevo.email), {
      uid: nuevo.uid, email: nuevo.email, estado: "rechazado",
    }));
    await assertFails(setDoc(doc(db(nuevo), "usuarios", nuevo.email), {
      uid: "otro-uid", email: nuevo.email, estado: "aprobado",
    }));
  });

  test("un rechazado NO puede auto-aprobarse", async () => {
    await assertFails(setDoc(doc(db(CARLA), "usuarios", CARLA.email), { estado: "aprobado" }, { merge: true }));
    await assertFails(updateDoc(doc(db(CARLA), "usuarios", CARLA.email), { estado: "aprobado" }));
  });

  test("un pendiente NO puede auto-aprobarse", async () => {
    const pend = { uid: "u-pend", email: "pendiente@example.com" };
    await assertFails(updateDoc(doc(db(pend), "usuarios", pend.email), { estado: "aprobado" }));
  });

  test("nadie puede borrar su doc (para 'resetear' el estado)", async () => {
    await assertFails(deleteDoc(doc(db(CARLA), "usuarios", CARLA.email)));
  });

  test("guardar metaSemanal (usuarioService) funciona y valida el rango", async () => {
    await assertSucceeds(setDoc(doc(db(BETO), "usuarios", BETO.email), { metaSemanal: 4 }, { merge: true }));
    await assertFails(setDoc(doc(db(BETO), "usuarios", BETO.email), { metaSemanal: 9 }, { merge: true }));
  });

  test("elegir sexo (usuarioService.actualizarSexo) funciona y solo acepta hombre/mujer", async () => {
    await assertSucceeds(setDoc(doc(db(BETO), "usuarios", BETO.email), { sexo: "mujer" }, { merge: true }));
    await assertSucceeds(setDoc(doc(db(BETO), "usuarios", BETO.email), { sexo: "hombre" }, { merge: true }));
    await assertFails(setDoc(doc(db(BETO), "usuarios", BETO.email), { sexo: "<script>" }, { merge: true }));
  });

  test("el merge del fallback VIP (mismo estado) funciona", async () => {
    await assertSucceeds(setDoc(doc(db(BETO), "usuarios", BETO.email), {
      uid: BETO.uid, email: BETO.email, displayName: "Beto", photoURL: "",
      estado: "aprobado", creadoEn: new Date().toISOString(),
    }, { merge: true }));
  });

  test("NO puede escribir el doc de otro usuario", async () => {
    await assertFails(setDoc(doc(db(CARLA), "usuarios", BETO.email), { displayName: "hackeado" }, { merge: true }));
  });

  test("el admin global aprueba y rechaza (Aprobaciones)", async () => {
    await assertSucceeds(updateDoc(doc(db(ADMIN), "usuarios", "pendiente@example.com"), { estado: "aprobado" }));
    await assertSucceeds(updateDoc(doc(db(ADMIN), "usuarios", BETO.email), { estado: "rechazado" }));
  });

  test("el admin global NO puede tocar otros campos de un usuario", async () => {
    await assertFails(updateDoc(doc(db(ADMIN), "usuarios", BETO.email), { displayName: "x" }));
  });

  test("un no-admin NO puede aprobar a otro", async () => {
    await assertFails(updateDoc(doc(db(BETO), "usuarios", "pendiente@example.com"), { estado: "aprobado" }));
  });

  test("cada uno lee su propio doc (meta, sexo, fallback de verificarAcceso)", async () => {
    await assertSucceeds(getDoc(doc(db(BETO), "usuarios", BETO.email)));
  });

  test("fase 2: NO lee el doc de otro usuario ni lista todos", async () => {
    await assertFails(getDoc(doc(db(CARLA), "usuarios", BETO.email)));
    await assertFails(getDocs(collection(db(BETO), "usuarios")));
  });

  test("el admin global lista todos (Aprobaciones)", async () => {
    await assertSucceeds(getDocs(collection(db(ADMIN), "usuarios")));
  });

  test("legacy: cada uno lee solo su registro (por id o por email)", async () => {
    await assertSucceeds(getDoc(doc(db(CARLA), "usuariosPendientes", CARLA.email)));
    await assertSucceeds(getDocs(query(collection(db(BETO), "usuariosPermitidos"), where("email", "==", BETO.email))));
    await assertFails(getDoc(doc(db(BETO), "usuariosPendientes", CARLA.email)));
    await assertFails(getDocs(collection(db(BETO), "usuariosPermitidos")));
  });
});

// ── Asistencias ──────────────────────────────────────────────────────────────
describe("asistencias", () => {
  test("registrar un entreno en tu grupo funciona", async () => {
    await assertSucceeds(setDoc(doc(db(BETO), "asistencias/n1"), nuevaAsistencia(BETO)));
  });

  test("registrar con los campos nuevos tipo/musculos/etiqueta funciona", async () => {
    await assertSucceeds(setDoc(doc(db(BETO), "asistencias/n2"), nuevaAsistencia(BETO, {
      tipo: "gym", musculos: ["pecho", "triceps"], etiqueta: "Push",
    })));
  });

  test("registrar fútbol sin músculos y sin categoriaId (registro nuevo) funciona", async () => {
    const { categoriaId, ...sinCategoria } = nuevaAsistencia(BETO);
    await assertSucceeds(setDoc(doc(db(BETO), "asistencias/n2b"), {
      ...sinCategoria, tipo: "futbol", musculos: [], etiqueta: "",
    }));
  });

  test("NO acepta un tipo de entreno inventado", async () => {
    await assertFails(setDoc(doc(db(BETO), "asistencias/n2c"), nuevaAsistencia(BETO, { tipo: "hackeo" })));
  });

  test("editar un entreno viejo pasándolo al formato nuevo funciona", async () => {
    await assertSucceeds(updateDoc(doc(db(BETO), "asistencias/legacy"), {
      tipo: "gym", musculos: ["pecho"], etiqueta: "Push", timestampActualizacion: Date.now(),
    }));
  });

  test("NO puede registrar en un grupo del que no es miembro", async () => {
    await assertFails(setDoc(doc(db(CARLA), "asistencias/n3"), nuevaAsistencia(CARLA)));
  });

  test("NO puede registrar a nombre de otro userId", async () => {
    await assertFails(setDoc(doc(db(BETO), "asistencias/n4"), nuevaAsistencia(ANA)));
  });

  test("NO puede registrar sin grupo (grupoId vacío)", async () => {
    await assertFails(setDoc(doc(db(BETO), "asistencias/n5"), nuevaAsistencia(BETO, { grupoId: "" })));
  });

  test("NO puede registrar notas gigantes, rutina gigante ni likes precargados", async () => {
    await assertFails(setDoc(doc(db(BETO), "asistencias/n6"), nuevaAsistencia(BETO, { notas: "x".repeat(1001) })));
    await assertFails(setDoc(doc(db(BETO), "asistencias/n7"), nuevaAsistencia(BETO, {
      rutina: Array.from({ length: 31 }, () => ({ nombre: "x" })),
    })));
    await assertFails(setDoc(doc(db(BETO), "asistencias/n8"), nuevaAsistencia(BETO, { likes: [ANA.uid] })));
  });

  test("NO puede registrar con fecha en formato inválido", async () => {
    await assertFails(setDoc(doc(db(BETO), "asistencias/n9"), nuevaAsistencia(BETO, { fecha: "2026-09-28T03:00:00Z" })));
  });

  test("editar el propio entreno (actualizarAsistencia) funciona", async () => {
    await assertSucceeds(updateDoc(doc(db(BETO), "asistencias/a1"), {
      categoriaId: "cat2", notas: "Editado", rutina: [], imagenUrl: null,
      timestampActualizacion: Date.now(),
    }));
  });

  test("editar un doc legacy sin tocar sus campos raros funciona", async () => {
    await assertSucceeds(updateDoc(doc(db(BETO), "asistencias/legacy"), {
      categoriaId: "cat1", timestampActualizacion: Date.now(),
    }));
  });

  test("al editar NO puede cambiar dueño, grupo, fecha ni likes", async () => {
    const ref = doc(db(BETO), "asistencias/a1");
    await assertFails(updateDoc(ref, { userId: ANA.uid }));
    await assertFails(updateDoc(ref, { grupoId: "otro" }));
    await assertFails(updateDoc(ref, { fecha: "2020-01-01" }));
    await assertFails(updateDoc(ref, { userName: "Ana" }));
    await assertFails(updateDoc(ref, { likes: [BETO.uid, "x", "y"] }));
  });

  test("NO puede editar ni borrar el entreno de otro", async () => {
    await assertFails(updateDoc(doc(db(ANA), "asistencias/a1"), { notas: "jaja" }));
    await assertFails(deleteDoc(doc(db(ANA), "asistencias/a1")));
  });

  test("borrar el propio entreno funciona", async () => {
    await assertSucceeds(deleteDoc(doc(db(BETO), "asistencias/a1")));
  });

  test("un miembro lee los entrenos de su grupo con las queries de la app", async () => {
    const f = db(ANA);
    await assertSucceeds(getDoc(doc(f, "asistencias/a1")));
    // muro (cargarFeedGlobal), mes (cargarAsistenciasMes), stats, racha, calendario
    await assertSucceeds(getDocs(query(collection(f, "asistencias"), where("grupoId", "==", "g1"), orderBy("timestamp", "desc"))));
    await assertSucceeds(getDocs(query(collection(f, "asistencias"), where("grupoId", "==", "g1"),
      where("fecha", ">=", "2026-09-01"), where("fecha", "<=", "2026-09-30"))));
    await assertSucceeds(getDocs(query(collection(f, "asistencias"), where("userId", "==", ANA.uid), where("grupoId", "==", "g1"))));
    await assertSucceeds(getDocs(query(collection(f, "asistencias"), where("grupoId", "==", "g1"),
      where("userName", "==", "Beto"), where("fecha", ">=", "2026-09-01"), where("fecha", "<=", "2026-09-30"))));
  });

  test("fase 2: NO lee entrenos de otro grupo, ni una query sin filtro de grupo", async () => {
    await assertFails(getDoc(doc(db(BETO), "asistencias/ajena")));
    await assertFails(getDocs(query(collection(db(BETO), "asistencias"), where("grupoId", "==", "g2"))));
    await assertFails(getDocs(query(collection(db(BETO), "asistencias"),
      where("fecha", ">=", "2026-09-01"), where("fecha", "<=", "2026-09-30")))); // la query vieja del detalle
  });

  test("el dueño lee su entreno aunque haya dejado el grupo", async () => {
    await assertSucceeds(getDoc(doc(db(CARLA), "asistencias/ajena")));
  });

  test("guardar el sexo en el entreno: solo hombre/mujer", async () => {
    await assertSucceeds(setDoc(doc(db(BETO), "asistencias/s1"), nuevaAsistencia(BETO, { sexo: "mujer" })));
    await assertFails(setDoc(doc(db(BETO), "asistencias/s2"), nuevaAsistencia(BETO, { sexo: "robot" })));
    await assertSucceeds(updateDoc(doc(db(BETO), "asistencias/a1"), { sexo: "hombre", timestampActualizacion: 1 }));
  });
});

// ── Categorías ───────────────────────────────────────────────────────────────
describe("categorias", () => {
  test("crear, renombrar, togglear y borrar la propia funciona", async () => {
    await assertSucceeds(setDoc(doc(db(BETO), "categorias/nueva"), {
      userId: BETO.uid, nombre: "Legs", cuenta: true, activo: true,
    }));
    await assertSucceeds(updateDoc(doc(db(BETO), "categorias/cat1"), { nombre: "Push pesado" }));
    await assertSucceeds(updateDoc(doc(db(BETO), "categorias/cat1"), { cuenta: false }));
    await assertSucceeds(deleteDoc(doc(db(BETO), "categorias/cat1")));
  });

  test("togglear una categoría legacy con nombre largo funciona", async () => {
    await assertSucceeds(updateDoc(doc(db(BETO), "categorias/cat-larga"), { activo: false }));
  });

  test("NO puede pasarle su categoría a otro ni crear a nombre ajeno", async () => {
    await assertFails(updateDoc(doc(db(BETO), "categorias/cat1"), { userId: ANA.uid }));
    await assertFails(setDoc(doc(db(BETO), "categorias/x"), { userId: ANA.uid, nombre: "X" }));
  });

  test("NO acepta nombres gigantes", async () => {
    await assertFails(setDoc(doc(db(BETO), "categorias/y"), { userId: BETO.uid, nombre: "n".repeat(41) }));
  });
});

// ── Storage ──────────────────────────────────────────────────────────────────
describe("storage", () => {
  const jpg = (bytes) => new Uint8Array(bytes);

  test("subir una foto a tu carpeta funciona", async () => {
    await assertSucceeds(uploadBytes(ref(storage(BETO), `entrenamientos/${BETO.uid}/1.jpg`),
      jpg(100 * 1024), { contentType: "image/jpeg" }));
  });

  test("NO puede subir a la carpeta de otro", async () => {
    await assertFails(uploadBytes(ref(storage(BETO), `entrenamientos/${ANA.uid}/1.jpg`),
      jpg(1024), { contentType: "image/jpeg" }));
  });

  test("NO puede subir algo que no sea imagen", async () => {
    await assertFails(uploadBytes(ref(storage(BETO), `entrenamientos/${BETO.uid}/x.html`),
      jpg(1024), { contentType: "text/html" }));
  });

  test("NO puede subir archivos de más de 3 MB", async () => {
    await assertFails(uploadBytes(ref(storage(BETO), `entrenamientos/${BETO.uid}/big.jpg`),
      jpg(4 * 1024 * 1024), { contentType: "image/jpeg" }));
  });
});
