import React, { useCallback } from "react";
import Calendar, { TileArgs } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { formatDateLocal } from "../utils/date";

interface CalendarViewProps {
  /** Mes que se está mostrando. */
  mes: Date;
  /** Días con entrenos del usuario: { "YYYY-MM-DD": [...] }. */
  entrenos: Record<string, unknown[]>;
  onMonthChange?: (date: Date) => void;
  /** Tocar un día abre su detalle (quién entrenó, editar lo propio). */
  onAbrirDia: (date: Date) => void;
}

/** Calendario del usuario: los días entrenados se marcan; tocar un día abre el detalle. */
export default function CalendarView({ mes, entrenos, onMonthChange, onAbrirDia }: CalendarViewProps): React.ReactElement {
  const hoy = formatDateLocal(new Date());

  const cantidad = useCallback((date: Date) => (entrenos[formatDateLocal(date)] || []).length, [entrenos]);

  // Un rombo por entreno del día (hasta 3), el mismo del que usa "Esta semana".
  const tileContent = useCallback(({ date, view }: TileArgs) => {
    if (view !== "month") return null;
    const n = cantidad(date);
    if (!n) return null;
    return (
      <>
        <span className="sr-only">, {n === 1 ? "entrenaste" : `entrenaste ${n} veces`}</span>
        <span className="absolute bottom-[14%] left-0 right-0 flex justify-center gap-[3px]" aria-hidden="true">
          {Array.from({ length: Math.min(n, 3) }, (_, i) => (
            <i key={i} className="block w-[7px] h-[7px] rombo bg-textMain" />
          ))}
        </span>
      </>
    );
  }, [cantidad]);

  const tileClassName = useCallback(({ date, view }: TileArgs) => {
    if (view !== "month") return "";
    return cantidad(date) && formatDateLocal(date) !== hoy ? "font-bold" : "";
  }, [cantidad, hoy]);

  return (
    <section className="glass-panel p-4 sm:p-6" aria-labelledby="cal-titulo">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 id="cal-titulo" className="font-heading text-base uppercase tracking-wide">Tu calendario</h2>
        <span className="font-mono text-xs text-textMuted">tocá un día</span>
      </div>
      <div className="custom-calendar-container">
        <Calendar
          locale="es-AR"
          activeStartDate={new Date(mes.getFullYear(), mes.getMonth(), 1)}
          value={null}
          maxDate={new Date()}
          onClickDay={onAbrirDia}
          onActiveStartDateChange={({ activeStartDate, view }) => {
            if (view === "month" && onMonthChange && activeStartDate) onMonthChange(activeStartDate);
          }}
          tileContent={tileContent}
          tileClassName={tileClassName}
          calendarType="iso8601"
          next2Label={null}
          prev2Label={null}
          minDetail="month"
        />
      </div>
      <div className="flex gap-4 mt-2 font-mono text-xs text-textMuted" aria-hidden="true">
        <span className="flex items-center gap-1.5"><i className="block w-[7px] h-[7px] rombo bg-textMain" />entrenaste</span>
        <span className="flex items-center gap-1.5"><i className="block w-2.5 h-2.5 border-2 border-primary" />hoy</span>
      </div>
    </section>
  );
}
