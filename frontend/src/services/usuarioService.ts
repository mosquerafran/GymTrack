import { db } from "../config/firebase";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { Usuario, META_SEMANAL_DEFAULT } from "../types";
import { Sexo, SEXO_DEFAULT, esSexo } from "../config/entrenos";

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

/** Modelo del cuerpo del usuario (registro, muro, stats). Default: hombre. */
export const obtenerSexo = async (email: string): Promise<Sexo> => {
  const snap = await getDoc(doc(db, "usuarios", email));
  const sexo = snap.exists() ? (snap.data() as Usuario).sexo : undefined;
  return esSexo(sexo) ? sexo : SEXO_DEFAULT;
};

/** Guarda el modelo del cuerpo del usuario. Merge: no pisa el resto del doc. */
export const actualizarSexo = async (email: string, sexo: Sexo): Promise<void> => {
  await setDoc(doc(db, "usuarios", email), { sexo }, { merge: true });
  cacheSexos = null;
};

// Cache en memoria del sexo de cada usuario por uid (para dibujar el cuerpito del muro).
let cacheSexos: { en: number; mapa: Record<string, Sexo> } | null = null;
const TTL_SEXOS_MS = 5 * 60_000;

/** Mapa uid → sexo de todos los usuarios (los que no lo eligieron, con el default). */
export const cargarSexosPorUid = async (): Promise<Record<string, Sexo>> => {
  if (cacheSexos && Date.now() - cacheSexos.en < TTL_SEXOS_MS) return cacheSexos.mapa;
  const snap = await getDocs(collection(db, "usuarios"));
  const mapa: Record<string, Sexo> = {};
  snap.forEach((d) => {
    const u = d.data() as Usuario;
    if (u.uid) mapa[u.uid] = esSexo(u.sexo) ? u.sexo : SEXO_DEFAULT;
  });
  cacheSexos = { en: Date.now(), mapa };
  return mapa;
};
