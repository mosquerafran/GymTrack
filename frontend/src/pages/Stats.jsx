import { useEffect, useState } from "react";
import { calcularStats } from "../services/statsService";
import { BarChart, Users, Award, Calendar } from "lucide-react";

export default function Stats({ user, grupoId }) {
  const [stats, setStats] = useState([]);
  const [totalDias, setTotalDias] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [periodo, setPeriodo] = useState("mes"); // "mes" | "global"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) cargar(periodo);
  }, [user, periodo]);

  const cargar = async (tipoPeriodo) => {
    setLoading(true);
    try {
      const resultado = await calcularStats(user.uid, grupoId, tipoPeriodo);
      setStats(resultado.stats);
      setTotalDias(resultado.totalDias);
      setRanking(resultado.ranking);
    } catch (e) {
      console.error("Error cargando stats:", e);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-center md:justify-end mb-4">
        <div className="flex bg-surfaceHighlight p-1 rounded-xl shadow-inner border border-borderBase">
          {[
            { id: "mes", label: "Este Mes" },
            { id: "global", label: "Histórico" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${periodo === tab.id ? "bg-primary text-white shadow-md" : "text-textMuted hover:text-textMain"}`}
              onClick={() => setPeriodo(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mis estadísticas */}
      <div className="glass-panel p-6 md:p-8">
        <h2 className="text-2xl font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderBase pb-4">
          <BarChart className="text-primary" /> Tus estadísticas 💪
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center shadow-inner">
            <div className="text-4xl font-black text-primary mb-1">{totalDias}</div>
            <div className="text-textMuted text-sm font-medium uppercase tracking-wider">Días Entrenados</div>
          </div>
          {stats.map((s) => (
            <div className="bg-surfaceHighlight/50 border border-borderBase rounded-xl p-4 text-center transition-all hover:bg-surfaceHighlight" key={s.nombre}>
              <div className="text-3xl font-bold text-textMain mb-1">{s.valor}</div>
              <div className="text-textMuted text-sm font-medium uppercase tracking-wider truncate">{s.nombre}</div>
            </div>
          ))}
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
        )}
      </div>
    </div>
  );
}
