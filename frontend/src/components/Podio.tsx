import React from "react";
import { RankingUser } from "../services/statsService";

interface PodioProps {
  ranking: RankingUser[];
  /** Nombre del usuario actual, para resaltar su lugar. */
  miNombre?: string;
}

// Alto del escalón por puesto (0 = 1°). Orden de render = [2°, 1°, 3°].
const ALTO = ["h-[72px]", "h-[50px]", "h-[34px]"];

/**
 * Podio top-3 con la geometría del gorila: avatares hexagonales y escalones con los
 * hombros cortados. El 1° va en el rojo de la marca. Con menos de 2 personas no hay podio.
 */
export default function Podio({ ranking, miNombre }: PodioProps): React.ReactElement | null {
  const top = ranking.slice(0, 3);
  if (top.length < 2) return null;

  const ordenVisual = [1, 0, 2].filter((i) => i < top.length);

  return (
    <div className="flex items-end justify-center gap-2" role="list" aria-label="Podio">
      {ordenVisual.map((idx) => {
        const u = top[idx];
        const esMio = !!miNombre && u.nombre === miNombre;
        const primero = idx === 0;
        return (
          <div key={u.nombre} role="listitem" className="flex-1 max-w-[33%] flex flex-col items-center gap-1 min-w-0">
            <div
              className={`hex grid place-items-center font-display text-xl ${primero ? "w-[60px] h-[66px] bg-textMain text-background" : "w-[50px] h-[56px] bg-surfaceHighlight text-textMain"}`}
              aria-hidden="true"
            >
              {u.nombre.charAt(0).toUpperCase()}
            </div>
            <span className={`text-sm font-bold text-center leading-tight truncate max-w-full px-1 ${esMio ? "text-primary" : "text-textMain"}`}>
              {u.nombre}{esMio && " (vos)"}
            </span>
            <span className="font-mono text-xs text-textMuted">{u.dias} d · {u.porcentaje}%</span>
            <div
              className={`escalon w-full ${ALTO[idx]} grid place-items-start justify-center pt-1.5 font-display text-2xl
                ${primero ? "bg-primary text-white" : "bg-surfaceHighlight text-textMain"}`}
            >
              {idx + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
}
