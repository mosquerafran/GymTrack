import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { calcularStats, RankingUser, StatsData } from "../services/statsService";
import { calcularMedallas } from "../services/gamificationService";
import { BarChart as BarChartIcon, Users, Award, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import { StatItem, Medalla } from "../types";

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e', '#eab308'];

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
      
      // Las medallas siempre las calculamos con el histórico global para no perderlas
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

  const dataRanking = ranking.map(usr => ({
    name: usr.nombre,
    dias: usr.dias
  }));

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-center md:justify-end mb-4">
        <div className="flex bg-surfaceHighlight p-1 rounded-xl shadow-inner border border-borderBase">
          {(["mes", "global"] as const).map((id) => (
            <button
              key={id}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${periodo === id ? "bg-primary text-white shadow-md" : "text-textMuted hover:text-textMain"}`}
              onClick={() => setPeriodo(id)}
            >
              {id === "mes" ? "Este Mes" : "Histórico"}
            </button>
          ))}
        </div>
      </div>

      {/* Perfil & Medallas */}
      <div className="glass-panel p-6 md:p-8">
        <h2 className="text-xl font-bold text-textMain mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" /> Tus Logros
        </h2>
        {medallas.length === 0 ? (
          <p className="text-textMuted text-sm">Entrená para desbloquear medallas.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {medallas.map(m => (
              <div key={m.id} title={m.descripcion} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${m.color} animate-scale-up cursor-help`}>
                <span className="text-2xl">{m.icono}</span>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none">{m.nombre}</span>
                  <span className="text-[10px] opacity-80">{m.descripcion}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mis estadísticas Visuales */}
      <div className="glass-panel p-6 md:p-8">
        <h2 className="text-2xl font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderBase pb-4">
          <BarChartIcon className="text-primary" /> Tus estadísticas 💪
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Números */}
          <div className="grid grid-cols-2 gap-4 h-fit">
            <div className="col-span-2 bg-primary/10 border border-primary/20 rounded-xl p-4 text-center shadow-inner">
              <div className="text-4xl font-black text-primary mb-1">{totalDias}</div>
              <div className="text-textMuted text-sm font-medium uppercase tracking-wider">Días Entrenados</div>
            </div>
            {stats.filter(s => s.valor > 0).map((s) => (
              <div className="bg-surfaceHighlight/50 border border-borderBase rounded-xl p-4 text-center transition-all hover:bg-surfaceHighlight" key={s.nombre}>
                <div className="text-3xl font-bold text-textMain mb-1">{s.valor}</div>
                <div className="text-textMuted text-xs font-medium uppercase tracking-wider truncate">{s.nombre}</div>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          {dataPie.length > 0 && (
            <div className="bg-surfaceHighlight/20 border border-borderBase rounded-xl p-4 flex flex-col items-center justify-center min-h-[300px]">
              <h3 className="text-sm font-bold text-textMuted mb-2">Distribución de Entrenamiento</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-text-main)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {dataPie.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1 text-xs text-textMuted">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ranking */}
      <div className="glass-panel p-6 md:p-8">
        <h2 className="text-2xl font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderBase pb-4">
          <Users className="text-accent" /> Ranking {periodo === "mes" ? "del Mes" : "Global"}
        </h2>
        {ranking.length === 0 ? (
          <div className="text-center py-10 text-textMuted font-medium">Nadie entrenó todavía.</div>
        ) : (
          <div className="space-y-8">
            {/* Gráfico de Ranking */}
            {dataRanking.length > 1 && (
              <div className="bg-surfaceHighlight/20 border border-borderBase rounded-xl p-4 min-h-[250px]">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dataRanking} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <Tooltip 
                      cursor={{fill: 'var(--color-surface-highlight)'}}
                      contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--color-text-main)' }}
                    />
                    <Bar dataKey="dias" fill="#f97316" radius={[4, 4, 0, 0]}>
                      {
                        dataRanking.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f97316'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ranking.map((usr, idx) => (
                <div className="bg-surfaceHighlight/30 rounded-xl p-5 border border-borderBase relative overflow-hidden group hover:border-accent/30 transition-all" key={usr.nombre}>
                  {idx === 0 && (
                    <div className="absolute top-0 right-0 bg-accent text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-sm">
                      <Award size={14} /> Top 1
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-textMain mb-4 pr-16 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-textMain text-sm shrink-0">
                      {usr.nombre.charAt(0).toUpperCase()}
                    </div>
                    {usr.nombre}
                  </h3>
                  <div className="flex items-center gap-2 text-primary font-medium mb-4 bg-primary/10 w-fit px-3 py-1 rounded-lg">
                    <Calendar size={16} /> {usr.dias} días totales
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-textMuted uppercase tracking-wider mb-2 border-b border-borderBase pb-1">Desglose</p>
                    {Object.entries(usr.categorias).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between items-center text-sm">
                        <span className="text-textMain">{cat}</span>
                        <span className="bg-surfaceHighlight text-textMain px-2 py-0.5 rounded text-xs font-bold border border-borderBase shadow-sm">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
