import type { Musculo, Sexo, TipoEntreno } from "../config/entrenos";

export type EstadoUsuario = 'aprobado' | 'pendiente' | 'rechazado' | null;

export interface Usuario {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  estado: EstadoUsuario;
  creadoEn: string;
  migrado?: boolean;
  metaSemanal?: number; // objetivo de días de entrenamiento por semana
  sexo?: Sexo; // modelo del cuerpo en el registro/muro/stats (default: hombre)
}

/** Meta semanal por defecto si el usuario no la configuró. */
export const META_SEMANAL_DEFAULT = 4;

export interface Grupo {
  id: string;
  nombre: string;
  adminEmail: string;
  fechaCreacion: string;
  miembros?: string[];
  codigoInvitacion: string;
}

export interface EjercicioRutina {
  nombre: string;
  peso?: number; // PR Peso
  reps?: number; // PR Repeticiones
  series?: { reps: string | number; peso: string | number }[];
}

export interface Asistencia {
  id?: string;
  docId?: string; // Sometimes used interchangeably
  userId: string;
  userName: string;
  fecha: string; // 'YYYY-MM-DD'
  timestamp: number;
  /** Docs nuevos (desde 2026-09): tipo, músculos (si es gym) y etiqueta libre. */
  tipo?: TipoEntreno;
  musculos?: Musculo[];
  etiqueta?: string;
  /** Modelo del cuerpo de quien lo registró (para el cuerpito del muro sin leer usuarios ajenos). */
  sexo?: Sexo;
  /** Categoría personal elegida al registrar (opcional). Docs muy viejos: `catId`. */
  categoriaId?: string;
  catId?: string;
  notas: string;
  rutina?: EjercicioRutina[];
  imagenUrl?: string | null;
  grupoId: string;
  likes?: string[];
}

/**
 * Categoría personal = plantilla de entreno: al elegirla en el registro precarga tipo,
 * músculos y nombre. Cada uno decide si la suya suma al ranking (`cuenta`).
 */
export interface Categoria {
  id?: string;
  userId: string;
  nombre: string;
  /** ¿Los entrenos de esta categoría suman a días entrenados / ranking / racha? (default: sí) */
  cuenta?: boolean;
  activo: boolean;
  /** Desde 2026-09. Si faltan (categorías viejas), se deducen del nombre (utils/entrenos). */
  tipo?: TipoEntreno;
  musculos?: Musculo[];
}

export interface Medalla {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
}

export interface StatItem {
  nombre: string;
  valor: number;
}
