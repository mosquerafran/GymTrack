import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { User as FirebaseUser } from "firebase/auth";
import { Grupo } from "../types";

// Crear y unirse pasan por Cloud Functions (seguridad fase 2): las rules no dejan leer
// grupos ajenos, así que buscar un código entre todos los grupos solo lo hace el servidor.
// Ver backend/src/grupos/gestionGrupos.js.
const functions = getFunctions();
const crearGrupoFn = httpsCallable<{ nombre: string }, { id: string; codigoInvitacion: string }>(functions, "crearGrupo");
const unirseAGrupoFn = httpsCallable<{ codigo: string }, { id: string; nombre: string }>(functions, "unirseAGrupo");

/** Mensaje de un error de callable (el servidor manda textos pensados para el usuario). */
const mensajeDe = (e: unknown, porDefecto: string): string => {
  const err = e as { code?: string; message?: string };
  if (err?.code === "functions/unavailable" || err?.code === "functions/internal") return porDefecto;
  return err?.message || porDefecto;
};

/**
 * Carga los grupos donde el usuario es miembro.
 * (Los VIP del grupo Miller los repara la función programada `repararMiembrosVip`.)
 */
export const cargarGruposDeUsuario = async (user: FirebaseUser): Promise<Grupo[]> => {
  if (!user.email) return [];
  const q = query(collection(db, "grupos"), where("miembros", "array-contains", user.email));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Grupo, "id">) }));
};

/** Crea un grupo con el usuario como admin (el servidor genera un código único). */
export const crearGrupo = async (nombre: string): Promise<string> => {
  try {
    const { data } = await crearGrupoFn({ nombre: nombre.trim() });
    return data.id;
  } catch (e) {
    throw new Error(mensajeDe(e, "No se pudo crear el grupo. Probá de nuevo en un rato."));
  }
};

/** Une al usuario a un grupo con su código de invitación. */
export const unirseConCodigo = async (codigo: string): Promise<{ id: string; nombre: string }> => {
  try {
    const { data } = await unirseAGrupoFn({ codigo: codigo.trim().toUpperCase() });
    return data;
  } catch (e) {
    throw new Error(mensajeDe(e, "No se pudo unir al grupo. Probá de nuevo en un rato."));
  }
};

/**
 * Carga el grupo guardado en localStorage y verifica que siga existiendo.
 */
export const cargarGrupoGuardado = async (userEmail: string): Promise<Grupo | null> => {
  const savedGrupoId = localStorage.getItem("grupoActivo");
  if (!savedGrupoId) return null;

  try {
    const snap = await getDoc(doc(db, "grupos", savedGrupoId));
    if (snap.exists() && (snap.data() as Grupo).miembros?.includes(userEmail)) {
      return { id: snap.id, ...(snap.data() as Omit<Grupo, "id">) };
    }
  } catch {
    // Sin permiso (ya no es miembro): las rules no dejan leerlo. Se trata como "no existe".
  }

  localStorage.removeItem("grupoActivo");
  return null;
};

/** Miembros actuales de un grupo (lee el doc por id). */
export const cargarMiembrosGrupo = async (grupoId: string): Promise<string[]> => {
  const snap = await getDoc(doc(db, "grupos", grupoId));
  return snap.exists() ? (snap.data() as Grupo).miembros || [] : [];
};

/** Agrega un miembro por email (solo el admin del grupo; atómico). */
export const agregarMiembro = async (grupoId: string, nuevoEmail: string): Promise<void> => {
  await updateDoc(doc(db, "grupos", grupoId), { miembros: arrayUnion(nuevoEmail) });
};

/** Quita un miembro (el admin a cualquiera, o uno a sí mismo; atómico). */
export const eliminarMiembro = async (grupoId: string, email: string): Promise<void> => {
  await updateDoc(doc(db, "grupos", grupoId), { miembros: arrayRemove(email) });
};
