import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Activity, Dumbbell, Calendar, MessageSquare } from "lucide-react";

export default function Feed({ user, grupoId }) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarFeed();
  }, []);

  const cargarFeed = async () => {
    setLoading(true);
    try {
      // Get categories
      const catSnap = await getDocs(collection(db, "categorias"));
      const mapCat = {};
      catSnap.forEach(d => { mapCat[d.id] = d.data().nombre; });

      // Get last 14 days
      const hoy = new Date();
      const hace14 = new Date();
      hace14.setDate(hoy.getDate() - 14);

      const q = query(
        collection(db, "asistencias"),
        where("fecha", ">=", hace14.toISOString().split("T")[0])
      );

      const snap = await getDocs(q);
      const items = [];
      
      snap.forEach(doc => {
        const d = doc.data();
        // Filtrar por grupo
        if (grupoId && d.grupoId && d.grupoId !== grupoId) return;
        items.push({
          id: doc.id,
          userName: d.userName || "Desconocido",
          fecha: d.fecha,
          catId: d.categoriaId,
          nombreCat: mapCat[d.categoriaId] || "Sin categoría",
          notas: d.notas || ""
        });
      });

      // Sort by fecha descending
      items.sort((a, b) => b.fecha.localeCompare(a.fecha));

      setFeed(items);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-6 border-b-4 border-b-primary">
        <h2 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <Activity className="text-primary" /> Muro de Actividad
        </h2>
        <p className="text-textMuted mt-2 text-sm">Mirá lo que estuvieron entrenando los demás últimamente.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : feed.length === 0 ? (
        <div className="glass-panel p-10 text-center text-textMuted flex flex-col items-center justify-center gap-4">
          <span className="text-4xl opacity-50">🪦</span>
          <p>Nadie entrenó últimamente...</p>
          <p className="italic text-sm">Están todos perdiendo masa muscular o internados en terapia intensiva.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map((item, i) => (
            <div key={item.id} className="glass-panel p-5 animate-slide-up" style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-textMain font-bold text-xl shrink-0 shadow-inner">
                  {item.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-textMain text-lg">{item.userName}</span>
                    <span className="text-xs text-textMuted flex items-center gap-1 bg-surfaceHighlight px-2 py-1 rounded-md">
                      <Calendar size={12} /> {item.fecha}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-primary font-medium mt-1">
                    <Dumbbell size={16} className="text-accent" /> Entrenó: {item.nombreCat}
                  </div>
                  {item.notas && (
                    <div className="mt-3 text-sm text-textMuted bg-surfaceHighlight/50 p-3 rounded-lg border border-borderBase flex items-start gap-2 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/50 group-hover:bg-accent transition-colors"></div>
                      <MessageSquare size={14} className="mt-0.5 shrink-0" />
                      <span className="italic">"{item.notas}"</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
