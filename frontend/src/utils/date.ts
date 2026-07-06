/**
 * Utilidades de fecha en HORA LOCAL.
 *
 * ⚠️ IMPORTANTE: No usar `date.toISOString().split("T")[0]` para obtener la
 * clave "YYYY-MM-DD" de un día. `toISOString()` convierte a UTC, y como
 * Argentina está en UTC-3, la medianoche local (00:00 -03:00) cae en el día
 * anterior en UTC. Eso provocaba que los rangos de mes/año quedaran corridos
 * un día (se perdía el último día del mes y se colaba el último del mes previo).
 *
 * Estas funciones siempre trabajan con la fecha del calendario local.
 */

/** Devuelve la clave "YYYY-MM-DD" de una fecha, en hora local. */
export const formatDateLocal = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/** Primer día del mes de `date` como clave "YYYY-MM-DD" (hora local). */
export const inicioMesLocal = (date: Date): string =>
  formatDateLocal(new Date(date.getFullYear(), date.getMonth(), 1));

/** Último día del mes de `date` como clave "YYYY-MM-DD" (hora local). */
export const finMesLocal = (date: Date): string =>
  formatDateLocal(new Date(date.getFullYear(), date.getMonth() + 1, 0));

/**
 * Convierte una clave "YYYY-MM-DD" en un Date al mediodía local.
 * El mediodía evita cualquier corrimiento por DST al comparar días.
 */
export const parseFechaLocal = (key: string): Date => new Date(`${key}T12:00:00`);

/**
 * Cantidad de días del calendario entre dos fechas, **inclusive** en ambos
 * extremos. `diasTranscurridos(1 de julio, 3 de julio) === 3`.
 */
export const diasTranscurridos = (desde: Date, hasta: Date): number => {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
};

/** Lunes de la semana de `date` (la semana arranca en lunes), a medianoche local. */
export const inicioSemanaLocal = (date: Date): Date => {
  const diaDesdeLunes = (date.getDay() + 6) % 7; // domingo(0) → 6, lunes(1) → 0
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diaDesdeLunes);
};
