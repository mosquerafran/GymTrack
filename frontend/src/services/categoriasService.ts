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
import { Categoria } from "../types";

/**
 * Carga todas las categorías de un usuario.
 */
export const cargarCategorias = async (userId: string): Promise<Categoria[]> => {
  const q = query(collection(db, "categorias"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, 'id'>) }));
};

/**
 * Carga categorías activas de un usuario (para el selector de entrenamiento).
 */
export const cargarCategoriasActivas = async (userId: string): Promise<Categoria[]> => {
  const todas = await cargarCategorias(userId);
  return todas.filter((c) => c.activo !== false);
};

/**
 * Carga un mapa de TODAS las categorías (todas los usuarios), por ID.
 * Usado en stats y en el detalle de días.
 */
export const cargarMapaCategorias = async (): Promise<Record<string, Categoria>> => {
  const snap = await getDocs(collection(db, "categorias"));
  const mapa: Record<string, Categoria> = {};
  snap.docs.forEach((d) => {
    mapa[d.id] = { id: d.id, ...(d.data() as Omit<Categoria, 'id'>) };
  });
  return mapa;
};

/**
 * Crea una nueva categoría.
 */
export const crearCategoria = async ({ userId, nombre, cuenta }: { userId: string, nombre: string, cuenta: boolean }): Promise<void> => {
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
export const eliminarCategoria = async (catId: string): Promise<void> => {
  await deleteDoc(doc(db, "categorias", catId));
};

/**
 * Renombra una categoría.
 */
export const renombrarCategoria = async (catId: string, nuevoNombre: string): Promise<void> => {
  await updateDoc(doc(db, "categorias", catId), { nombre: nuevoNombre.trim() });
};

/**
 * Alterna el flag 'cuenta' de una categoría.
 */
export const toggleCuentaCategoria = async (catId: string, valorActual: boolean): Promise<void> => {
  await updateDoc(doc(db, "categorias", catId), { cuenta: !valorActual });
};

/**
 * Actualiza el estado 'activo' de una categoría.
 */
export const toggleActivoCategoria = async (catId: string, valorActual: boolean): Promise<void> => {
  await updateDoc(doc(db, "categorias", catId), { activo: !valorActual });
};
