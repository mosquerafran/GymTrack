import React from "react";
import { Download, Share, SquarePlus, CheckCircle2 } from "lucide-react";
import { useInstalacion } from "../hooks/usePwa";
import { NOMBRE_APP } from "../config/marca";

/**
 * "Instalar la app" en Ajustes. Android/Chrome: botón que abre el instalador. iPhone: iOS no
 * deja instalar desde la página, así que muestra los pasos (Compartir → Agregar a inicio).
 * Si ya está instalada o el navegador no lo permite, no molesta.
 */
export default function InstalarApp(): React.ReactElement | null {
  const { estado, instalar } = useInstalacion();
  if (estado === "no-disponible") return null;

  return (
    <section className="glass-panel p-5 sm:p-6 space-y-3" aria-labelledby="inst-titulo">
      <h3 id="inst-titulo" className="font-heading text-lg uppercase tracking-wide flex items-center gap-2">
        <Download size={20} className="text-accent" aria-hidden="true" /> Instalar la app
      </h3>

      {estado === "instalada" && (
        <p className="flex items-center gap-2 text-sm text-textMuted">
          <CheckCircle2 size={18} aria-hidden="true" /> Ya la estás usando instalada.
        </p>
      )}

      {estado === "instalable" && (
        <>
          <p className="text-sm text-textMuted">
            Queda como una app más en tu celu: abre al toque, a pantalla completa y sin señal.
          </p>
          <button type="button" className="btn-primary w-full" onClick={instalar}>
            <Download size={20} aria-hidden="true" /> Instalar {NOMBRE_APP}
          </button>
        </>
      )}

      {estado === "ios" && (
        <ol className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="font-display w-5">1</span> Abrila en <b>Safari</b> (en otros navegadores de iPhone no se puede).
          </li>
          <li className="flex items-center gap-2">
            <span className="font-display w-5">2</span> Tocá <Share size={18} aria-label="Compartir" /> <b>Compartir</b>.
          </li>
          <li className="flex items-center gap-2">
            <span className="font-display w-5">3</span> Elegí <SquarePlus size={18} aria-hidden="true" /> <b>Agregar a inicio</b>.
          </li>
        </ol>
      )}
    </section>
  );
}
