import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { calcularStats, StatsData, PeriodoStats } from "../services/statsService";
import { obtenerMetaSemanal } from "../services/usuarioService";
import { META_SEMANAL_DEFAULT } from "../types";
import { Crown, Calendar, List, Trophy, Target } from "lucide-react";
import YearHeatmap from "../components/YearHeatmap";
import Podio from "../components/Podio";

interface StatsProps {
  user: User;
  grupoId: string;
}

const PERIODOS: { id: PeriodoStats; label: string }[] = [
  { id: "mes", label: "ESTE MES" },
  { id: "por_mes", label: "ÚLT. 6 MESES" },
  { id: "por_anio", label: "ESTE AÑO" },
];

export default function Stats({ user, grupoId }: StatsProps): React.ReactElement {
  const [data, setData] = useState<StatsData | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoStats>("por_anio");
  const [loading, setLoading] = useState<boolean>(true);
  const [metaSemanal, setMetaSemanal] = useState<number>(META_SEMANAL_DEFAULT);

  const anioActual = new Date().getFullYear();

  useEffect(() => {
    if (user) cargar(periodo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, periodo]);

  useEffect(() => {
    if (user?.email) obtenerMetaSemanal(user.email).then(setMetaSemanal).catch(() => {});
  }, [user]);

  const cargar = async (tipoPeriodo: PeriodoStats) => {
    setLoading(true);
    try {
      const resultado = await calcularStats(user.uid, grupoId, tipoPeriodo);
      setData(resultado);
    } catch (e) {
      console.error("Error cargando stats:", e);
    }
    setLoading(false);
  };

  if (loading || !data) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-textMuted text-xs font-medium">Cargando...</p>
    </div>
  );

  const periodoLabel = periodo === "mes" ? "ESTE MES" : periodo === "por_anio" ? "ESTE AÑO" : "ÚLT. 6 MESES";
  const semanaCompleta = data.diasEstaSemana >= metaSemanal;

  // Comparativa semana vs semana pasada
  const deltaSemana = data.diasEstaSemana - data.diasSemanaPasada;
  const deltaColor = deltaSemana > 0 ? "text-green-500" : deltaSemana < 0 ? "text-red-500" : "text-textMuted";
  const deltaIcon = deltaSemana > 0 ? "↑" : deltaSemana < 0 ? "↓" : "=";

  // Nudge de récord de racha
  let recordNudge: string | null = null;
  if (data.rachaActual > 0) {
    if (data.rachaActual >= data.rachaRecord) {
      recordNudge = `🔥 ¡Estás en tu mejor racha histórica (${data.rachaActual} días)! No la cortes.`;
    } else if (data.rachaRecord - data.rachaActual <= 3) {
      recordNudge = `A ${data.rachaRecord - data.rachaActual} día(s) de igualar tu récord de ${data.rachaRecord}. 💪`;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-24 px-1 sm:px-0">
      {/* Header & Filter */}
      <div className="flex flex-col gap-5 border-b border-borderBase pb-6">
        <div className="text-center sm:text-left">
          <h1 className="font-display text-5xl sm:text-6xl text-textMain tracking-tight leading-none">TU PROGRESO</h1>
          <p className="eyebrow mt-2">Constancia · Rachas · Ranking</p>
        </div>

        <div className="flex bg-surfaceHighlight p-1 rounded-xl border border-borderBase self-stretch sm:self-start overflow-x-auto hide-scrollbar">
          {PERIODOS.map((opt) => (
            <button
              key={opt.id}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${periodo === opt.id ? "bg-surface text-primary shadow-sm" : "text-textMuted hover:text-textMain"}`}
              onClick={() => setPeriodo(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel personal: constancia + rachas + semana */}
      <div className="glass-panel p-6 sm:p-8 space-y-6 bg-primary/[0.02]">
        {/* % de constancia */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-7xl sm:text-8xl text-primary leading-none">{data.porcentaje}</span>
              <span className="font-display text-3xl text-primary/60">%</span>
            </div>
            <p className="eyebrow mt-2">Constancia</p>
          </div>
          <div className="text-right shrink-0">
            <p className="scoreboard text-2xl font-bold text-textMain leading-none">
              {data.totalDiasEntrenados}<span className="text-textMuted text-lg">/{data.diasPosibles}</span>
            </p>
            <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mt-1">Días entrenados</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-primary/10 rounded-lg text-[9px] font-black text-primary border border-primary/20">
              <Calendar size={11} /> {periodoLabel}
            </span>
          </div>
        </div>

        {/* Barra de constancia */}
        <div className="h-2.5 w-full bg-surfaceHighlight rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-700"
            style={{ width: `${data.porcentaje}%` }}
          />
        </div>

        {/* Tiles: racha, récord, semana */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surfaceHighlight/40 border border-borderBase/60 rounded-2xl p-3 sm:p-4 text-center">
            <div className="text-2xl leading-none mb-1">🔥</div>
            <p className="scoreboard text-2xl sm:text-3xl font-bold text-textMain leading-none">{data.rachaActual}</p>
            <p className="text-[9px] font-black text-textMuted uppercase tracking-widest mt-1.5">Racha</p>
          </div>
          <div className="bg-surfaceHighlight/40 border border-borderBase/60 rounded-2xl p-3 sm:p-4 text-center">
            <div className="text-2xl leading-none mb-1">🏆</div>
            <p className="scoreboard text-2xl sm:text-3xl font-bold text-textMain leading-none">{data.rachaRecord}</p>
            <p className="text-[9px] font-black text-textMuted uppercase tracking-widest mt-1.5">Récord</p>
          </div>
          <div className={`rounded-2xl p-3 sm:p-4 text-center border ${semanaCompleta ? "bg-primary/10 border-primary/30" : "bg-surfaceHighlight/40 border-borderBase/60"}`}>
            <div className="text-2xl leading-none mb-1">{semanaCompleta ? "✅" : "📅"}</div>
            <p className="scoreboard text-2xl sm:text-3xl font-bold text-textMain leading-none">
              {data.diasEstaSemana}<span className="text-textMuted text-base">/{metaSemanal}</span>
            </p>
            <p className="text-[9px] font-black text-textMuted uppercase tracking-widest mt-1.5">Semana</p>
            <p className={`text-[9px] font-black mt-1 ${deltaColor}`} title="Comparado con la semana pasada">
              {deltaIcon}{deltaSemana !== 0 ? Math.abs(deltaSemana) : ""} <span className="text-textMuted/70">vs. ant.</span>
            </p>
          </div>
        </div>

        {/* Nudge de récord de racha */}
        {recordNudge && (
          <div className="flex items-center gap-2 text-[11px] font-bold text-textMain bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">
            <Trophy size={14} className="text-accent shrink-0" />
            <span>{recordNudge}</span>
          </div>
        )}

        {/* Objetivo semanal */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-textMuted">
          <Target size={13} className="text-primary shrink-0" />
          {semanaCompleta ? (
            <span>¡Meta de la semana cumplida! ({metaSemanal} días) 💪</span>
          ) : (
            <span>Te faltan <span className="text-textMain font-black">{metaSemanal - data.diasEstaSemana}</span> día(s) para tu meta semanal. Ajustala en Ajustes.</span>
          )}
        </div>
      </div>

      {/* Heatmap anual */}
      <div className="glass-panel p-6 sm:p-8">
        <YearHeatmap dias={data.diasEntrenadosAnio} anio={anioActual} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Desglose por categoría */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow flex items-center gap-2">
              <List size={14} className="text-primary" /> Total por Categoría
            </h2>
            <span className="font-mono text-[9px] text-textMuted/60 uppercase">Período</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.conteoPorCategoria.map((cat) => (
              <div key={cat.nombre} className="flex items-center justify-between p-4 rounded-2xl bg-surfaceHighlight/30 border border-borderBase/50 hover:border-primary/20 transition-all">
                <span className="text-sm font-bold text-textMain truncate mr-2">{cat.nombre}</span>
                <span className="scoreboard text-base font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg min-w-[36px] text-center">{cat.valor}</span>
              </div>
            ))}
            {data.conteoPorCategoria.length === 0 && (
              <p className="col-span-2 py-8 text-center text-[10px] font-bold text-textMuted uppercase tracking-widest border border-dashed border-borderBase rounded-3xl">Sin actividad registrada</p>
            )}
          </div>
        </div>

        {/* Ranking del grupo con % de constancia */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow flex items-center gap-2">
              <Trophy size={14} className="text-primary" /> Ranking del Grupo
            </h2>
          </div>

          <Podio ranking={data.ranking} miNombre={user.displayName || undefined} />

          <div className="space-y-3">
            {data.ranking.map((usr, idx) => (
              <div
                key={usr.nombre}
                className={`flex flex-col p-4 rounded-3xl transition-all ${idx === 0 ? "bg-primary/[0.04] border border-primary/10" : "bg-surfaceHighlight/20 border border-borderBase/40"}`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center scoreboard text-base font-bold border shrink-0 ${idx === 0 ? "bg-primary text-white border-transparent" : "bg-surfaceHighlight border-borderBase text-textMain"}`}>
                      {idx === 0 ? <Crown size={14} /> : idx + 1}
                    </div>
                    <span className={`text-sm font-black truncate ${idx === 0 ? "text-textMain" : "text-textMuted"}`}>{usr.nombre}</span>
                  </div>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className={`scoreboard text-2xl font-bold ${idx === 0 ? "text-primary" : "text-textMain"}`}>{usr.dias}</span>
                    <span className="text-[9px] font-bold text-textMuted uppercase">días</span>
                    <span className="scoreboard text-xs font-bold text-textMuted ml-1.5">{usr.porcentaje}%</span>
                  </div>
                </div>

                {/* Barra de constancia del usuario */}
                <div className="h-1.5 w-full bg-surfaceHighlight rounded-full overflow-hidden mb-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? "bg-primary" : "bg-textMuted/50"}`}
                    style={{ width: `${usr.porcentaje}%` }}
                  />
                </div>

                {/* Desglose de categorías */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {Object.entries(usr.categorias)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-textMuted/80 uppercase tracking-tight">{name}</span>
                        <span className="scoreboard text-[11px] font-bold text-textMain">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {data.ranking.length === 0 && (
              <p className="py-8 text-center text-[10px] font-bold text-textMuted uppercase tracking-widest border border-dashed border-borderBase rounded-3xl">Sin ranking disponible</p>
            )}
          </div>
        </div>
      </div>

      {/* Nota metodológica */}
      <p className="text-center text-[10px] text-textMuted/70 font-medium leading-relaxed max-w-md mx-auto pt-2">
        La constancia es el % de días que entrenaste sobre los días transcurridos del período.
        Solo cuentan las categorías marcadas para el ranking. Un día cuenta una sola vez.
      </p>
    </div>
  );
}
