const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

/**
 * Crear un grupo y unirse con código pasan por acá (y no por el cliente) desde la
 * seguridad fase 2: las rules ya no dejan leer grupos ajenos, así que buscar un código
 * entre TODOS los grupos solo lo puede hacer el servidor. De paso garantiza códigos únicos.
 */

// Sin 0/O ni 1/I para que no se confundan al dictarlo.
const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INTENTOS_CODIGO = 10;

const generarCodigo = () => {
  let code = "GYM-";
  for (let i = 0; i < 4; i++) code += CARACTERES.charAt(Math.floor(Math.random() * CARACTERES.length));
  return code;
};

/** Usuario logueado con email verificado (Google siempre lo verifica). */
const exigirUsuario = (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Se requiere autenticación.");
  const { email, email_verified: verificado } = request.auth.token || {};
  if (!email || verificado !== true) {
    throw new HttpsError("permission-denied", "Tu cuenta no tiene un email verificado.");
  }
  return email.toLowerCase();
};

const codigoLibre = async (db) => {
  for (let i = 0; i < INTENTOS_CODIGO; i++) {
    const codigo = generarCodigo();
    const snap = await db.collection("grupos").where("codigoInvitacion", "==", codigo).limit(1).get();
    if (snap.empty) return codigo;
  }
  throw new HttpsError("resource-exhausted", "No se pudo generar un código. Probá de nuevo.");
};

/**
 * Callable: crearGrupo({ nombre }) → { id, codigoInvitacion }
 * El que lo crea queda como admin y único miembro.
 */
exports.crearGrupo = onCall({ region: "us-central1" }, async (request) => {
  const email = exigirUsuario(request);
  const nombre = typeof request.data?.nombre === "string" ? request.data.nombre.trim() : "";
  if (!nombre || nombre.length > 60) {
    throw new HttpsError("invalid-argument", "El nombre del grupo tiene que tener entre 1 y 60 caracteres.");
  }

  const db = getFirestore();
  const codigoInvitacion = await codigoLibre(db);
  const ref = await db.collection("grupos").add({
    nombre,
    adminEmail: email,
    miembros: [email],
    codigoInvitacion,
    creadoEn: new Date().toISOString(),
  });
  return { id: ref.id, codigoInvitacion };
});

/**
 * Callable: unirseAGrupo({ codigo }) → { id, nombre }
 * Busca el grupo por código y agrega al usuario (arrayUnion: nunca pisa a los demás).
 */
exports.unirseAGrupo = onCall({ region: "us-central1" }, async (request) => {
  const email = exigirUsuario(request);
  const codigo = typeof request.data?.codigo === "string" ? request.data.codigo.trim().toUpperCase() : "";
  if (!/^GYM-[A-Z0-9]{4,8}$/.test(codigo)) {
    throw new HttpsError("invalid-argument", "El código tiene la forma GYM-XXXX.");
  }

  const db = getFirestore();
  const snap = await db.collection("grupos").where("codigoInvitacion", "==", codigo).limit(2).get();
  if (snap.empty) throw new HttpsError("not-found", "Código inválido. No se encontró ningún grupo.");
  if (snap.size > 1) {
    // Códigos repetidos de antes de la fase 2: no adivinar a cuál quería entrar.
    throw new HttpsError("failed-precondition", "Ese código está repetido. Pedile al admin del grupo que te agregue por email.");
  }

  const grupo = snap.docs[0];
  if ((grupo.get("miembros") || []).includes(email)) {
    throw new HttpsError("already-exists", "Ya sos miembro de este grupo.");
  }
  await grupo.ref.update({ miembros: FieldValue.arrayUnion(email) });
  return { id: grupo.id, nombre: grupo.get("nombre") };
});

// Exportado para tests.
exports._generarCodigo = generarCodigo;
