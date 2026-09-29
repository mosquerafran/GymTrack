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

  const entreno = useCallback((date: Date) => (entrenos[formatDateLocal(date)] || []).length > 0, [entrenos]);

  const tileContent = useCallback(({ date, view }: TileArgs) => {
    if (view !== "month" || !entreno(date)) return null;
    return <span className="sr-only">, entrenaste</span>;
  }, [entreno]);

  const tileClassName = useCallback(({ date, view }: TileArgs) => {
    if (view !== "month") return "";
    const clases = ["rounded-lg"];
    if (entreno(date)) clases.push("!bg-textMain !text-background font-bold");
    if (formatDateLocal(date) === hoy) clases.push("ring-2 ring-inset ring-primary");
    return clases.join(" ");
  }, [entreno, hoy]);

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
    </section>
  );
}
