import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

/**
 * Carga todas las categorías de un usuario.
 * @returns {Promise<Array>} Lista de categorías
 */
export const cargarCategorias = async (userId) => {
  const q = query(collection(db, "categorias"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Carga categorías activas de un usuario (para el selector de entrenamiento).
 */
export const cargarCategoriasActivas = async (userId) => {
  const todas = await cargarCategorias(userId);
  return todas.filter((c) => c.activo !== false);
};

/**
 * Carga un mapa de TODAS las categorías (todas los usuarios), por ID.
 * Usado en stats y en el detalle de días.
 * @returns {Promise<object>} { [catId]: { id, userId, nombre, cuenta, activo } }
 */
export const cargarMapaCategorias = async () => {
  const snap = await getDocs(collection(db, "categorias"));
  const mapa = {};
  snap.docs.forEach((d) => {
    mapa[d.id] = { id: d.id, ...d.data() };
  });
  return mapa;
};

/**
 * Crea una nueva categoría.
 */
export const crearCategoria = async ({ userId, nombre, cuenta }) => {
  await addDoc(collection(db, "categorias"), {
    userId,
    nombre: nombre.trim(),
    cuenta,
    activo: true,
  });
};

/**
 * Elimina una categoría por ID.
 */
export const eliminarCategoria = async (catId) => {
  await deleteDoc(doc(db, "categorias", catId));
};

/**
 * Renombra una categoría.
 */
export const renombrarCategoria = async (catId, nuevoNombre) => {
  await updateDoc(doc(db, "categorias", catId), { nombre: nuevoNombre.trim() });
};

/**
 * Alterna el flag 'cuenta' de una categoría.
 */
export const toggleCuentaCategoria = async (catId, valorActual) => {
  await updateDoc(doc(db, "categorias", catId), { cuenta: !valorActual });
};

/**
 * Actualiza el estado 'activo' de una categoría.
 */
export const toggleActivoCategoria = async (catId, valorActual) => {
  await updateDoc(doc(db, "categorias", catId), { activo: !valorActual });
};
