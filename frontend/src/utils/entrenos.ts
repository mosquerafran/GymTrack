// Lógica pura sobre entrenos (asistencias), compatible con los documentos viejos.
//
// Documentos viejos: sin `tipo`/`musculos`/`etiqueta`, con la categoría en `categoriaId`
// o en `catId` (legacy). Nunca se migran: se interpretan acá al leer.
import {
  ATAJOS,
  MUSCULOS,
  Musculo,
  NOMBRE_MUSCULO,
  TIPOS,
  TipoEntreno,
  esMusculo,
  esTipoEntreno,
} from "../config/entrenos";

/** Lo mínimo de una asistencia que usan estas funciones (acepta docs viejos). */
export interface EntrenoLeido {
  fecha?: string;
  tipo?: unknown;
  musculos?: unknown;
  etiqueta?: unknown;
  categoriaId?: string;
  catId?: string;
}

/** Nombre de categoría por id, para interpretar los docs viejos. */
export type NombresCategoria = Record<string, string | undefined>;

/** id de la categoría de un doc (nuevo o legacy), o "" si no tiene. */
export const categoriaIdDe = (a: EntrenoLeido): string => a.categoriaId || a.catId || "";

/** Minúsculas y sin tildes, con todo lo que no es letra/número como espacio. */
const normalizar = (s: string): string =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Tipo del entreno. Los docs nuevos lo traen; en los viejos se deduce del nombre de
 * la categoría ("Futbol", "Running 🏳️‍🌈"...) y, si no hay pista, se asume gym.
 */
export const tipoDe = (a: EntrenoLeido, nombres: NombresCategoria = {}): TipoEntreno => {
  if (esTipoEntreno(a.tipo)) return a.tipo;
  const nombre = normalizar(nombres[categoriaIdDe(a)] || "");
  if (/futbol|fulbo|futsal/.test(nombre)) return "futbol";
  if (/running|\brun\b|correr|trote/.test(nombre)) return "running";
  if (/hik+ing|trek|caminata|sender|natacion|pileta|padel|tenis|bici|ciclismo/.test(nombre)) return "otro";
  return "gym";
};

const atajo = (nombre: string): Musculo[] => ATAJOS.find((a) => a.nombre === nombre)?.musculos || [];

/** Palabras de los nombres de categoría → músculos (para los entrenos viejos, sin músculos). */
const PALABRAS: [RegExp, Musculo[]][] = [
  [/\bpecho\b/, ["pecho"]],
  [/\bespaldas?\b/, ["trapecio", "dorsales"]],
  [/\btriceps?\b/, ["triceps"]],
  [/\bbiceps?\b/, ["biceps"]],
  [/\bbrazos?\b/, ["biceps", "triceps", "antebrazos"]],
  [/\bhombros?\b/, ["hombros"]],
  [/\b(piernas?|legs?|patas?)\b/, atajo("Legs")],
  [/\b(push|empuje)\b/, atajo("Push")],
  [/\b(pull|traccion)\b/, atajo("Pull")],
  [/\btorso\b/, atajo("Torso")],
  [/\b(core|abs|abdominales?)\b/, atajo("Core")],
  [/\bgluteos?\b/, ["gluteos"]],
  [/\b(full ?body|cuerpo completo)\b/, MUSCULOS.map((m) => m.id)],
];

/**
 * Músculos que se deducen del nombre de una categoría vieja ("Pierna-hombro" → piernas +
 * hombros). Devuelve [] si no reconoce nada ("Minubi 🥵"). No se guarda: se deduce al leer.
 */
export const musculosDeNombre = (nombre: string): Musculo[] => {
  const n = normalizar(nombre);
  const set = new Set<Musculo>();
  for (const [re, musculos] of PALABRAS) if (re.test(n)) musculos.forEach((m) => set.add(m));
  return MUSCULOS.map((m) => m.id).filter((id) => set.has(id));
};

/**
 * Músculos del entreno (solo ids válidos, sin repetir, en el orden de la lista).
 * Docs nuevos: los marcados. Docs viejos de gym: deducidos del nombre de su categoría.
 */
export const musculosDe = (a: EntrenoLeido, nombres: NombresCategoria = {}): Musculo[] => {
  if (Array.isArray(a.musculos)) {
    const set = new Set(a.musculos.filter(esMusculo));
    return MUSCULOS.map((m) => m.id).filter((id) => set.has(id));
  }
  if (tipoDe(a, nombres) !== "gym") return [];
  return musculosDeNombre(nombres[categoriaIdDe(a)] || "");
};

/** Etiqueta a mostrar: la del doc nuevo o, en los viejos, el nombre de su categoría. */
export const etiquetaDe = (a: EntrenoLeido, nombres: NombresCategoria = {}): string => {
  if (typeof a.etiqueta === "string" && a.etiqueta.trim()) return a.etiqueta.trim();
  return (nombres[categoriaIdDe(a)] || "").trim();
};

/** "Pecho · Hombros · Tríceps" para gym con músculos; si no, el nombre del tipo. */
export const descripcionDe = (a: EntrenoLeido, nombres: NombresCategoria = {}): string => {
  const tipo = tipoDe(a, nombres);
  const musculos = musculosDe(a, nombres);
  if (tipo === "gym" && musculos.length) return musculos.map((m) => NOMBRE_MUSCULO[m]).join(" · ");
  return TIPOS[tipo].nombre;
};

/** Días entrenados ("YYYY-MM-DD") únicos. Todo entreno suma, sea del tipo que sea. */
export const diasEntrenados = (entrenos: EntrenoLeido[]): Set<string> => {
  const dias = new Set<string>();
  for (const a of entrenos) if (a.fecha) dias.add(a.fecha);
  return dias;
};

