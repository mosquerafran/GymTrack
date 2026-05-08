import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

/**
 * Guarda un entrenamiento en Firestore.
 */
export const guardarAsistencia = async ({ userId, userName, fecha, categoriaId, notas, grupoId }) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  const fechaStr = `${y}-${m}-${d}`;

  await addDoc(collection(db, "asistencias"), {
    userId,
    userName,
    fecha: fechaStr,
    categoriaId,
    notas: notas?.trim() || "",
    grupoId: grupoId || "",
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
  await deleteDoc(doc(db, "asistencias", docId));
};
