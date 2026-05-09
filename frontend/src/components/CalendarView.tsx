import React from "react";
import Calendar, { TileArgs } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Categoria } from "../types";

interface CalendarViewProps {
  fecha: Date;
  setFecha: (date: Date) => void;
  entrenos: Record<string, string[]>;
  categoriasMap: Record<string, Categoria>;
  onMonthChange?: (date: Date) => void;
  abrirDetalle?: (date: Date) => void;
}

export default function CalendarView({ fecha, setFecha, entrenos, categoriasMap, onMonthChange, abrirDetalle }: CalendarViewProps): React.ReactElement {
  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const tileContent = ({ date, view }: TileArgs) => {
    if (view === "month") {
      const dateStr = formatDate(date);
      const diaEntrenos = entrenos[dateStr];
      if (diaEntrenos && diaEntrenos.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </div>
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }: TileArgs) => {
    if (view === "month") {
      const dateStr = formatDate(date);
      if (entrenos[dateStr] && entrenos[dateStr].length > 0) {
        return "bg-primary/10 text-primary font-bold rounded-lg border border-primary/20";
      }
    }
    return "rounded-lg hover:bg-surfaceHighlight transition-colors";
  };

  const handleClickDay = (value: Date) => {
    setFecha(value);
    if (abrirDetalle) abrirDetalle(value);
  };

  return (
    <div className="glass-panel p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="text-primary">📅</span> Mi Calendario
        </h2>
      </div>
      <div className="custom-calendar-container">
        <Calendar
          onChange={(val) => setFecha(val as Date)}
          value={fecha}
          onClickDay={handleClickDay}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (onMonthChange && activeStartDate) onMonthChange(activeStartDate);
          }}
          tileContent={tileContent}
          tileClassName={tileClassName}
        />
      </div>
    </div>
  );
}
