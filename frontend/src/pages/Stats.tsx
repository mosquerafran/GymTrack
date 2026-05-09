import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { calcularStats, StatsData, PeriodoStats } from "../services/statsService";
import { TrendingUp, Crown, Calendar, List, Trophy } from "lucide-react";

interface StatsProps {
  user: User;
  grupoId: string;
}

export default function Stats({ user, grupoId }: StatsProps): React.ReactElement {
  const [data, setData] = useState<StatsData | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoStats>("por_anio");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) cargar(periodo);
  }, [user, periodo]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-24 px-4 sm:px-0">
      {/* Header & Filter */}
      <div className="flex flex-col gap-6 border-b border-borderBase pb-8">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-black text-textMain tracking-tighter">Tu Progreso</h1>
          <p className="text-textMuted text-sm font-medium mt-1">Estadísticas de entrenamiento y frecuencia.</p>
        </div>
        
        <div className="flex bg-surfaceHighlight p-1 rounded-xl border border-borderBase self-center sm:self-start overflow-x-auto max-w-full">
          {[
            { id: "mes", label: "ESTE MES" },
            { id: "por_mes", label: "ÚLT. 6 MESES" },
            { id: "por_anio", label: "ESTE AÑO" }
          ].map((opt) => (
            <button
              key={opt.id}
              className={`px-6 py-2.5 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${periodo === opt.id ? "bg-surface text-primary shadow-sm" : "text-textMuted hover:text-textMain"}`}
              onClick={() => setPeriodo(opt.id as PeriodoStats)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Big Number Card */}
        <div className="glass-panel p-12 flex flex-col items-center justify-center bg-primary/[0.03] border-primary/10 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-accent/5 rounded-full blur-2xl transition-colors" />
          
          <span className="text-8xl font-black text-primary tracking-tighter mb-2 animate-float">{data.totalDiasEntrenados}</span>
          <span className="text-xs font-black text-textMuted uppercase tracking-[0.4em] text-center">Días de Entrenamiento</span>
          
          <div className="mt-8 flex items-center gap-4">
            <div className="px-4 py-2 bg-primary/10 rounded-2xl text-[10px] font-black text-primary flex items-center gap-2 border border-primary/20">
              <Calendar size={14} />
              {periodo === "mes" ? "MES ACTUAL" : periodo === "por_anio" ? "AÑO ACTUAL" : "ÚLTIMOS 6 MESES"}
            </div>
            <div className="px-4 py-2 bg-surfaceHighlight rounded-2xl text-[10px] font-black text-textMuted flex items-center gap-2 border border-borderBase">
              <TrendingUp size={14} className="text-primary" />
              FRECUENCIA
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
        {/* Category Breakdown */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-textMuted uppercase tracking-[0.3em] flex items-center gap-2">
              <List size={14} className="text-primary" /> Total por Categoría
            </h2>
            <span className="text-[9px] font-bold text-textMuted/60 uppercase">Histórico del Periodo</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.conteoPorCategoria.map((cat) => (
              <div key={cat.nombre} className="flex items-center justify-between p-4 rounded-2xl bg-surfaceHighlight/30 border border-borderBase/50 group hover:border-primary/20 hover:bg-surfaceHighlight/50 transition-all">
                <span className="text-xs font-bold text-textMain truncate mr-2">{cat.nombre}</span>
                <span className="text-sm font-black text-primary bg-primary/5 px-2 py-1 rounded-lg min-w-[32px] text-center">{cat.valor}</span>
              </div>
            ))}
            {data.conteoPorCategoria.length === 0 && (
              <p className="col-span-2 py-8 text-center text-[10px] font-bold text-textMuted uppercase tracking-widest border border-dashed border-borderBase rounded-3xl">Sin actividad registrada</p>
            )}
          </div>
        </div>

        {/* Refined Ranking */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-textMuted uppercase tracking-[0.3em] flex items-center gap-2">
              <Trophy size={14} className="text-primary" /> Ranking del Grupo
            </h2>
          </div>

          <div className="space-y-3">
            {data.ranking.map((usr, idx) => (
              <div 
                key={usr.nombre} 
                className={`flex flex-col p-4 rounded-3xl transition-all ${idx === 0 ? "bg-primary/[0.04] border border-primary/10" : "bg-surfaceHighlight/20 border border-borderBase/40"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border ${idx === 0 ? "bg-primary text-white border-transparent" : "bg-surfaceHighlight border-borderBase text-textMain"}`}>
                      {idx === 0 ? <Crown size={12} /> : idx + 1}
                    </div>
                    <span className={`text-sm font-black ${idx === 0 ? "text-textMain" : "text-textMuted"}`}>{usr.nombre}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-black ${idx === 0 ? "text-primary" : "text-textMain"}`}>{usr.dias}</span>
                    <span className="text-[9px] font-bold text-textMuted uppercase">días</span>
                  </div>
                </div>

                {/* All categories breakdown */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 pl-11">
                  {Object.entries(usr.categorias)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-textMuted/80 uppercase tracking-tight">{name}</span>
                        <span className="text-[10px] font-black text-textMain">{count}</span>
                        <span className="text-[10px] text-textMuted/30 last:hidden">•</span>
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
    </div>
  );
}
