import { formatDateLocal, inicioMesLocal, finMesLocal } from "./utils/date";
import { calcularRachas } from "./services/statsService";

// Estos tests reemplazan el test por defecto de Create React App (que buscaba
// el texto "learn react" y siempre fallaba). Cubren el bug de zona horaria:
// en UTC-3 (Argentina) usar toISOString() corría las fechas un día.

describe("utils/date", () => {
  test("formatDateLocal usa la fecha del calendario local, no UTC", () => {
    // 1 de julio a medianoche local. Con toISOString() en UTC-3 esto daba
    // "2026-06-30"; con formatDateLocal debe dar "2026-07-01".
    const d = new Date(2026, 6, 1, 0, 0, 0);
    expect(formatDateLocal(d)).toBe("2026-07-01");
  });

  test("inicioMesLocal devuelve el día 1 del mes", () => {
    expect(inicioMesLocal(new Date(2026, 6, 15))).toBe("2026-07-01");
  });

  test("finMesLocal devuelve el último día del mes", () => {
    expect(finMesLocal(new Date(2026, 6, 15))).toBe("2026-07-31");
    // Febrero de un año no bisiesto
    expect(finMesLocal(new Date(2026, 1, 10))).toBe("2026-02-28");
  });
});

describe("statsService/calcularRachas", () => {
  test("sin días → 0 y 0", () => {
    expect(calcularRachas(new Set())).toEqual({ actual: 0, record: 0 });
  });

  test("récord = racha más larga de días consecutivos", () => {
    // 3 seguidos en enero, corte, 1 en febrero → récord 3.
    const dias = new Set(["2026-01-01", "2026-01-02", "2026-01-03", "2026-02-01"]);
    expect(calcularRachas(dias).record).toBe(3);
  });

  test("un hueco corta la racha", () => {
    const dias = new Set(["2026-01-01", "2026-01-02", "2026-01-04", "2026-01-05", "2026-01-06"]);
    expect(calcularRachas(dias).record).toBe(3);
  });

  test("la racha actual es 0 si el último día es viejo", () => {
    const dias = new Set(["2020-01-01", "2020-01-02"]);
    expect(calcularRachas(dias).actual).toBe(0);
  });

  test("racha actual cuenta hasta hoy", () => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dias = new Set([fmt(ayer), fmt(hoy)]);
    expect(calcularRachas(dias).actual).toBe(2);
  });
});
