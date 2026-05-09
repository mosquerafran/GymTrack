import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { User as FirebaseUser } from "firebase/auth";
import { ADMIN_EMAIL, MIEMBROS_MILLER } from "../config/constants";
import { Grupo } from "../types";

/**
 * Genera un código de invitación único con el formato GYM-XXXX.
 */
const generarCodigo = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GYM-";
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

/**
 * Carga los grupos donde el usuario es miembro.
 * Para usuarios VIP también verifica y repara el grupo Miller.
 */
export const cargarGruposDeUsuario = async (user: FirebaseUser): Promise<Grupo[]> => {
  if (!user.email) return [];
  const isVip = MIEMBROS_MILLER.includes(user.email);

  // Solo VIP/Admin verifican el grupo Miller en el cliente
  // (la función backend también lo hace diariamente, esto es un seguro extra)
  if (user.email === ADMIN_EMAIL || isVip) {
    const allSnap = await getDocs(collection(db, "grupos"));
    const millerDoc = allSnap.docs.find((d) => (d.data() as Grupo).nombre === "Gym ave Miller 2026");

    if (millerDoc) {
      const currentMiembros = (millerDoc.data() as Grupo).miembros || [];
      const missing = MIEMBROS_MILLER.filter((m) => !currentMiembros.includes(m));
      if (missing.length > 0) {
        await updateDoc(doc(db, "grupos", millerDoc.id), {
          miembros: [...new Set([...currentMiembros, ...MIEMBROS_MILLER])],
        });
      }
    }
  }

  const q = query(collection(db, "grupos"), where("miembros", "array-contains", user.email));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Grupo, 'id'>) }));
};

/**
 * Crea un nuevo grupo con el usuario como admin.
 */
export const crearGrupo = async (nombre: string, userEmail: string): Promise<string> => {
  const ref = await addDoc(collection(db, "grupos"), {
    nombre: nombre.trim(),
    adminEmail: userEmail,
    miembros: [userEmail],
    codigoInvitacion: generarCodigo(),
    creadoEn: new Date().toISOString(),
  });
  return ref.id;
};

/**
 * Une al usuario a un grupo usando un código de invitación.
 */
export const unirseConCodigo = async (codigo: string, userEmail: string): Promise<Grupo> => {
  const q = query(
    collection(db, "grupos"),
    where("codigoInvitacion", "==", codigo.trim().toUpperCase())
  );
  const snap = await getDocs(q);

  if (snap.empty) throw new Error("Código inválido. No se encontró ningún grupo.");

  const grupoDoc = snap.docs[0];
  const data = grupoDoc.data() as Grupo;

  if (data.miembros?.includes(userEmail)) throw new Error("Ya sos miembro de este grupo.");

  const nuevosMiembros = [...(data.miembros || []), userEmail];

  await updateDoc(doc(db, "grupos", grupoDoc.id), {
    miembros: nuevosMiembros,
  });

  return { id: grupoDoc.id, ...data, miembros: nuevosMiembros };
};

/**
 * Carga el grupo guardado en localStorage y verifica que siga existiendo.
 */
export const cargarGrupoGuardado = async (userEmail: string): Promise<Grupo | null> => {
  const savedGrupoId = localStorage.getItem("grupoActivo");
  if (!savedGrupoId) return null;

  const snap = await getDoc(doc(db, "grupos", savedGrupoId));
  if (snap.exists() && (snap.data() as Grupo).miembros?.includes(userEmail)) {
    return { id: snap.id, ...(snap.data() as Omit<Grupo, 'id'>) };
  }

  localStorage.removeItem("grupoActivo");
  return null;
};

/**
 * Carga los miembros de un grupo.
 */
export const cargarMiembrosGrupo = async (grupoId: string, codigoInvitacion: string): Promise<string[]> => {
  const snap = await getDocs(
    query(collection(db, "grupos"), where("codigoInvitacion", "==", codigoInvitacion))
  );
  if (snap.empty) return [];
  return (snap.docs[0].data() as Grupo).miembros || [];
};

/**
 * Agrega un miembro a un grupo por email.
 */
export const agregarMiembro = async (grupoId: string, miembrosActuales: string[], nuevoEmail: string): Promise<void> => {
  await updateDoc(doc(db, "grupos", grupoId), {
    miembros: [...miembrosActuales, nuevoEmail],
  });
};

/**
 * Elimina un miembro de un grupo.
 */
export const eliminarMiembro = async (grupoId: string, miembrosActuales: string[], email: string): Promise<void> => {
  await updateDoc(doc(db, "grupos", grupoId), {
    miembros: miembrosActuales.filter((m) => m !== email),
  });
};
