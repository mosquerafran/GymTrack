import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { cargarAsistenciasParaStats } from "./asistenciasService";
import { cargarMapaCategorias } from "./categoriasService";
import { StatItem, Asistencia } from "../types";
import { formatDateLocal, parseFechaLocal, diasTranscurridos, inicioSemanaLocal } from "../utils/date";

export interface RankingUser {
  nombre: string;
  dias: number;
  porcentaje: number; // % de constancia = dias / diasPosibles
  categorias: Record<string, number>;
}

export interface StatsData {
  totalDiasEntrenados: number;
  diasPosibles: number;       // días transcurridos del período ("total que se pudo")
  porcentaje: number;         // % de constancia personal
  rachaActual: number;        // días consecutivos hasta hoy/ayer
  rachaRecord: number;        // mejor racha histórica
  diasEstaSemana: number;     // días entrenados en la semana en curso (lun-dom)
  diasSemanaPasada: number;   // días entrenados en la semana anterior (lun-dom)
  diasEntrenadosAnio: string[]; // claves "YYYY-MM-DD" que cuentan, del año actual (heatmap)
  conteoPorCategoria: StatItem[];
  ranking: RankingUser[];
  misAsistencias: QueryDocumentSnapshot<DocumentData>[];
}

export type PeriodoStats = "mes" | "por_mes" | "por_anio";

/**
 * Calcula la racha actual (hasta hoy o ayer) y la mejor racha histórica a partir
 * de un conjunto de días entrenados ("YYYY-MM-DD"). Cuenta días únicos.
 */
export const calcularRachas = (dias: Set<string>): { actual: number; record: number } => {
  if (dias.size === 0) return { actual: 0, record: 0 };

  const ordenadas = Array.from(dias).sort(); // ascendente
  const esConsecutivo = (a: string, b: string): boolean =>
    Math.round((parseFechaLocal(b).getTime() - parseFechaLocal(a).getTime()) / 86_400_000) === 1;

  // Mejor racha histórica.
  let record = 1;
  let run = 1;
  for (let i = 1; i < ordenadas.length; i++) {
    if (esConsecutivo(ordenadas[i - 1], ordenadas[i])) {
      run++;
      record = Math.max(record, run);
    } else {
      run = 1;
    }
  }

  // Racha actual: solo cuenta si el último día es hoy o ayer.
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const strHoy = formatDateLocal(hoy);
  const strAyer = formatDateLocal(ayer);

  const desc = [...ordenadas].reverse();
  let actual = 0;
  if (desc[0] === strHoy || desc[0] === strAyer) {
    actual = 1;
    for (let i = 1; i < desc.length; i++) {
      if (esConsecutivo(desc[i], desc[i - 1])) actual++;
      else break;
    }
  }

  return { actual, record };
};

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
    const inicioMes = formatDateLocal(new Date(anioActual, mesActual, 1));
    misAsisFiltradas = misAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioMes);
    todasAsisFiltradas = todasAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioMes);
  } else if (periodo === "por_anio") {
    const inicioAnio = `${anioActual}-01-01`;
    misAsisFiltradas = misAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioAnio);
    todasAsisFiltradas = todasAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioAnio);
  } else if (periodo === "por_mes") {
    const inicioSemestre = formatDateLocal(new Date(anioActual, mesActual - 5, 1));
    misAsisFiltradas = misAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioSemestre);
    todasAsisFiltradas = todasAsistencias.filter((d) => (d.data() as Asistencia).fecha >= inicioSemestre);
  }

  // 1.b Días "que se pudo" entrenar = días transcurridos del período (hasta hoy).
  let inicioPeriodo: Date;
  if (periodo === "por_anio") inicioPeriodo = new Date(anioActual, 0, 1);
  else if (periodo === "por_mes") inicioPeriodo = new Date(anioActual, mesActual - 5, 1);
  else inicioPeriodo = new Date(anioActual, mesActual, 1);
  const diasPosibles = Math.max(1, diasTranscurridos(inicioPeriodo, hoy));
  const pct = (dias: number) => Math.min(100, Math.round((dias / diasPosibles) * 100));

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

  // 3. Ranking
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
      porcentaje: pct(u.dias.size),
      categorias: u.categorias
    }))
    .sort((a, b) => b.dias - a.dias);

  // 4. Rachas, semana y heatmap: se calculan sobre TODO el historial del usuario
  //    (no sobre el período filtrado), usando solo días que cuentan.
  const diasCuentaTodos = new Set<string>();
  misAsistencias.forEach((doc) => {
    const data = doc.data() as Asistencia;
    const cat = mapaCategorias[data.categoriaId];
    if (cat && cat.cuenta && data.fecha) diasCuentaTodos.add(data.fecha);
  });

  const { actual: rachaActual, record: rachaRecord } = calcularRachas(diasCuentaTodos);

  const inicioSemDate = inicioSemanaLocal(hoy);
  const inicioSemana = formatDateLocal(inicioSemDate);
  const strHoy = formatDateLocal(hoy);
  const diasEstaSemana = [...diasCuentaTodos].filter((f) => f >= inicioSemana && f <= strHoy).length;

  // Semana pasada (lunes a domingo anteriores) para la comparativa.
  const inicioSemPasadaDate = new Date(inicioSemDate);
  inicioSemPasadaDate.setDate(inicioSemDate.getDate() - 7);
  const finSemPasadaDate = new Date(inicioSemDate);
  finSemPasadaDate.setDate(inicioSemDate.getDate() - 1);
  const inicioSemPasada = formatDateLocal(inicioSemPasadaDate);
  const finSemPasada = formatDateLocal(finSemPasadaDate);
  const diasSemanaPasada = [...diasCuentaTodos].filter((f) => f >= inicioSemPasada && f <= finSemPasada).length;

  const prefijoAnio = `${anioActual}-`;
  const diasEntrenadosAnio = [...diasCuentaTodos].filter((f) => f.startsWith(prefijoAnio));

  return {
    totalDiasEntrenados: diasQueCuentan.size,
    diasPosibles,
    porcentaje: pct(diasQueCuentan.size),
    rachaActual,
    rachaRecord,
    diasEstaSemana,
    diasSemanaPasada,
    diasEntrenadosAnio,
    conteoPorCategoria: statsCategorias,
    ranking,
    misAsistencias: misAsisFiltradas,
  };
};
