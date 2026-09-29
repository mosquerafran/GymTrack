import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { cargarAsistenciasParaStats } from "./asistenciasService";
import { cargarMapaCategorias } from "./categoriasService";
import { Asistencia } from "../types";
import { Musculo, TipoEntreno } from "../config/entrenos";
import {
  conteoPorTipo,
  diasEntrenados,
  diasPorMusculo,
  diasPorTren,
  lideresPorZona,
  ultimaVezPorMusculo,
  NombresCategoria,
} from "../utils/entrenos";
import { formatDateLocal, parseFechaLocal, diasTranscurridos, inicioSemanaLocal } from "../utils/date";

export interface RankingUser {
  nombre: string;
  dias: number;
  porcentaje: number; // % de constancia = dias / diasPosibles
  porTipo: { tipo: TipoEntreno; cantidad: number }[]; // desglose (gym 11 · fútbol 6)
}

export interface StatsData {
  totalDiasEntrenados: number;
  diasPosibles: number;       // días transcurridos del período ("total que se pudo")
  porcentaje: number;         // % de constancia personal
  rachaActual: number;        // días consecutivos hasta hoy/ayer
  rachaRecord: number;        // mejor racha histórica
  diasEstaSemana: number;     // días entrenados en la semana en curso (lun-dom)
  diasSemanaPasada: number;   // días entrenados en la semana anterior (lun-dom)
  diasEntrenadosAnio: string[]; // claves "YYYY-MM-DD" entrenadas del año actual (heatmap)
  conteoPorTipo: { tipo: TipoEntreno; cantidad: number }[];
  // ── Por músculo (docs nuevos: marcados; viejos de gym: deducidos de la categoría) ──
  musculosPeriodo: Partial<Record<Musculo, number>>;       // días por músculo en el período
  umbralCalor: [number, number, number];                    // días para cada nivel del mapa
  ultimaVezMusculo: Partial<Record<Musculo, string>>;       // "YYYY-MM-DD", todo el historial
  tren: { superior: number; inferior: number };             // días de cada tren en el período
  lideres: { zona: string; nombre: string; dias: number }[]; // del grupo, en el período
  ranking: RankingUser[];
  misAsistencias: QueryDocumentSnapshot<DocumentData>[];
}

export type PeriodoStats = "semana" | "mes" | "anio";

/** Días de un músculo para cada nivel del mapa de calor, según el largo del período. */
const UMBRAL_CALOR: Record<PeriodoStats, [number, number, number]> = {
  semana: [1, 2, 3],
  mes: [1, 3, 6],
  anio: [5, 20, 45],
};

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

  // 1. Período: desde el lunes de esta semana, el 1° del mes o el 1° de enero, hasta hoy.
  let inicioPeriodo: Date;
  if (periodo === "semana") inicioPeriodo = inicioSemanaLocal(hoy);
  else if (periodo === "mes") inicioPeriodo = new Date(anioActual, mesActual, 1);
  else inicioPeriodo = new Date(anioActual, 0, 1);
  const desde = formatDateLocal(inicioPeriodo);
  const hasta = formatDateLocal(hoy);
  const enPeriodo = (d: QueryDocumentSnapshot<DocumentData>) => {
    const f = (d.data() as Asistencia).fecha;
    return !!f && f >= desde && f <= hasta;
  };
  const misAsisFiltradas = misAsistencias.filter(enPeriodo);
  const todasAsisFiltradas = todasAsistencias.filter(enPeriodo);

  // 1.b Días "que se pudo" entrenar = días transcurridos del período (hasta hoy).
  const diasPosibles = Math.max(1, diasTranscurridos(inicioPeriodo, hoy));
  const pct = (dias: number) => Math.min(100, Math.round((dias / diasPosibles) * 100));

  // 2. Días entrenados: TODO entreno suma (desde 2026-09 ya no se mira categorias.cuenta).
  //    Los docs viejos (catId, categorías borradas) también cuentan: utils/entrenos.ts.
  const nombres: NombresCategoria = Object.fromEntries(
    Object.entries(mapaCategorias).map(([id, c]) => [id, c.nombre])
  );
  const datos = (docs: QueryDocumentSnapshot<DocumentData>[]) => docs.map((d) => d.data() as Asistencia);

  const misDatosPeriodo = datos(misAsisFiltradas);
  const diasPeriodo = diasEntrenados(misDatosPeriodo);

  // 3. Ranking (agrupado por userName, como siempre: context.md §9.4)
  const porUsuario: Record<string, Asistencia[]> = {};
  for (const a of datos(todasAsisFiltradas)) {
    const usr = a.userName || "Desconocido";
    (porUsuario[usr] ||= []).push(a);
  }
  const ranking: RankingUser[] = Object.entries(porUsuario)
    .map(([nombre, lista]) => {
      const dias = diasEntrenados(lista).size;
      return { nombre, dias, porcentaje: pct(dias), porTipo: conteoPorTipo(lista, nombres) };
    })
    .sort((a, b) => b.dias - a.dias);

  // 4. Rachas, semana, heatmaps: sobre TODO el historial del usuario (no el período).
  const misDatosTodos = datos(misAsistencias);
  const diasCuentaTodos = diasEntrenados(misDatosTodos);

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
    totalDiasEntrenados: diasPeriodo.size,
    diasPosibles,
    porcentaje: pct(diasPeriodo.size),
    rachaActual,
    rachaRecord,
    diasEstaSemana,
    diasSemanaPasada,
    diasEntrenadosAnio,
    conteoPorTipo: conteoPorTipo(misDatosPeriodo, nombres),
    musculosPeriodo: diasPorMusculo(misDatosPeriodo, desde, hasta, nombres),
    umbralCalor: UMBRAL_CALOR[periodo],
    ultimaVezMusculo: ultimaVezPorMusculo(misDatosTodos, nombres),
    tren: diasPorTren(misDatosPeriodo, desde, hasta, nombres),
    lideres: lideresPorZona(datos(todasAsisFiltradas), desde, hasta, nombres),
    ranking,
    misAsistencias: misAsisFiltradas,
  };
};
