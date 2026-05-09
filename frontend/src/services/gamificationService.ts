import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Medalla, Asistencia } from "../types";

/**
 * Calcula las medallas (badges) de un usuario basándose en su historial de asistencias
 */
export const calcularMedallas = (asistencias: QueryDocumentSnapshot<DocumentData>[]): Medalla[] => {
  const medallas: Medalla[] = [];
  
  if (!asistencias || asistencias.length === 0) return medallas;

  const total = asistencias.length;

  // 1. Fuego Inicial (1+ entrenamientos)
  if (total >= 1) {
    medallas.push({
      id: "fuego_inicial",
      nombre: "Fuego Inicial",
      icono: "🔥",
      descripcion: "Completaste tu primer entrenamiento.",
      color: "text-orange-500 bg-orange-500/10 border-orange-500/30"
    });
  }

  // 2. Constancia (10+ entrenamientos)
  if (total >= 10) {
    medallas.push({
      id: "constancia_bronce",
      nombre: "Constancia",
      icono: "🥉",
      descripcion: "Llegaste a los 10 entrenamientos.",
      color: "text-amber-600 bg-amber-600/10 border-amber-600/30"
    });
  }

  // 3. Disciplina (50+ entrenamientos)
  if (total >= 50) {
    medallas.push({
      id: "disciplina_plata",
      nombre: "Disciplina",
      icono: "🥈",
      descripcion: "Llegaste a los 50 entrenamientos.",
      color: "text-slate-400 bg-slate-400/10 border-slate-400/30"
    });
  }

  // Análisis de horarios
  let madrugador = false;
  let nocturno = false;

  asistencias.forEach(a => {
    const data = a.data() as Asistencia;
    if (data.timestamp) {
      const hora = new Date(data.timestamp).getHours();
      if (hora < 8 && hora > 4) madrugador = true;
      if (hora >= 21 || hora <= 3) nocturno = true;
    }
  });

  // 4. Madrugador
  if (madrugador) {
    medallas.push({
      id: "madrugador",
      nombre: "Madrugador",
      icono: "🌅",
      descripcion: "Entrenaste antes de las 8 AM.",
      color: "text-sky-500 bg-sky-500/10 border-sky-500/30"
    });
  }

  // 5. Noctámbulo
  if (nocturno) {
    medallas.push({
      id: "noctambulo",
      nombre: "Noctámbulo",
      icono: "🦉",
      descripcion: "Entrenaste de noche (después de las 9 PM).",
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30"
    });
  }

  return medallas;
};
