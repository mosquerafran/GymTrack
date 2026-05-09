export type EstadoUsuario = 'aprobado' | 'pendiente' | 'rechazado' | null;

export interface Usuario {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  estado: EstadoUsuario;
  creadoEn: string;
  migrado?: boolean;
}

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
  categoriaId: string;
  notas: string;
  rutina?: EjercicioRutina[];
  imagenUrl?: string | null;
  grupoId: string;
  likes?: string[];
}

export interface Categoria {
  id?: string;
  userId: string;
  nombre: string;
  cuenta: boolean;
  activo: boolean;
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
