import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { cargarAsistenciasParaStats } from "./asistenciasService";
import { cargarMapaCategorias } from "./categoriasService";
import { StatItem, Asistencia } from "../types";

export interface RankingUser {
  nombre: string;
  dias: number;
  categorias: Record<string, number>;
}

export interface HistorialItem {
  etiqueta: string;
  valor: number;
  key: string; // Para identificar el periodo (ej: "2024-05")
}

export interface StatsData {
  totalDiasEntrenados: number;
  conteoPorCategoria: StatItem[];
  ranking: RankingUser[];
  historico: HistorialItem[];
  misAsistencias: QueryDocumentSnapshot<DocumentData>[];
}

export type PeriodoStats = "mes" | "por_mes" | "por_anio";

/**
 * Calcula las estadísticas completas para la página Stats.
 */
export const calcularStats = async (
  userId: string, 
  grupoId: string, 
  periodo: PeriodoStats
): Promise<StatsData> => {
  const [{ misAsistencias, todasAsistencias }, mapaCategorias] = await Promise.all([
    cargarAsistenciasParaStats(grupoId, userId),
    cargarMapaCategorias(),
  ]);

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();

  // 1. Filtrar asistencias según el período seleccionado
  let misAsisFiltradas = misAsistencias;
  let todasAsisFiltradas = todasAsistencias;

  if (periodo === "mes") {
    const inicioMes = new Date(anioActual, mesActual, 1).toISOString().split("T")[0];
    misAsisFiltradas = misAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioMes);
    todasAsisFiltradas = todasAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioMes);
  } else if (periodo === "por_anio") {
    const inicioAnio = `${anioActual}-01-01`;
    misAsisFiltradas = misAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioAnio);
    todasAsisFiltradas = todasAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioAnio);
  } else if (periodo === "por_mes") {
    const inicioSemestre = new Date(anioActual, mesActual - 5, 1).toISOString().split("T")[0];
    misAsisFiltradas = misAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioSemestre);
    todasAsisFiltradas = todasAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioSemestre);
  }

  // 2. Conteo de Días Entrenados (sólo categorías con cuenta=true)
  const diasQueCuentan = new Set<string>();
  const conteoCategorias: Record<string, number> = {};

  // Inicializar conteo de categorías del usuario
  Object.values(mapaCategorias).forEach(c => {
    if (c.userId === userId) conteoCategorias[c.nombre] = 0;
  });

  misAsisFiltradas.forEach((doc) => {
    const data = doc.data() as Asistencia;
    const cat = mapaCategorias[data.categoriaId];
    if (!cat) return;

    // Conteo total de la categoría (se cuente o no para el día)
    if (!conteoCategorias[cat.nombre]) conteoCategorias[cat.nombre] = 0;
    conteoCategorias[cat.nombre]++;

    // Si la categoría cuenta, añadimos la fecha al set de días entrenados
    if (cat.cuenta) {
      diasQueCuentan.add(data.fecha);
    }
  });

  const statsCategorias: StatItem[] = Object.entries(conteoCategorias)
    .map(([nombre, valor]) => ({ nombre, valor }))
    .filter(s => s.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  // 3. Histórico para gráficas
  const historicoMap: Record<string, number> = {};
  
  if (periodo === "por_anio") {
    // Agrupar por mes del año actual
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    meses.forEach((m, i) => {
      const key = `${anioActual}-${String(i + 1).padStart(2, '0')}`;
      historicoMap[key] = 0;
    });

    misAsisFiltradas.forEach(doc => {
      const data = doc.data() as Asistencia;
      const cat = mapaCategorias[data.categoriaId];
      if (cat?.cuenta) {
        const mesKey = data.fecha.substring(0, 7); // YYYY-MM
        if (historicoMap[mesKey] !== undefined) {
          // Solo contamos un entrenamiento por día para la frecuencia de días
          // Pero aquí queremos saber cuántos días entrenó en ese mes.
          // Usamos un set temporal por mes para precisión si fuera necesario, 
          // pero como estamos iterando docs, podemos usar un set global de fechas y luego agrupar.
        }
      }
    });

    // Re-calculamos el histórico usando el set de días que cuentan para evitar duplicados por día
    const diasSet = new Set<string>();
    misAsisFiltradas.forEach(doc => {
      const data = doc.data() as Asistencia;
      if (mapaCategorias[data.categoriaId]?.cuenta) diasSet.add(data.fecha);
    });

    diasSet.forEach(fecha => {
      const mesKey = fecha.substring(0, 7);
      if (historicoMap[mesKey] !== undefined) historicoMap[mesKey]++;
    });

  } else if (periodo === "por_mes") {
    // Agrupar por los últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anioActual, mesActual - i, 1);
      const key = d.toISOString().substring(0, 7);
      historicoMap[key] = 0;
    }

    const diasSet = new Set<string>();
    misAsistencias.forEach(doc => {
      const data = doc.data() as Asistencia;
      if (mapaCategorias[data.categoriaId]?.cuenta) diasSet.add(data.fecha);
    });

    diasSet.forEach(fecha => {
      const mesKey = fecha.substring(0, 7);
      if (historicoMap[mesKey] !== undefined) historicoMap[mesKey]++;
    });
  }

  const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const historico: HistorialItem[] = Object.entries(historicoMap)
    .map(([key, valor]) => {
      const [y, m] = key.split("-");
      const etiqueta = periodo === "por_anio" ? mesesLabels[parseInt(m) - 1] : `${mesesLabels[parseInt(m) - 1]} ${y.substring(2)}`;
      return { etiqueta, valor, key };
    })
    .sort((a, b) => a.key.localeCompare(b.key));

  // 4. Ranking
  const usuariosMap: Record<string, { nombre: string; dias: Set<string>; categorias: Record<string, number> }> = {};
  
  todasAsisFiltradas.forEach((doc) => {
    const data = doc.data() as Asistencia;
    const cat = mapaCategorias[data.categoriaId];
    if (!cat) return;

    const usr = data.userName || "Desconocido";
    if (!usuariosMap[usr]) {
      usuariosMap[usr] = { nombre: usr, dias: new Set(), categorias: {} };
    }
    
    // Contamos todas las categorías para el desglose del ranking
    if (!usuariosMap[usr].categorias[cat.nombre]) {
      usuariosMap[usr].categorias[cat.nombre] = 0;
    }
    usuariosMap[usr].categorias[cat.nombre]++;

    if (cat.cuenta) {
      usuariosMap[usr].dias.add(data.fecha);
    }
  });

  const ranking: RankingUser[] = Object.values(usuariosMap)
    .map((u) => ({ 
      nombre: u.nombre, 
      dias: u.dias.size,
      categorias: u.categorias
    }))
    .sort((a, b) => b.dias - a.dias);

  return { 
    totalDiasEntrenados: diasQueCuentan.size, 
    conteoPorCategoria: statsCategorias, 
    ranking, 
    historico,
    misAsistencias: misAsisFiltradas 
  };
};
