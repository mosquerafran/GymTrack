import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { BarChart, Users, Award, Calendar } from "lucide-react";

export default function Stats({ user, grupoId }) {
  const [stats, setStats] = useState([]);
  const [totalDias, setTotalDias] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [periodo, setPeriodo] = useState('mes'); // 'mes' o 'global'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      cargarDatos(periodo);
    }
  }, [user, periodo]);

  const cargarDatos = async (tipoPeriodo) => {
    setLoading(true);
    try {
      // Para el ranking necesitamos TODOS los mapas de categorías de todos los usuarios
      const qCat = collection(db, "categorias");
      const snapCat = await getDocs(qCat);
      const allCategorias = snapCat.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const mapaCategorias = {};
      allCategorias.forEach(c => (mapaCategorias[c.id] = c));

      // Para MI gráfica, solo las mías
      const misCategorias = allCategorias.filter(c => c.userId === user.uid);

      let qMisAsis = query(collection(db, "asistencias"), where("userId", "==", user.uid));
      let qGlobalAsis = collection(db, "asistencias");

      const [snapMisAsis, snapGlobalAsis] = await Promise.all([
        getDocs(qMisAsis),
        getDocs(qGlobalAsis)
      ]);

      let misAsisDocs = snapMisAsis.docs;
      let globalAsisDocs = snapGlobalAsis.docs;

      if (tipoPeriodo === 'mes') {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
        
        misAsisDocs = misAsisDocs.filter(doc => doc.data().fecha >= inicioMes);
        globalAsisDocs = globalAsisDocs.filter(doc => doc.data().fecha >= inicioMes);
      }

      // Filtrar por grupo
      if (grupoId) {
        misAsisDocs = misAsisDocs.filter(doc => !doc.data().grupoId || doc.data().grupoId === grupoId);
        globalAsisDocs = globalAsisDocs.filter(doc => !doc.data().grupoId || doc.data().grupoId === grupoId);
      }

      const conteo = {};
      misCategorias.forEach(c => (conteo[c.id] = 0));
      const diasQueCuentan = new Set();

      misAsisDocs.forEach(doc => {
        const data = doc.data();
        const cat = mapaCategorias[data.categoriaId];
        if (!cat) return;
        if (conteo[cat.id] !== undefined) conteo[cat.id]++;
        if (cat.cuenta) diasQueCuentan.add(data.fecha);
      });

      setStats(misCategorias.map(c => ({ nombre: c.nombre, valor: conteo[c.id] })));
      setTotalDias(diasQueCuentan.size);

      const usuarios = {};
      globalAsisDocs.forEach(doc => {
        const data = doc.data();
        const usr = data.userName || "Desconocido";
        const cat = mapaCategorias[data.categoriaId];
        if (!cat) return;

        if (!usuarios[usr]) {
          usuarios[usr] = { nombre: usr, dias: new Set(), categorias: {} };
        }
        if (!usuarios[usr].categorias[cat.nombre]) usuarios[usr].categorias[cat.nombre] = 0;
        
        usuarios[usr].categorias[cat.nombre]++;
        if (cat.cuenta) usuarios[usr].dias.add(data.fecha);
      });

      setRanking(Object.values(usuarios).map(u => ({
        nombre: u.nombre,
        dias: u.dias.size,
        categorias: u.categorias
      })).sort((a, b) => b.dias - a.dias));
      
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-center md:justify-end mb-4">
        <div className="flex bg-surfaceHighlight p-1 rounded-xl shadow-inner border border-borderBase">
          <button 
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${periodo === 'mes' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-textMain'}`}
            onClick={() => setPeriodo('mes')}
          >
            Este Mes
          </button>
          <button 
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${periodo === 'global' ? 'bg-primary text-white shadow-md' : 'text-textMuted hover:text-textMain'}`}
            onClick={() => setPeriodo('global')}
          >
            Histórico
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8">
        <h2 className="text-2xl font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderBase pb-4">
          <BarChart className="text-primary" /> Tus estadísticas 💪
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center shadow-inner">
            <div className="text-4xl font-black text-primary mb-1">{totalDias}</div>
            <div className="text-textMuted text-sm font-medium uppercase tracking-wider">Días Entrenados</div>
          </div>

          {stats.map(s => (
            <div className="bg-surfaceHighlight/50 border border-borderBase rounded-xl p-4 text-center transition-all hover:bg-surfaceHighlight" key={s.nombre}>
              <div className="text-3xl font-bold text-textMain mb-1">{s.valor}</div>
              <div className="text-textMuted text-sm font-medium uppercase tracking-wider truncate">{s.nombre}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 md:p-8">
        <h2 className="text-2xl font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderBase pb-4">
          <Users className="text-accent" /> Ranking {periodo === 'mes' ? 'del Mes' : 'Global'}
        </h2>
        
        {ranking.length === 0 ? (
          <div className="text-center py-10 text-textMuted font-medium">Nadie entrenó todavía.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ranking.map((usr, idx) => (
              <div className="bg-surfaceHighlight/30 rounded-xl p-5 border border-borderBase relative overflow-hidden group hover:border-accent/30 transition-all" key={usr.nombre}>
                {idx === 0 && <div className="absolute top-0 right-0 bg-accent text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl z-10 flex items-center gap-1 shadow-sm"><Award size={14}/> Top 1</div>}
                
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