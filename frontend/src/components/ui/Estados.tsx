import React from "react";
import { LucideIcon, RotateCw } from "lucide-react";

/** Spinner único de la app (antes había cinco distintos). */
export function Spinner({ grande = false, className = "" }: { grande?: boolean; className?: string }): React.ReactElement {
  return (
    <div
      className={`animate-spin rounded-full border-primary border-t-transparent ${grande ? "h-12 w-12 border-4" : "h-8 w-8 border-[3px]"} ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}

/** Bloque de "cargando" con texto, centrado. */
export function Cargando({ texto = "Cargando…" }: { texto?: string }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" aria-live="polite">
      <Spinner />
      <p className="text-sm text-textMuted">{texto}</p>
    </div>
  );
}

interface EstadoVacioProps {
  icono: LucideIcon;
  titulo: string;
  texto?: string;
  accion?: React.ReactNode;
}

/** Estado vacío común: qué falta y cómo seguir. */
export function EstadoVacio({ icono: Icono, titulo, texto, accion }: EstadoVacioProps): React.ReactElement {
  return (
    <div className="glass-panel p-8 text-center flex flex-col items-center gap-3">
      <Icono size={32} className="text-accent" aria-hidden="true" />
      <p className="font-heading text-lg uppercase tracking-wide">{titulo}</p>
      {texto && <p className="text-sm text-textMuted max-w-xs">{texto}</p>}
      {accion}
    </div>
  );
}

/** Error con reintento: no se confunde con "no hay datos". */
export function ErrorCarga({ texto, onReintentar }: { texto: string; onReintentar: () => void }): React.ReactElement {
  return (
    <div className="glass-panel p-6 text-center flex flex-col items-center gap-3">
      <p className="font-heading text-lg uppercase tracking-wide">{texto}</p>
      <p className="text-sm text-textMuted">Revisá la conexión y probá de nuevo.</p>
      <button type="button" className="btn-primary" onClick={onReintentar}>
        <RotateCw size={18} /> Reintentar
      </button>
    </div>
  );
}
