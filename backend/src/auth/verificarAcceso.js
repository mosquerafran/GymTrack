const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const { ADMIN_EMAIL, MIEMBROS_MILLER, CATEGORIAS_POR_DEFECTO } = require("../constants");

/**
 * Callable Function: verificarAcceso
 *
 * El frontend la llama al hacer login. Centraliza toda la lógica que antes
 * estaba en verificarEstado() en App.js:
 * - Verificar si es VIP/Admin → siempre aprobado
 * - Buscar en la colección 'usuarios'
 * - Migrar datos de colecciones viejas ('usuariosPendientes', 'usuariosPermitidos')
 * - Crear usuario nuevo como aprobado
 *
 * Retorna: { estado: "aprobado" | "pendiente" | "rechazado" }
 */
exports.verificarAcceso = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Se requiere autenticación.");
  }

  const { uid, email } = request.auth;
  const displayName = request.auth.token?.name || "";
  const photoURL = request.auth.token?.picture || "";
  const db = getFirestore();

  const isVip = MIEMBROS_MILLER.includes(email);

  // ── 1. Admin maestro o VIP: siempre aprobado ──────────────────────────────
  if (email === ADMIN_EMAIL || isVip) {
    await db.collection("usuarios").doc(email).set(
      { uid, email, displayName, photoURL, estado: "aprobado", creadoEn: new Date().toISOString() },
      { merge: true }
    );
    await _restaurarCategoriasInterno(db, uid, email);
    return { estado: "aprobado" };
  }

  // ── 2. Buscar en la colección 'usuarios' ──────────────────────────────────
  const docRef = db.collection("usuarios").doc(email);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const estado = docSnap.data().estado;
    if (estado === "aprobado") await _restaurarCategoriasInterno(db, uid, email);
    return { estado };
  }

  // ── 3. Migración desde 'usuariosPendientes' ────────────────────────────────
  let userData = null;
  const oldDocSnap = await db.collection("usuariosPendientes").doc(email).get();
  if (oldDocSnap.exists) {
    userData = oldDocSnap.data();
  } else {
    const qOld = await db.collection("usuariosPendientes").where("email", "==", email).get();
    if (!qOld.empty) userData = qOld.docs[0].data();
  }

  // ── 4. Migración desde 'usuariosPermitidos' ────────────────────────────────
  if (!userData) {
    const qPerm = await db.collection("usuariosPermitidos").where("email", "==", email).get();
    if (!qPerm.empty) userData = { ...qPerm.docs[0].data(), estado: "aprobado" };
  }

  // ── 5. Si encontramos datos viejos, migrar ─────────────────────────────────
  if (userData) {
    const finalData = {
      uid,
      email,
      displayName: displayName || userData.displayName || "",
      photoURL: photoURL || userData.photoURL || "",
      estado: userData.estado || "aprobado",
      creadoEn: userData.creadoEn || new Date().toISOString(),
      migrado: true,
    };
    await docRef.set(finalData);
    if (finalData.estado === "aprobado") await _restaurarCategoriasInterno(db, uid, email);
    return { estado: finalData.estado };
  }

  // ── 6. Usuario nuevo: auto-aprobar ────────────────────────────────────────
  const newUser = {
    uid, email, displayName, photoURL,
    estado: "aprobado",
    creadoEn: new Date().toISOString(),
  };
  await docRef.set(newUser);
  await _restaurarCategoriasInterno(db, uid, email);
  return { estado: "aprobado" };
});

/**
 * Restaura las categorías personales de un usuario VIP si no tiene ninguna.
 * @private
 */
async function _restaurarCategoriasInterno(db, uid, email) {
  const categoriasPorDefecto = CATEGORIAS_POR_DEFECTO[email];
  if (!categoriasPorDefecto) return;

  const snap = await db.collection("categorias").where("userId", "==", uid).get();
  if (!snap.empty) return;

  console.log(`🔧 Restaurando categorías para ${email}...`);
  const batch = db.batch();
  for (const nombre of categoriasPorDefecto) {
    const ref = db.collection("categorias").doc();
    batch.set(ref, { userId: uid, nombre, cuenta: true, activo: true });
  }
  await batch.commit();
}
