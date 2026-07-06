import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Categoria } from "../types";

/**
 * Cache en memoria de la colección de categorías.
 *
 * Las categorías cambian muy poco pero se leen en casi todas las pantallas
 * (Home, Feed, DiaDetalle, Stats). Antes cada vista releía la colección completa
 * en cada navegación. Ahora se lee una sola vez y se reutiliza durante `TTL_MS`;
 * las mutaciones (crear/borrar/renombrar/toggle) invalidan el cache.
 */
const TTL_MS = 60_000;
let _cache: { ts: number; docs: Categoria[] } | null = null;

/** Fuerza la próxima lectura a ir a Firestore (llamar tras cualquier escritura). */
export const invalidarCacheCategorias = (): void => {
  _cache = null;
};

const cargarTodas = async (): Promise<Categoria[]> => {
  if (_cache && Date.now() - _cache.ts < TTL_MS) return _cache.docs;
  const snap = await getDocs(collection(db, "categorias"));
  const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, "id">) }));
  _cache = { ts: Date.now(), docs };
  return docs;
};

/** Categorías de un usuario. */
export const cargarCategorias = async (userId: string): Promise<Categoria[]> => {
  const todas = await cargarTodas();
  return todas.filter((c) => c.userId === userId);
};

/** Categorías activas de un usuario (para el selector de entrenamiento). */
export const cargarCategoriasActivas = async (userId: string): Promise<Categoria[]> => {
  const todas = await cargarCategorias(userId);
  return todas.filter((c) => c.activo !== false);
};

/** Mapa de TODAS las categorías por ID (stats, detalle de días, feed). */
export const cargarMapaCategorias = async (): Promise<Record<string, Categoria>> => {
  const todas = await cargarTodas();
  const mapa: Record<string, Categoria> = {};
  todas.forEach((c) => {
    if (c.id) mapa[c.id] = c;
  });
  return mapa;
};

/** Crea una nueva categoría. */
export const crearCategoria = async ({ userId, nombre, cuenta }: { userId: string; nombre: string; cuenta: boolean }): Promise<void> => {
  await addDoc(collection(db, "categorias"), {
    userId,
    nombre: nombre.trim(),
    cuenta,
    activo: true,
  });
  invalidarCacheCategorias();
};

/** Elimina una categoría por ID. */
export const eliminarCategoria = async (catId: string): Promise<void> => {
  await deleteDoc(doc(db, "categorias", catId));
  invalidarCacheCategorias();
};

/** Renombra una categoría. */
export const renombrarCategoria = async (catId: string, nuevoNombre: string): Promise<void> => {
  await updateDoc(doc(db, "categorias", catId), { nombre: nuevoNombre.trim() });
  invalidarCacheCategorias();
};

/** Alterna el flag 'cuenta' de una categoría. */
export const toggleCuentaCategoria = async (catId: string, valorActual: boolean): Promise<void> => {
  await updateDoc(doc(db, "categorias", catId), { cuenta: !valorActual });
  invalidarCacheCategorias();
};

/** Actualiza el estado 'activo' de una categoría. */
export const toggleActivoCategoria = async (catId: string, valorActual: boolean): Promise<void> => {
  await updateDoc(doc(db, "categorias", catId), { activo: !valorActual });
  invalidarCacheCategorias();
};
