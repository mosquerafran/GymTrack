import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useCerrarConAtras } from "../../hooks/useHistorial";

interface HojaProps {
  abierta: boolean;
  onCerrar: () => void;
  titulo: string;
  /** Pantalla completa (registro) en vez de panel desde abajo (detalle, confirmaciones). */
  completa?: boolean;
  /** Algo a la derecha del título (ej. la fecha). */
  accion?: React.ReactNode;
  /** Barra fija de abajo (ej. "Guardar"), siempre al alcance del pulgar. */
  pie?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Panel que sube desde abajo (bottom sheet), pensado para usar con una mano en el celu.
 * En escritorio es un diálogo centrado. Cierra con la X, tocando afuera, con Escape o con
 * "atrás" del celu. Bloquea el scroll de atrás y devuelve el foco al cerrar.
 */
export default function Hoja({ abierta, onCerrar, titulo, completa = false, accion, pie, children }: HojaProps): React.ReactElement | null {
  const panel = useRef<HTMLDivElement>(null);
  useCerrarConAtras(abierta, onCerrar);

  useEffect(() => {
    if (!abierta) return;
    const previo = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const alTeclado = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Con hojas apiladas, Escape cierra solo la de arriba.
      const dialogos = document.querySelectorAll("[data-hoja]");
      if (dialogos[dialogos.length - 1] === panel.current) onCerrar();
    };
    document.addEventListener("keydown", alTeclado);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", alTeclado);
      previo?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta]);

  if (!abierta) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={panel}
        data-hoja
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={`relative flex flex-col w-full bg-surface text-textMain shadow-premium outline-none animate-hoja
          ${completa
            ? "h-[100dvh] md:h-auto md:max-h-[90dvh] md:max-w-lg md:rounded-3xl"
            : "max-h-[92dvh] rounded-t-3xl md:max-w-lg md:rounded-3xl"}`}
      >
        {!completa && <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-borderBase shrink-0 md:hidden" aria-hidden="true" />}
        <div className={`flex items-center gap-2 pl-4 pr-2 py-2 border-b border-borderBase shrink-0 ${completa ? "pt-safe-2" : ""}`}>
          <h2 className="flex-1 min-w-0 truncate font-heading text-lg uppercase tracking-wide">{titulo}</h2>
          {accion}
          <button type="button" onClick={onCerrar} className="btn-icon text-textMuted shrink-0" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {pie && <div className="shrink-0 border-t border-borderBase bg-surface px-4 pt-3 pb-safe-3">{pie}</div>}
        {!pie && <div className="shrink-0 pb-safe" />}
      </div>
    </div>,
    document.body
  );
}
