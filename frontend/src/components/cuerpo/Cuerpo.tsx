import React, { memo } from "react";
import { CUERPO, VIEWBOX } from "./datos";
import { Musculo, NOMBRE_MUSCULO, SLUG_A_MUSCULO, Sexo } from "../../config/entrenos";

export type LadoCuerpo = "front" | "back";

interface CuerpoProps {
  sexo: Sexo;
  lado: LadoCuerpo;
  /** Músculos marcados (se pintan con el color primario). */
  seleccion?: ReadonlySet<Musculo>;
  /** Mapa de calor: días por músculo (1, 2, 3+ → tres intensidades). */
  intensidad?: Partial<Record<Musculo, number>>;
  /** Músculo con borde marcado (detalle del mapa de calor). */
  resaltado?: Musculo | null;
  /** Texto accesible de cada músculo tocable (default: su nombre). */
  describir?: (m: Musculo) => string;
  /** Si viene, cada músculo es un botón (click, Enter o Espacio lo marca/desmarca). */
  onToggle?: (m: Musculo) => void;
  /** Texto accesible de la figura ("Cuerpo de frente"). */
  etiqueta: string;
  className?: string;
}

/**
 * Figura del cuerpo (frente o espalda) con los músculos de config/entrenos.ts.
 * Los colores salen del tema (index.css → .cuerpo), así que sigue al modo oscuro.
 */
function Cuerpo({ sexo, lado, seleccion, intensidad, resaltado, describir, onToggle, etiqueta, className = "" }: CuerpoProps): React.ReactElement {
  const modelo = CUERPO[sexo];
  const tocable = !!onToggle;

  const alTeclado = (m: Musculo) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle?.(m);
    }
  };

  return (
    <svg
      viewBox={VIEWBOX[sexo][lado]}
      className={`cuerpo ${tocable ? "tocable" : ""} ${className}`}
      role={etiqueta ? (tocable ? "group" : "img") : undefined}
      aria-label={etiqueta || undefined}
      aria-hidden={etiqueta ? undefined : true}
    >
      {modelo[lado].map((parte, i) => {
        const m = SLUG_A_MUSCULO[parte.s];
        return parte.p.map((d, j) => {
          const key = `${i}-${j}`;
          if (!m) return <path key={key} d={d} className="cuerpo-base" />;

          const on = !!seleccion?.has(m);
          const dias = intensidad?.[m] || 0;
          const clase = `cuerpo-m${on ? " on" : ""}${dias ? ` i${Math.min(dias, 3)}` : ""}${resaltado === m ? " sel" : ""}`;
          if (!tocable) {
            return (
              <path key={key} d={d} className={clase}>
                <title>{NOMBRE_MUSCULO[m]}{dias ? `: ${dias} ${dias === 1 ? "día" : "días"}` : ""}</title>
              </path>
            );
          }
          return (
            <path
              key={key}
              d={d}
              className={clase}
              role="button"
              tabIndex={0}
              aria-label={describir ? describir(m) : NOMBRE_MUSCULO[m]}
              aria-pressed={describir ? resaltado === m : on}
              onClick={() => onToggle!(m)}
              onKeyDown={alTeclado(m)}
            />
          );
        });
      })}
      {modelo.outline[lado] && <path d={modelo.outline[lado]} className="cuerpo-contorno" />}
    </svg>
  );
}

export default memo(Cuerpo);
