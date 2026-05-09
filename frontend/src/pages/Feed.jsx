import { useEffect, useState } from "react";
import { cargarFeedGlobal, toggleLike } from "../services/asistenciasService";
import { cargarMapaCategorias } from "../services/categoriasService";
import { Flame, Clock, Dumbbell, MessageSquare } from "lucide-react";

export default function Feed({ grupoId, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapaCat, setMapaCat] = useState({});

  useEffect(() => {
    if (grupoId) {
      cargarMuro();
      cargarNombres();
    }
  }, [grupoId]);

  const cargarNombres = async () => {
    const mapa = await cargarMapaCategorias();
    setMapaCat(mapa);
  };

  const cargarMuro = async () => {
    setLoading(true);
    try {
      const data = await cargarFeedGlobal(grupoId);
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    const isLiked = post.likes?.includes(user.uid);

    // Optimistic update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: isLiked ? (p.likes || []).filter(id => id !== user.uid) : [...(p.likes || []), user.uid]
        };
      }
      return p;
    }));

    try {
      await toggleLike(postId, user.uid, isLiked);
    } catch (e) {
      console.error("Error al dar like", e);
      cargarMuro();
    }
  };

  const formatTiempo = (timestamp) => {
    if (!timestamp) return "Hace tiempo";
    const min = Math.floor((Date.now() - timestamp) / 60000);
    if (min < 60) return `Hace ${min}m`;
    const hs = Math.floor(min / 60);
    if (hs < 24) return `Hace ${hs}hs`;
    return `Hace ${Math.floor(hs / 24)}d`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-24">
      <div className="glass-panel p-6 border-b-4 border-b-primary bg-surface/60">
        <h2 className="text-2xl font-black text-textMain flex items-center gap-2 tracking-tight">
          COMUNIDAD <span className="text-primary font-black">GYM</span>
        </h2>
        <p className="text-textMuted text-[10px] font-bold uppercase tracking-widest mt-1">Actividad del Grupo</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
          <p className="text-textMuted text-sm font-medium animate-pulse">Cargando...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-textMuted py-10 font-medium">No hay actividad reciente.</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const hasLiked = post.likes?.includes(user.uid);
            const likesCount = post.likes?.length || 0;

            return (
              <div key={post.id} className="glass-panel border-none shadow-2xl overflow-hidden animate-slide-up bg-surface/40">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-orange-600 p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-full bg-surface flex items-center justify-center font-black text-textMain border-2 border-surface text-base">
                        {post.userName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-textMain text-base leading-none">{post.userName}</p>
                      <p className="text-[11px] text-textMuted mt-1 flex items-center gap-1 font-bold">
                        <Clock size={12} /> {formatTiempo(post.timestamp)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                    {mapaCat[post.categoriaId]?.nombre || "Entrenamiento"}
                  </span>
                </div>

                {/* Foto */}
                {post.imagenUrl ? (
                  <div className="w-full bg-black aspect-square flex items-center justify-center overflow-hidden border-y border-borderBase/10">
                    <img src={post.imagenUrl} alt="Entrenamiento" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-b from-surfaceHighlight/20 to-transparent flex items-center justify-center text-textMuted italic text-xs font-medium border-y border-borderBase/5">
                    Registro de entrenamiento sin foto
                  </div>
                )}

                {/* Contenido */}
                <div className="p-5 space-y-5">
                  {/* Rutina */}
                  {post.rutina && post.rutina.length > 0 && (
                    <div className="bg-surfaceHighlight/30 rounded-2xl p-4 border border-borderBase/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Dumbbell size={16} className="text-primary" />
                        <span className="text-[11px] font-black uppercase text-textMuted tracking-widest">Rutina del Día</span>
                      </div>
                      <div className="space-y-3">
                        {post.rutina.map((ej, i) => (
                          <div key={i} className="flex justify-between items-center text-sm border-b border-borderBase/5 pb-2 last:border-0 last:pb-0">
                            <span className="font-bold text-textMain">{ej.nombre}</span>
                            <span className="text-primary font-black bg-primary/5 px-2 py-1 rounded text-xs">
                              {ej.series}x{ej.reps} <span className="text-textMuted font-normal">@</span> {ej.peso}kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {post.notas && (
                    <div className="flex gap-3 items-start bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                      <MessageSquare size={18} className="text-blue-500 mt-1 shrink-0" />
                      <p className="text-sm text-textMain italic leading-relaxed font-medium">"{post.notas}"</p>
                    </div>
                  )}

                  {/* Like Simple */}
                  <div className="pt-2">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-black text-sm tracking-wide ${hasLiked ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/40' : 'bg-surfaceHighlight text-textMain hover:bg-borderBase'}`}
                    >
                      <Flame size={20} className={hasLiked ? 'fill-white' : ''} />
                      {likesCount > 0 ? `${likesCount} Motivados` : "Motivar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
