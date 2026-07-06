const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");

const { ADMIN_EMAIL, MIEMBROS_MILLER, CATEGORIAS_POR_DEFECTO } = require("../constants");

// NOTA: initializeApp() se llama UNA sola vez de forma centralizada en index.js.
// Llamarlo aquí de nuevo lanzaría "The default Firebase app already exists" y
// tumbaría el arranque (cold start) de TODAS las Cloud Functions.

/**
 * Trigger: Se ejecuta automáticamente cuando se crea un nuevo usuario en Firebase Auth.
 * Crea el documento en la colección 'usuarios' y restaura categorías si corresponde.
 */
exports.onUserCreated = onDocumentCreated(
  { document: "usuarios/{email}", region: "us-central1" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const email = event.params.email;

    // Si ya tiene estado definido, no hacemos nada
    if (data.estado) return;

    const db = getFirestore();
    const isVip = MIEMBROS_MILLER.includes(email);
    const estado = (email === ADMIN_EMAIL || isVip) ? "aprobado" : "pendiente";

    await snap.ref.update({ estado });

    // Restaurar categorías para usuarios VIP si no tienen ninguna
    if (estado === "aprobado" && CATEGORIAS_POR_DEFECTO[email] && data.uid) {
      const catSnap = await db
        .collection("categorias")
        .where("userId", "==", data.uid)
        .get();

      if (catSnap.empty) {
        const batch = db.batch();
        for (const nombre of CATEGORIAS_POR_DEFECTO[email]) {
          const ref = db.collection("categorias").doc();
          batch.set(ref, {
            userId: data.uid,
            nombre,
            cuenta: true,
            activo: true,
          });
        }
        await batch.commit();
        console.log(`✅ Categorías restauradas para ${email}`);
      }
    }
  }
);
