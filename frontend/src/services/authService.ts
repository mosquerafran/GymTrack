import { db, auth } from "../config/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signOut, User as FirebaseUser } from "firebase/auth";
import { ADMIN_EMAIL, MIEMBROS_MILLER } from "../config/constants";
import { Usuario, EstadoUsuario } from "../types";

const functions = getFunctions();
const verificarAccesoFn = httpsCallable<{estado?: EstadoUsuario}, {estado: EstadoUsuario}>(functions, "verificarAcceso");

/**
 * Verifica el estado de acceso de un usuario.
 * Primero intenta usar la Cloud Function del backend.
 * Si falla (ej: Functions no desplegado aún), cae en el fallback local.
 */
export const verificarEstadoUsuario = async (user: FirebaseUser): Promise<EstadoUsuario> => {
  try {
    // Intentar via Cloud Function (backend)
    const result = await verificarAccesoFn();
    return result.data.estado;
  } catch (err: any) {
    // Fallback local si la Cloud Function no está disponible
    console.warn("Cloud Function no disponible, usando fallback local:", err.message);
    return _verificarEstadoLocal(user);
  }
};

/**
 * Fallback local: misma lógica que antes en App.js pero encapsulada aquí.
 * @private
 */
async function _verificarEstadoLocal(user: FirebaseUser): Promise<EstadoUsuario> {
  const isVip = MIEMBROS_MILLER.includes(user.email || '');

  if (user.email === ADMIN_EMAIL || isVip) {
    await setDoc(
      doc(db, "usuarios", user.email as string),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        estado: "aprobado",
        creadoEn: new Date().toISOString(),
      },
      { merge: true }
    );
    return "aprobado";
  }

  // Buscar en 'usuarios'
  const docSnap = await getDoc(doc(db, "usuarios", user.email as string));
  if (docSnap.exists()) {
    const { estado } = docSnap.data() as Usuario;
    if (estado === "rechazado") await signOut(auth);
    return estado;
  }

  // Migración desde colecciones viejas
  let userData: any = null;
  const oldDocSnap = await getDoc(doc(db, "usuariosPendientes", user.email as string));
  if (oldDocSnap.exists()) {
    userData = oldDocSnap.data();
  } else {
    const qOld = query(collection(db, "usuariosPendientes"), where("email", "==", user.email));
    const snapOld = await getDocs(qOld);
    if (!snapOld.empty) userData = snapOld.docs[0].data();
  }

  if (!userData) {
    const qPerm = query(collection(db, "usuariosPermitidos"), where("email", "==", user.email));
    const snapPerm = await getDocs(qPerm);
    if (!snapPerm.empty) userData = { ...snapPerm.docs[0].data(), estado: "aprobado" };
  }

  if (userData) {
    const finalData: Usuario = {
      uid: user.uid,
      email: user.email as string,
      displayName: user.displayName || userData.displayName || "",
      photoURL: user.photoURL || userData.photoURL || "",
      estado: userData.estado || "aprobado",
      creadoEn: userData.creadoEn || new Date().toISOString(),
      migrado: true,
    };
    await setDoc(doc(db, "usuarios", user.email as string), finalData);
    return finalData.estado;
  }

  // Usuario nuevo
  const newUser: Usuario = {
    uid: user.uid,
    email: user.email as string,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    estado: "aprobado",
    creadoEn: new Date().toISOString(),
  };
  await setDoc(doc(db, "usuarios", user.email as string), newUser);
  return "aprobado";
}

/**
 * Obtiene todos los usuarios de la colección 'usuarios'.
 * Solo para uso del Admin.
 */
export const obtenerUsuarios = async (): Promise<{pendientes: Usuario[], aprobados: Usuario[]}> => {
  const snap = await getDocs(collection(db, "usuarios"));
  const pendientes: Usuario[] = [];
  const aprobados: Usuario[] = [];
  snap.forEach((d) => {
    const data = { id: d.id, ...d.data() } as any;
    if (data.estado === "pendiente") pendientes.push(data as Usuario);
    else if (data.estado === "aprobado") aprobados.push(data as Usuario);
  });
  return { pendientes, aprobados };
};
