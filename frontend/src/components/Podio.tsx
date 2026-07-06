import React from "react";
import { RankingUser } from "../services/statsService";

interface PodioProps {
  ranking: RankingUser[];
  /** Nombre del usuario actual, para resaltar su lugar. */
  miNombre?: string;
}

const MEDALLAS = ["🥇", "🥈", "🥉"];

// Config visual por puesto (0 = 1°). Orden de render = [2°, 1°, 3°] para el podio.
const CONFIG = [
  { pedestal: "h-16", ring: "ring-primary", grad: "from-primary/30 to-primary/5", txt: "text-primary" }, // 1°
  { pedestal: "h-10", ring: "ring-textMuted/40", grad: "from-surfaceHighlight to-surfaceHighlight/30", txt: "text-textMain" }, // 2°
  { pedestal: "h-7", ring: "ring-amber-700/40", grad: "from-amber-700/20 to-amber-700/5", txt: "text-textMain" }, // 3°
];

/**
 * Podio top-3 del ranking. Si hay menos de 3 personas, muestra las que haya.
 */
export default function Podio({ ranking, miNombre }: PodioProps): React.ReactElement | null {
  const top = ranking.slice(0, 3);
  if (top.length < 2) return null; // sin competencia real, no hay podio

  // Orden visual: 2° a la izquierda, 1° al centro, 3° a la derecha.
  const ordenVisual = [1, 0, 2].filter((i) => i < top.length);

  return (
    <div className="glass-panel p-5 sm:p-6 bg-primary/[0.02]">
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {ordenVisual.map((idx) => {
          const u = top[idx];
          const cfg = CONFIG[idx];
          const esMio = !!miNombre && u.nombre === miNombre;
          return (
            <div key={u.nombre} className="flex-1 max-w-[33%] flex flex-col items-center">
              <span className="text-2xl sm:text-3xl leading-none mb-1.5">{MEDALLAS[idx]}</span>

              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b ${cfg.grad} ring-2 ${cfg.ring} flex items-center justify-center font-display font-bold text-lg text-textMain shadow-sm`}>
                {u.nombre.charAt(0).toUpperCase()}
              </div>

              <span className={`mt-1.5 text-[11px] sm:text-xs font-black text-center leading-tight truncate max-w-full px-1 ${esMio ? "text-primary" : "text-textMain"}`}>
                {u.nombre}{esMio && " (vos)"}
              </span>

              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`scoreboard text-lg font-bold ${cfg.txt}`}>{u.dias}</span>
                <span className="text-[9px] font-bold text-textMuted">d · {u.porcentaje}%</span>
              </div>

              {/* Pedestal */}
              <div className={`mt-2 w-full ${cfg.pedestal} rounded-t-xl bg-gradient-to-b ${cfg.grad} border border-borderBase/60 border-b-0 flex items-start justify-center pt-1.5`}>
                <span className={`scoreboard text-sm font-bold ${cfg.txt}`}>{idx + 1}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
