import React from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useActualizacion, useConexion } from "../hooks/usePwa";

/**
 * Avisos de la PWA: "Sin conexión" (fijo arriba, bajo el header) y "Hay una versión nueva"
 * (abajo, sobre la barra de navegación, al alcance del pulgar).
 */
export default function AvisosPwa(): React.ReactElement {
  const online = useConexion();
  const { hayVersionNueva, actualizar } = useActualizacion();

  return (
    <>
      {!online && (
        <div
          role="status"
          className="fixed z-[55] inset-x-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[28rem] top-[calc(env(safe-area-inset-top)+68px)] flex items-center gap-2 px-3 py-2 bg-textMain text-background text-sm font-semibold chanfle shadow-premium"
        >
          <WifiOff size={18} className="shrink-0" aria-hidden="true" />
          Sin conexión: ves lo último guardado. Para registrar, esperá a tener señal.
        </div>
      )}

      {hayVersionNueva && (
        <div
          role="alert"
          className="fixed z-[60] inset-x-3 md:inset-x-auto md:right-6 md:w-96 bottom-[calc(env(safe-area-inset-bottom)+84px)] md:bottom-6 flex items-center gap-3 p-3 bg-textMain text-background shadow-premium losa"
        >
          <span className="flex-1 text-sm font-semibold">Hay una versión nueva de la app.</span>
          <button type="button" onClick={actualizar} className="btn-primary !px-4 !py-2 shrink-0">
            <RefreshCw size={18} aria-hidden="true" /> Actualizar
          </button>
        </div>
      )}
    </>
  );
}
