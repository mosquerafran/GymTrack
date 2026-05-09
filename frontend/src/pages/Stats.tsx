import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { calcularStats, RankingUser, StatsData } from "../services/statsService";
import { calcularMedallas } from "../services/gamificationService";
import { BarChart as BarChartIcon, Award, TrendingUp, Zap } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis
} from "recharts";
import { StatItem, Medalla } from "../types";

const PRIMARY_COLOR = 'var(--color-primary)';
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

  const dataRanking = ranking.slice(0, 5).map(usr => ({
    name: usr.nombre.split(' ')[0],
    dias: usr.dias,
    fullName: usr.nombre
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-textMuted text-sm font-medium">Cargando estadísticas...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-24">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-borderBase pb-6">
        <div>
          <h1 className="text-3xl font-bold text-textMain tracking-tight">Estadísticas</h1>
          <p className="text-textMuted text-sm">Resumen de tu actividad y progreso.</p>
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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Days Count Card */}
        <div className="md:col-span-1 glass-panel p-8 flex flex-col items-center justify-center border-none bg-primary/5">
          <span className="text-5xl font-black text-primary mb-2">{totalDias}</span>
          <span className="text-xs font-bold text-textMuted uppercase tracking-widest text-center">Días de Entrenamiento</span>
        </div>

        {/* Charts Summary */}
        <div className="md:col-span-2 glass-panel p-6 flex flex-col md:flex-row items-center gap-8 border-none bg-surfaceHighlight/30">
          <div className="w-40 h-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataPie}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECONDARY_COLORS[index % SECONDARY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: '12px', boxShadow: 'var(--shadow-premium)', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            {stats.filter(s => s.valor > 0).slice(0, 4).map((s, idx) => (
              <div key={s.nombre} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SECONDARY_COLORS[idx % SECONDARY_COLORS.length] }} />
                  <span className="text-xs font-medium text-textMuted uppercase">{s.nombre}</span>
                </div>
                <p className="text-lg font-bold text-textMain pl-4">{s.valor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking & Medals Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Ranking List */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Top 5 Miembros
          </h2>
          <div className="space-y-4">
            {ranking.slice(0, 5).map((usr, idx) => (
              <div key={usr.nombre} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-textMuted w-4">{idx + 1}.</span>
                  <div className="w-10 h-10 rounded-full bg-surfaceHighlight border border-borderBase flex items-center justify-center text-xs font-bold text-textMain group-hover:border-primary transition-colors">
                    {usr.nombre.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-textMain">{usr.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-primary">{usr.dias}</span>
                  <span className="text-[10px] font-bold text-textMuted uppercase">Días</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medals Grid */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
            <Award size={16} className="text-primary" /> Medallas
          </h2>
          {medallas.length === 0 ? (
            <div className="p-8 border border-dashed border-borderBase rounded-2xl text-center">
              <p className="text-xs text-textMuted italic italic">Entrená para ganar medallas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {medallas.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-surfaceHighlight/20 border border-borderBase/50 group hover:bg-surfaceHighlight/40 transition-all">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{m.icono}</span>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-textMain truncate">{m.nombre}</p>
                    <p className="text-[9px] text-textMuted uppercase font-black tracking-tight">{m.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="space-y-6 pt-6">
        <h2 className="text-sm font-black text-textMuted uppercase tracking-widest flex items-center gap-2">
          <Zap size={16} className="text-primary" /> Comparativa de Actividad
        </h2>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataRanking} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 'bold' }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
              <Tooltip 
                cursor={{fill: 'var(--color-surface-highlight)', opacity: 0.4}}
                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar 
                dataKey="dias" 
                fill={PRIMARY_COLOR} 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
