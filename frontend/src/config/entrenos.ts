// Vocabulario del registro de entrenos: tipos, músculos y atajos.
// Lo que se guarda en Firestore son los `id` (asistencias.tipo, asistencias.musculos[],
// usuarios.sexo). Los nombres son solo para mostrar: se pueden cambiar sin migrar datos.

export type TipoEntreno = "gym" | "futbol" | "running" | "otro";

export const TIPOS: Record<TipoEntreno, { emoji: string; nombre: string }> = {
  gym: { emoji: "🏋️", nombre: "Gym" },
  futbol: { emoji: "⚽", nombre: "Fútbol" },
  running: { emoji: "🏃", nombre: "Running" },
  otro: { emoji: "✦", nombre: "Otro" },
};

export const TIPOS_ORDEN: TipoEntreno[] = ["gym", "futbol", "running", "otro"];

export type Musculo =
  | "pecho" | "hombros" | "trapecio" | "dorsales" | "lumbares"
  | "biceps" | "triceps" | "antebrazos" | "abdominales" | "oblicuos"
  | "gluteos" | "cuadriceps" | "isquios" | "aductores" | "gemelos";

/** Orden de la lista y de los resúmenes ("Pecho · Hombros · Tríceps"). */
export const MUSCULOS: { id: Musculo; nombre: string }[] = [
  { id: "pecho", nombre: "Pecho" },
  { id: "hombros", nombre: "Hombros" },
  { id: "trapecio", nombre: "Trapecio" },
  { id: "dorsales", nombre: "Dorsales" },
  { id: "lumbares", nombre: "Lumbares" },
  { id: "biceps", nombre: "Bíceps" },
  { id: "triceps", nombre: "Tríceps" },
  { id: "antebrazos", nombre: "Antebrazos" },
  { id: "abdominales", nombre: "Abdominales" },
  { id: "oblicuos", nombre: "Oblicuos" },
  { id: "gluteos", nombre: "Glúteos" },
  { id: "cuadriceps", nombre: "Cuádriceps" },
  { id: "isquios", nombre: "Isquiotibiales" },
  { id: "aductores", nombre: "Aductores" },
  { id: "gemelos", nombre: "Gemelos" },
];

export const NOMBRE_MUSCULO: Record<Musculo, string> = Object.fromEntries(
  MUSCULOS.map((m) => [m.id, m.nombre])
) as Record<Musculo, string>;

/** Slug de las figuras (components/cuerpo/datos.ts) → músculo de la app. El resto es "cuerpo". */
export const SLUG_A_MUSCULO: Record<string, Musculo> = {
  chest: "pecho",
  deltoids: "hombros",
  trapezius: "trapecio",
  "upper-back": "dorsales",
  "lower-back": "lumbares",
  biceps: "biceps",
  triceps: "triceps",
  forearm: "antebrazos",
  abs: "abdominales",
  obliques: "oblicuos",
  gluteal: "gluteos",
  quadriceps: "cuadriceps",
  hamstring: "isquios",
  adductors: "aductores",
  calves: "gemelos",
  tibialis: "gemelos",
};

export const ATAJOS: { nombre: string; musculos: Musculo[] }[] = [
  { nombre: "Push", musculos: ["pecho", "hombros", "triceps"] },
  { nombre: "Pull", musculos: ["trapecio", "dorsales", "biceps", "antebrazos"] },
  { nombre: "Legs", musculos: ["cuadriceps", "isquios", "gluteos", "aductores", "gemelos"] },
  { nombre: "Torso", musculos: ["pecho", "hombros", "trapecio", "dorsales", "biceps", "triceps"] },
  { nombre: "Core", musculos: ["abdominales", "oblicuos", "lumbares"] },
];

export type Sexo = "hombre" | "mujer";
export const SEXO_DEFAULT: Sexo = "hombre";

export const esTipoEntreno = (v: unknown): v is TipoEntreno =>
  typeof v === "string" && v in TIPOS;

export const esMusculo = (v: unknown): v is Musculo =>
  typeof v === "string" && v in NOMBRE_MUSCULO;

export const esSexo = (v: unknown): v is Sexo => v === "hombre" || v === "mujer";