/** Cantidad de entrenos por tipo, de mayor a menor (los tipos sin entrenos no aparecen). */
export const conteoPorTipo = (
  entrenos: EntrenoLeido[],
  nombres: NombresCategoria = {}
): { tipo: TipoEntreno; cantidad: number }[] => {
  const conteo: Partial<Record<TipoEntreno, number>> = {};
  for (const a of entrenos) {
    const t = tipoDe(a, nombres);
    conteo[t] = (conteo[t] || 0) + 1;
  }
  return (Object.entries(conteo) as [TipoEntreno, number][])
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((x, y) => y.cantidad - x.cantidad);
};

/**
 * Para el mapa de calor: en cuántos DÍAS distintos se trabajó cada músculo dentro de
 * [desde, hasta] (claves "YYYY-MM-DD", inclusive). Dos entrenos de pecho el mismo día = 1.
 */
export const diasPorMusculo = (
  entrenos: EntrenoLeido[],
  desde: string,
  hasta: string,
  nombres: NombresCategoria = {}
): Partial<Record<Musculo, number>> => {
  const dias: Partial<Record<Musculo, Set<string>>> = {};
  for (const a of entrenos) {
    if (!a.fecha || a.fecha < desde || a.fecha > hasta) continue;
    for (const m of musculosDe(a, nombres)) (dias[m] ||= new Set()).add(a.fecha);
  }
  const res: Partial<Record<Musculo, number>> = {};
  for (const [m, set] of Object.entries(dias) as [Musculo, Set<string>][]) res[m] = set.size;
  return res;
};

// ── Stats por músculo ──────────────────────────────────────────────────────────

export const TREN_INFERIOR: Musculo[] = ["gluteos", "cuadriceps", "isquios", "aductores", "gemelos"];
export const TREN_SUPERIOR: Musculo[] = MUSCULOS.map((m) => m.id).filter((m) => !TREN_INFERIOR.includes(m));

/** Días (distintos) con algún músculo de cada tren, dentro de [desde, hasta]. */
export const diasPorTren = (
  entrenos: EntrenoLeido[],
  desde: string,
  hasta: string,
  nombres: NombresCategoria = {}
): { superior: number; inferior: number } => {
  const sup = new Set<string>();
  const inf = new Set<string>();
  for (const a of entrenos) {
    if (!a.fecha || a.fecha < desde || a.fecha > hasta) continue;
    const ms = musculosDe(a, nombres);
    if (ms.some((m) => TREN_SUPERIOR.includes(m))) sup.add(a.fecha);
    if (ms.some((m) => TREN_INFERIOR.includes(m))) inf.add(a.fecha);
  }
  return { superior: sup.size, inferior: inf.size };
};

/** Última fecha ("YYYY-MM-DD") en que se trabajó cada músculo (todo el historial). */
export const ultimaVezPorMusculo = (
  entrenos: EntrenoLeido[],
  nombres: NombresCategoria = {}
): Partial<Record<Musculo, string>> => {
  const ultima: Partial<Record<Musculo, string>> = {};
  for (const a of entrenos) {
    if (!a.fecha) continue;
    for (const m of musculosDe(a, nombres)) {
      const previa = ultima[m];
      if (!previa || a.fecha > previa) ultima[m] = a.fecha;
    }
  }
  return ultima;
};

/** Zonas para "Reyes de cada músculo" (más gruesas que la lista, para que haya competencia). */
export const ZONAS: { nombre: string; musculos: Musculo[] }[] = [
  { nombre: "Pecho", musculos: ["pecho"] },
  { nombre: "Espalda", musculos: ["trapecio", "dorsales", "lumbares"] },
  { nombre: "Piernas", musculos: TREN_INFERIOR },
  { nombre: "Hombros", musculos: ["hombros"] },
  { nombre: "Brazos", musculos: ["biceps", "triceps", "antebrazos"] },
  { nombre: "Core", musculos: ["abdominales", "oblicuos"] },
];

/**
 * Quién entrenó más días cada zona en [desde, hasta]. Agrupa por userName (como el ranking).
 * Empate: por nombre (estable). Las zonas que nadie entrenó no aparecen.
 */
export const lideresPorZona = (
  entrenos: (EntrenoLeido & { userName?: string })[],
  desde: string,
  hasta: string,
  nombres: NombresCategoria = {}
): { zona: string; nombre: string; dias: number }[] => {
  const cuenta: Record<string, Record<string, Set<string>>> = {}; // zona → usuario → días
  for (const a of entrenos) {
    if (!a.fecha || a.fecha < desde || a.fecha > hasta) continue;
    const ms = musculosDe(a, nombres);
    const usr = a.userName || "Desconocido";
    for (const z of ZONAS) {
      if (!ms.some((m) => z.musculos.includes(m))) continue;
      ((cuenta[z.nombre] ||= {})[usr] ||= new Set()).add(a.fecha);
    }
  }
  const res: { zona: string; nombre: string; dias: number }[] = [];
  for (const z of ZONAS) {
    const porUsuario = Object.entries(cuenta[z.nombre] || {}).map(([nombre, set]) => ({ nombre, dias: set.size }));
    if (!porUsuario.length) continue;
    porUsuario.sort((x, y) => y.dias - x.dias || x.nombre.localeCompare(y.nombre));
    res.push({ zona: z.nombre, ...porUsuario[0] });
  }
  return res;
};

/** Nivel 0-3 del mapa de calor según los umbrales del período ([nivel1, nivel2, nivel3]). */
export const nivelDeCalor = (dias: number, umbral: [number, number, number]): 0 | 1 | 2 | 3 =>
  dias >= umbral[2] ? 3 : dias >= umbral[1] ? 2 : dias >= umbral[0] ? 1 : 0;
