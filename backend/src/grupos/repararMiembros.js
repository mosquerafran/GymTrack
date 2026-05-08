const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");

const { ADMIN_EMAIL, MIEMBROS_MILLER } = require("../constants");

/**
 * Scheduled Function: repararMiembrosVip
 *
 * Se ejecuta cada 24 horas. Verifica que todos los emails VIP (MIEMBROS_MILLER)
 * estén en el grupo "Gym ave Miller 2026". Antes esto lo hacía GrupoSelector.jsx
 * cada vez que cargaba, lo cual es incorrecto hacerlo en el cliente.
 */
exports.repararMiembrosVip = onSchedule(
  { schedule: "every 24 hours", region: "us-central1" },
  async () => {
    const db = getFirestore();

    const snap = await db.collection("grupos").get();
    if (snap.empty) {
      console.log("No hay grupos todavía.");
      return;
    }

    const millerDoc = snap.docs.find(d => d.data().nombre === "Gym ave Miller 2026");
    if (!millerDoc) {
      console.log("No se encontró el grupo 'Gym ave Miller 2026'.");
      return;
    }

    const currentMiembros = millerDoc.data().miembros || [];
    const missing = MIEMBROS_MILLER.filter(m => !currentMiembros.includes(m));

    if (missing.length > 0) {
      console.log(`🛠️ Reparando miembros faltantes: ${missing.join(", ")}`);
      await millerDoc.ref.update({
        miembros: [...new Set([...currentMiembros, ...MIEMBROS_MILLER])],
      });
      console.log("✅ Miembros reparados.");
    } else {
      console.log("✅ Todos los miembros VIP están correctamente en el grupo.");
    }
  }
);
