import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { storage } from "../config/firebase";
import { ref, deleteObject } from "firebase/storage";

/**
 * Guarda un entrenamiento en Firestore.
 */
export const guardarAsistencia = async ({ userId, userName, fecha, categoriaId, notas, grupoId, imagenUrl = null, rutina = [] }) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  const fechaStr = `${y}-${m}-${d}`;

  await addDoc(collection(db, "asistencias"), {
    userId,
    userName,
    fecha: fechaStr,
    timestamp: Date.now(), // Para ordenar el Feed y dar medallas de horario
    categoriaId,
    notas: notas?.trim() || "",
    rutina,      // Array de ejercicios: [{nombre, series: [{reps, peso}]}]
    imagenUrl,   // URL de la foto en Storage
    grupoId: grupoId || "",
    likes: [],   // Array de userIds que dieron "Fuego 🔥"
  });
};

/**
 * Carga todas las asistencias de un mes para un grupo.
 * @returns {Promise<object>} Mapa { "YYYY-MM-DD": { userName: [{ docId, catId, notas }] } }
 */
export const cargarAsistenciasMes = async (grupoId, fechaActual) => {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

  const inicioStr = inicioMes.toISOString().split("T")[0];
  const finStr = finMes.toISOString().split("T")[0];

  const q = query(
    collection(db, "asistencias"),
    where("fecha", ">=", inicioStr),
    where("fecha", "<=", finStr)
  );

  const snap = await getDocs(q);
  const mapa = {};

  snap.forEach((document) => {
    const data = document.data();
    if (grupoId && data.grupoId && data.grupoId !== grupoId) return;

    const fechaKey = data.fecha;
    const usr = data.userName || "Desconocido";

    if (!mapa[fechaKey]) mapa[fechaKey] = {};
    if (!mapa[fechaKey][usr]) mapa[fechaKey][usr] = [];

    mapa[fechaKey][usr].push({
      docId: document.id,
      catId: data.categoriaId,
      notas: data.notas || "",
    });
  });

  return mapa;
};

/**
 * Carga asistencias del mes solo del usuario (para el calendario personal).
 * @returns {Promise<object>} Mapa { "YYYY-MM-DD": [categoriaId] }
 */
export const cargarAsistenciasMesUsuario = async (grupoId, userName, fechaActual) => {
  const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

  const inicioStr = inicioMes.toISOString().split("T")[0];
  const finStr = finMes.toISOString().split("T")[0];

  const q = query(
    collection(db, "asistencias"),
    where("grupoId", "==", grupoId),
    where("userName", "==", userName),
    where("fecha", ">=", inicioStr),
    where("fecha", "<=", finStr)
  );

  const snap = await getDocs(q);
  const mapa = {};

  snap.forEach((document) => {
    const data = document.data();
    const fechaKey = data.fecha;
    if (!mapa[fechaKey]) mapa[fechaKey] = [];
    mapa[fechaKey].push(data.categoriaId);
  });

  return mapa;
};

/**
 * Carga asistencias para estadísticas (con filtro de grupo y período).
 */
export const cargarAsistenciasParaStats = async (grupoId, userId) => {
  const [snapMis, snapGlobal] = await Promise.all([
    getDocs(query(
      collection(db, "asistencias"),
      where("userId", "==", userId),
      where("grupoId", "==", grupoId)
    )),
    getDocs(query(
      collection(db, "asistencias"),
      where("grupoId", "==", grupoId)
    )),
  ]);

  return {
    misAsistencias: snapMis.docs,
    todasAsistencias: snapGlobal.docs,
  };
};

/**
 * Elimina un documento de asistencia.
 */
export const eliminarAsistencia = async (docId) => {
  const docRef = doc(db, "asistencias", docId);
  
  // 1. Intentamos obtener la URL de la imagen antes de borrar el documento
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.imagenUrl) {
        // 2. Si hay foto, la borramos del Storage
        const fotoRef = ref(storage, data.imagenUrl);
        await deleteObject(fotoRef).catch(e => console.warn("La foto ya no existía en Storage o hubo un error:", e));
      }
    }
  } catch (e) {
    console.error("Error al obtener datos para borrar foto:", e);
  }

  // 3. Borramos el documento de Firestore
  await deleteDoc(docRef);
};

/**
 * Carga el Muro de Actividad (Feed Global del grupo)
 * Trae los últimos 20 entrenamientos ordenados por fecha/hora
 */
export const cargarFeedGlobal = async (grupoId) => {
  const q = query(
    collection(db, "asistencias"),
    where("grupoId", "==", grupoId),
    // En Firestore, sin índices compuestos complejos, podemos ordenar en el cliente 
    // o requerir que el usuario cree un índice si falla.
    // Para simplificar y evitar errores de índice en producción, traemos los recientes.
  );

  const snap = await getDocs(q);
  const posts = [];
  
  snap.forEach((doc) => {
    posts.push({ id: doc.id, ...doc.data() });
  });

  // Ordenar en el cliente (más reciente primero)
  return posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 50);
};

export const toggleLike = async (docId, userId, isLiked) => {
  const docRef = doc(db, "asistencias", docId);
  await updateDoc(docRef, {
    likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
  });
};
