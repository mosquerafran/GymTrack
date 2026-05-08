const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");

const { CATEGORIAS_POR_DEFECTO } = require("../constants");

/**
 * Callable Function: restaurarCategorias
 *
 * Restaura las categorías personales de un usuario si no tiene ninguna.
 * Puede ser llamada manualmente desde el frontend (ej: desde Settings).
 *
 * Retorna: { restauradas: number, mensaje: string }
 */
exports.restaurarCategorias = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Se requiere autenticación.");
  }

  const { uid, email } = request.auth;
  const categoriasPorDefecto = CATEGORIAS_POR_DEFECTO[email];

  if (!categoriasPorDefecto) {
    return { restauradas: 0, mensaje: "No hay categorías por defecto para este usuario." };
  }

  const db = getFirestore();
  const snap = await db.collection("categorias").where("userId", "==", uid).get();

  if (!snap.empty) {
    return { restauradas: 0, mensaje: "El usuario ya tiene categorías. No se restauró nada." };
  }

  const batch = db.batch();
  for (const nombre of categoriasPorDefecto) {
    const ref = db.collection("categorias").doc();
    batch.set(ref, { userId: uid, nombre, cuenta: true, activo: true });
  }
  await batch.commit();

  console.log(`✅ ${categoriasPorDefecto.length} categorías restauradas para ${email}`);
  return {
    restauradas: categoriasPorDefecto.length,
    mensaje: `Se restauraron ${categoriasPorDefecto.length} categorías correctamente.`,
  };
});
