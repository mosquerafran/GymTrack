import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Alerta } from "../config/alertas";

/** Botón que copia el código de invitación del grupo (si el navegador no deja, lo muestra). */
export default function CodigoCopiable({ codigo }: { codigo: string }): React.ReactElement {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      Alerta.fire({ titleText: "Código del grupo", text: codigo, confirmButtonText: "Listo" });
    }
  };
  return (
    <button
      type="button"
      onClick={copiar}
      className="flex items-center gap-1.5 min-h-tap px-3 border-2 border-textMain text-textMain font-mono font-bold text-sm shrink-0"
      aria-label={copiado ? `Código ${codigo} copiado` : `Copiar el código de invitación ${codigo}`}
    >
      {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      {codigo}
    </button>
  );
}
