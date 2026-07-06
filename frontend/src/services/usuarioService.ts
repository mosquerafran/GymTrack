import { db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Usuario, META_SEMANAL_DEFAULT } from "../types";

/**
 * Configuración personal del usuario que vive en su propio doc `usuarios/{email}`.
 * Las reglas de Firestore solo permiten que cada uno escriba su propio documento.
 */

/** Lee la meta semanal (días/semana) del usuario. Devuelve el default si no está. */
export const obtenerMetaSemanal = async (email: string): Promise<number> => {
  const snap = await getDoc(doc(db, "usuarios", email));
  const meta = snap.exists() ? (snap.data() as Usuario).metaSemanal : undefined;
  return typeof meta === "number" && meta > 0 ? meta : META_SEMANAL_DEFAULT;
};

/** Guarda la meta semanal del usuario (acotada a 1–7 días). Merge: no pisa el resto. */
export const actualizarMetaSemanal = async (email: string, meta: number): Promise<void> => {
  const valor = Math.min(7, Math.max(1, Math.round(meta)));
  await setDoc(doc(db, "usuarios", email), { metaSemanal: valor }, { merge: true });
};
