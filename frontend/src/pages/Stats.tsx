import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { calcularStats, RankingUser, StatsData } from "../services/statsService";
import { calcularMedallas } from "../services/gamificationService";
import { BarChart as BarChartIcon, Users, Award, Calendar, TrendingUp, Target, Zap } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  AreaChart, Area 
} from "recharts";
import { StatItem, Medalla } from "../types";

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e'  // Rose
];

const GRADIENTS = [
  { id: 'gradBlue', start: '#3b82f6', end: '#2563eb' },
  { id: 'gradEmerald', start: '#10b981', end: '#059669' },
  { id: 'gradAmber', start: '#f59e0b', end: '#d97706' },
  { id: 'gradViolet', start: '#8b5cf6', end: '#7c3aed' },
  { id: 'gradPink', start: '#ec4899', end: '#db2777' },
];

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
      
      // Las medallas siempre las calculamos con el histórico global
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

  const dataRanking = ranking.slice(0, 10).map(usr => ({
    name: usr.nombre.split(' ')[0],
    dias: usr.dias,
    fullName: usr.nombre
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary shadow-premium" />
      <p className="text-textMuted font-medium animate-pulse italic">Analizando tus ganancias...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-24 px-1">
      {/* Gradients definitions for SVG charts */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
          </linearGradient>
          {GRADIENTS.map(g => (
            <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={g.start} />
              <stop offset="100%" stopColor={g.end} />
            </linearGradient>
          ))}
        </defs>
      </svg>

      {/* Hero Stats Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-surface border border-borderBase p-8 md:p-10 shadow-premium group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full -ml-10 -mb-10 blur-3xl group-hover:bg-accent/10 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-4 border border-primary/20">
              <TrendingUp size={14} /> Performance Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-textMain mb-2 tracking-tight">
              Tu Progreso <span className="text-primary italic">Fitness</span>
            </h1>
            <p className="text-textMuted text-lg max-w-md">
              Visualizá tu consistencia y dominá tus objetivos. {periodo === "mes" ? "Este mes" : "Desde siempre"} venís con todo.
            </p>
          </div>

          <div className="flex bg-surfaceHighlight p-1.5 rounded-2xl shadow-inner border border-borderBase">
            {(["mes", "global"] as const).map((id) => (
              <button
                key={id}
                className={`px-6 py-3 text-sm font-black rounded-xl transition-all duration-300 ${periodo === id ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-textMuted hover:text-textMain"}`}
                onClick={() => setPeriodo(id)}
              >
                {id === "mes" ? "ESTE MES" : "HISTÓRICO"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Medallas Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-panel p-6 md:p-8 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-5xl mb-4 border border-primary/20 shadow-inner">
              🏆
            </div>
            <h2 className="text-3xl font-black text-textMain mb-1 leading-none">{totalDias}</h2>
            <p className="text-textMuted text-xs font-black uppercase tracking-widest">Días Entrenados</p>
            <div className="w-full h-1 bg-borderBase rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-primary animate-slide-left" style={{ width: `${Math.min((totalDias/30)*100, 100)}%` }} />
            </div>
            <p className="text-[10px] text-textMuted mt-2 font-bold italic">Meta sugerida: 20 días/mes</p>
          </div>

          <div className="glass-panel p-6 md:p-8">
            <h2 className="text-xl font-black text-textMain mb-6 flex items-center gap-2">
              <Award className="text-yellow-500" /> Logros Desbloqueados
            </h2>
            {medallas.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-textMuted text-sm italic italic">Todavía no tenés medallas. <br/> ¡Seguí metiéndole! 💪</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {medallas.map(m => (
                  <div key={m.id} title={m.descripcion} className={`flex items-center gap-3 p-3 rounded-2xl border ${m.color} bg-opacity-5 hover:scale-[1.02] transition-transform cursor-default group`}>
                    <span className="text-3xl group-hover:animate-bounce">{m.icono}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-textMain">{m.nombre}</span>
                      <span className="text-[10px] text-textMuted font-medium">{m.descripcion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pie Chart: Distribución */}
          <div className="glass-panel p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-textMain flex items-center gap-2">
                <Target className="text-primary" /> Foco del Entrenamiento
              </h2>
              <div className="p-2 bg-primary/10 rounded-xl text-primary"><TrendingUp size={20} /></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {dataPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', boxShadow: 'var(--shadow-premium)' }}
                      itemStyle={{ color: 'var(--color-text-main)', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-textMain">{dataPie.length}</span>
                  <span className="text-[10px] text-textMuted font-black uppercase tracking-widest">Tipos</span>
                </div>
              </div>

              <div className="space-y-3">
                {dataPie.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between p-3 rounded-xl bg-surfaceHighlight/30 border border-borderBase hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm font-bold text-textMain">{entry.name}</span>
                    </div>
                    <span className="text-sm font-black text-primary">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ranking Chart */}
          <div className="glass-panel p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-textMain flex items-center gap-2">
                <Zap className="text-accent" /> Competencia Grupal
              </h2>
              <div className="flex items-center gap-2 text-xs font-black text-textMuted uppercase tracking-widest">
                <Users size={16} /> Top 10 Miembros
              </div>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataRanking} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 'bold' }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'var(--color-surface-highlight)', radius: 12}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-surface border border-borderBase p-3 rounded-2xl shadow-premium">
                            <p className="text-xs font-black text-textMuted mb-1 uppercase tracking-wider">{payload[0].payload.fullName}</p>
                            <p className="text-lg font-black text-primary">{payload[0].value} Días 🔥</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="dias" 
                    radius={[10, 10, 10, 10]} 
                    barSize={32}
                  >
                    {dataRanking.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? 'var(--color-accent)' : 'var(--color-primary)'} 
                        fillOpacity={1 - (index * 0.08)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* User Cards Ranking */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-textMain flex items-center gap-2 px-2">
          <Award className="text-accent" /> Detalle de Miembros
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ranking.map((usr, idx) => (
            <div className="glass-panel p-6 relative overflow-hidden group hover:border-primary/40 transition-all duration-500" key={usr.nombre}>
              {idx === 0 && (
                <div className="absolute top-0 right-0 bg-accent text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-bl-2xl z-10 flex items-center gap-1 shadow-lg tracking-widest">
                  <Award size={14} /> EL REY/REINA
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl font-black text-textMain border border-borderBase shadow-inner group-hover:scale-110 transition-transform duration-500">
                  {usr.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-textMain tracking-tight group-hover:text-primary transition-colors">{usr.nombre}</h3>
                  <div className="flex items-center gap-1.5 text-primary font-black text-xs uppercase tracking-wider">
                    <Zap size={14} /> {usr.dias} Días entrenados
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-surfaceHighlight/20 p-4 rounded-2xl border border-borderBase/50">
                <p className="text-[10px] text-textMuted font-black uppercase tracking-[0.2em] mb-2">Desglose de Gains</p>
                {Object.entries(usr.categorias).map(([cat, val], cIdx) => (
                  <div key={cat} className="flex justify-between items-center text-sm">
                    <span className="text-textMuted font-bold">{cat}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-borderBase rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-primary/60" 
                          style={{ width: `${Math.min((val/usr.dias)*100, 100)}%` }} 
                        />
                      </div>
                      <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg text-xs font-black border border-primary/20">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
