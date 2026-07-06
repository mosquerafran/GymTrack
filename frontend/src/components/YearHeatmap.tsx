import React, { useMemo } from "react";
import { formatDateLocal } from "../utils/date";

interface YearHeatmapProps {
  /** Días entrenados ("YYYY-MM-DD") que cuentan, del año a mostrar. */
  dias: string[];
  anio: number;
}

interface Celda {
  key: string;
  enAnio: boolean;
  entreno: boolean;
  esHoy: boolean;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/**
 * Heatmap anual estilo "contribuciones de GitHub": una columna por semana
 * (lunes arriba), un cuadrito por día que se prende si se entrenó.
 * Sin librerías; se desplaza horizontalmente en pantallas chicas.
 */
export default function YearHeatmap({ dias, anio }: YearHeatmapProps): React.ReactElement {
  const { semanas, etiquetasMes, total } = useMemo(() => {
    const set = new Set(dias);
    const hoyStr = formatDateLocal(new Date());

    const primero = new Date(anio, 0, 1);
    const offsetLunes = (primero.getDay() + 6) % 7; // 0 = lunes
    const cursor = new Date(anio, 0, 1 - offsetLunes); // lunes en/antes del 1 de enero
    const ultimo = new Date(anio, 11, 31);

    const celdas: Celda[] = [];
    while (cursor <= ultimo) {
      const enAnio = cursor.getFullYear() === anio;
      const key = formatDateLocal(cursor);
      celdas.push({ key, enAnio, entreno: enAnio && set.has(key), esHoy: key === hoyStr });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Agrupar en columnas de 7 (semanas).
    const semanas: Celda[][] = [];
    for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));

    // Etiqueta de mes por semana: cuando el primer día "en año" de la semana
    // pertenece a un mes que todavía no etiquetamos.
    const etiquetasMes: (string | null)[] = [];
    let ultimoMes = -1;
    semanas.forEach((sem) => {
      const primerDia = sem.find((c) => c.enAnio);
      if (!primerDia) return etiquetasMes.push(null);
      const mes = new Date(`${primerDia.key}T12:00:00`).getMonth();
      if (mes !== ultimoMes) {
        ultimoMes = mes;
        etiquetasMes.push(MESES[mes]);
      } else {
        etiquetasMes.push(null);
      }
    });

    return { semanas, etiquetasMes, total: set.size };
  }, [dias, anio]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-textMuted uppercase tracking-[0.25em]">
          Actividad {anio}
        </h3>
        <span className="text-[10px] font-bold text-textMuted">
          <span className="scoreboard text-textMain">{total}</span> días
        </span>
      </div>

      <div className="overflow-x-auto hide-scrollbar -mx-1 px-1">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Fila de etiquetas de mes */}
          <div className="flex gap-1">
            {etiquetasMes.map((et, i) => (
              <div key={i} className="w-3 shrink-0">
                {et && (
                  <span className="block text-[8px] font-bold text-textMuted whitespace-nowrap leading-none">
                    {et}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Columnas de semanas */}
          <div className="flex gap-1">
            {semanas.map((sem, i) => (
              <div key={i} className="flex flex-col gap-1 shrink-0">
                {sem.map((c) => (
                  <div
                    key={c.key}
                    title={c.enAnio ? `${c.key.split("-").reverse().join("/")}${c.entreno ? " · entrenaste 💪" : ""}` : undefined}
                    className={`w-3 h-3 rounded-[3px] ${
                      !c.enAnio
                        ? "bg-transparent"
                        : c.entreno
                        ? "bg-primary shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                        : "bg-surfaceHighlight border border-borderBase"
                    } ${c.esHoy ? "ring-1 ring-accent" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-1.5 justify-end">
        <span className="text-[9px] font-bold text-textMuted">Descanso</span>
        <span className="w-2.5 h-2.5 rounded-[3px] bg-surfaceHighlight border border-borderBase" />
        <span className="w-2.5 h-2.5 rounded-[3px] bg-primary" />
        <span className="text-[9px] font-bold text-textMuted">Entreno</span>
      </div>
    </div>
  );
}
