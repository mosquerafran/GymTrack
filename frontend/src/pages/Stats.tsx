import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { calcularStats, RankingUser, StatsData } from "../services/statsService";
import { calcularMedallas } from "../services/gamificationService";
import { Award, TrendingUp, Crown } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from "recharts";
import { StatItem, Medalla } from "../types";

const SECONDARY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

interface StatsProps {
  user: User;
  grupoId: string;
}

export default function Stats({ user, grupoId }: StatsProps): React.ReactElement {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [totalDias, setTotalDias] = useState<number>(0);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [medallas, setMedallas] = useState<Medalla[]>([]);
  const [periodo, setPeriodo] = useState<"mes" | "global">("mes");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) cargar(periodo);
  }, [user, periodo]);

  const cargar = async (tipoPeriodo: "mes" | "global") => {
    setLoading(true);
    try {
      const resultado: StatsData = await calcularStats(user.uid, grupoId, tipoPeriodo);
      setStats(resultado.stats);
      setTotalDias(resultado.totalDias);
      setRanking(resultado.ranking);
      
      if (tipoPeriodo === "global") {
        setMedallas(calcularMedallas(resultado.misAsistencias));
      } else {
        const hist: StatsData = await calcularStats(user.uid, grupoId, "global");
        setMedallas(calcularMedallas(hist.misAsistencias));
      }
    } catch (e) {
      console.error("Error cargando stats:", e);
    }
    setLoading(false);
  };

  const dataPie = stats.filter(s => s.valor > 0).map(s => ({
    name: s.nombre,
    value: s.valor
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-textMuted text-xs font-medium">Cargando...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-24">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-borderBase pb-6">
        <div>
          <h1 className="text-3xl font-bold text-textMain tracking-tight">Estadísticas</h1>
          <p className="text-textMuted text-sm">Tu progreso {periodo === "mes" ? "de este mes" : "histórico"}.</p>
        </div>
        <div className="flex bg-surfaceHighlight p-1 rounded-lg border border-borderBase">
          {(["mes", "global"] as const).map((id) => (
            <button
              key={id}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${periodo === id ? "bg-surface text-primary shadow-sm" : "text-textMuted hover:text-textMain"}`}
              onClick={() => setPeriodo(id)}
            >
              {id === "mes" ? "ESTE MES" : "HISTÓRICO"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 glass-panel p-8 flex flex-col items-center justify-center border-none bg-primary/5 rounded-2xl">
          <span className="text-6xl font-black text-primary mb-1 tracking-tighter">{totalDias}</span>
          <span className="text-[10px] font-black text-textMuted uppercase tracking-[0.2em] text-center">Días Totales</span>
        </div>

        <div className="md:col-span-2 glass-panel p-6 flex flex-col md:flex-row items-center gap-10 border-none bg-surfaceHighlight/30 rounded-2xl">
          <div className="w-36 h-36 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataPie}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECONDARY_COLORS[index % SECONDARY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-premium)', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <TrendingUp size={20} className="text-textMuted opacity-20" />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4 w-full">
            {stats.filter(s => s.valor > 0).slice(0, 4).map((s, idx) => (
              <div key={s.nombre} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SECONDARY_COLORS[idx % SECONDARY_COLORS.length] }} />
                  <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider">{s.nombre}</span>
                </div>
                <p className="text-xl font-black text-textMain pl-3.5">{s.valor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Simplified Ranking */}
        <div className="space-y-8">
          <h2 className="text-[10px] font-black text-textMuted uppercase tracking-[0.3em] flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> Ranking Miembros
          </h2>
          <div className="space-y-3">
            {ranking.slice(0, 8).map((usr, idx) => (
              <div key={usr.nombre} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${idx === 0 ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-surfaceHighlight/50"}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border transition-all ${idx === 0 ? "bg-primary text-white border-transparent" : "bg-surfaceHighlight border-borderBase text-textMain"}`}>
                      {usr.nombre.charAt(0).toUpperCase()}
                    </div>
                    {idx === 0 && (
                      <div className="absolute -top-2 -right-1 text-yellow-500 animate-bounce">
                        <Crown size={14} fill="currentColor" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-bold ${idx === 0 ? "text-textMain" : "text-textMuted"}`}>{usr.nombre}</span>
                    {idx === 0 && <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">Líder Actual</p>}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-lg font-black ${idx === 0 ? "text-primary" : "text-textMain"}`}>{usr.dias}</span>
                  <span className="text-[9px] font-bold text-textMuted uppercase tracking-tighter">Días</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simplified Medals */}
        <div className="space-y-8">
          <h2 className="text-[10px] font-black text-textMuted uppercase tracking-[0.3em] flex items-center gap-2">
            <Award size={14} className="text-primary" /> Logros Obtenidos
          </h2>
          {medallas.length === 0 ? (
            <div className="h-40 border border-dashed border-borderBase rounded-3xl flex items-center justify-center">
              <p className="text-[10px] text-textMuted font-bold uppercase tracking-widest">Sin medallas aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {medallas.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surfaceHighlight/30 border border-borderBase/40 group">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{m.icono}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-textMain truncate tracking-tight">{m.nombre}</p>
                    <p className="text-[8px] text-textMuted uppercase font-black tracking-tighter opacity-70">{m.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
