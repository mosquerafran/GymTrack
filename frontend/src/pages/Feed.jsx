import { useEffect, useState } from "react";
import { cargarFeedGlobal, toggleLike } from "../services/asistenciasService";
import { Flame, Clock, Dumbbell, MessageSquare } from "lucide-react";

export default function Feed({ grupoId, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (grupoId) cargarMuro();
  }, [grupoId]);

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

  const handleLike = async (postId, likesArray) => {
    const isLiked = likesArray.includes(user.uid);
    // Optimistic update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: isLiked ? p.likes.filter(id => id !== user.uid) : [...p.likes, user.uid]
        };
      }
      return p;
    }));

    try {
      await toggleLike(postId, user.uid, isLiked);
    } catch (e) {
      console.error("Error al dar like", e);
      cargarMuro(); // Revert on error
    }
  };

  const formatTiempo = (timestamp) => {
    if (!timestamp) return "Hace un tiempo";
    const min = Math.floor((Date.now() - timestamp) / 60000);
    if (min < 60) return `Hace ${min} min`;
    const hs = Math.floor(min / 60);
    if (hs < 24) return `Hace ${hs} hs`;
    return `Hace ${Math.floor(hs / 24)} días`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="glass-panel p-6 border-t-4 border-t-orange-500">
        <h2 className="text-2xl font-bold text-textMain flex items-center gap-2">
          <Flame className="text-orange-500" size={28} /> Muro de Actividad
        </h2>
        <p className="text-textMuted text-sm mt-1">Mira quién está transpirando la camiseta.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-textMuted py-10">No hay actividad reciente. ¡Sé el primero!</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const hasLiked = post.likes?.includes(user.uid);
            const likesCount = post.likes?.length || 0;

            return (
              <div key={post.id} className="glass-panel overflow-hidden animate-slide-up border border-borderBase">
                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-borderBase/50 bg-surfaceHighlight/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {post.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-textMain">{post.userName}</p>
                      <p className="text-xs text-textMuted flex items-center gap-1">
                        <Clock size={12} /> {formatTiempo(post.timestamp)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-surfaceHighlight text-textMain border border-borderBase">
                    {post.categoriaId} {/* Idealmente acá diría el nombre de la cat, pero usamos el ID por simpleza visual */}
                  </span>
                </div>

                {/* Foto */}
                {post.imagenUrl && (
                  <div className="w-full bg-black aspect-square max-h-[500px] flex items-center justify-center overflow-hidden">
                    <img src={post.imagenUrl} alt="Entrenamiento" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Contenido (Rutina y Notas) */}
                <div className="p-4 space-y-3">
                  {post.rutina && post.rutina.length > 0 && (
                    <div className="bg-surfaceHighlight/30 rounded-xl p-3 border border-borderBase">
                      <h4 className="text-sm font-bold text-textMain mb-2 flex items-center gap-1">
                        <Dumbbell size={14} className="text-primary" /> Rutina:
                      </h4>
                      <ul className="space-y-1">
                        {post.rutina.map((ej, i) => (
                          <li key={i} className="text-sm flex justify-between">
                            <span className="text-textMuted">{ej.nombre}</span>
                            <span className="font-medium text-textMain">{ej.series}x{ej.reps} @ {ej.peso}kg</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {post.notas && (
                    <div className="flex gap-2 items-start">
                      <MessageSquare size={16} className="text-textMuted mt-1 shrink-0" />
                      <p className="text-sm text-textMain">{post.notas}</p>
                    </div>
                  )}
                </div>

                {/* Footer (Likes) */}
                <div className="p-4 pt-0">
                  <button 
                    onClick={() => handleLike(post.id, post.likes || [])}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-bold ${hasLiked ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50' : 'bg-surfaceHighlight text-textMuted hover:bg-surfaceHighlight/80'}`}
                  >
                    <Flame size={18} className={hasLiked ? 'fill-orange-500' : ''} />
                    {likesCount} {likesCount === 1 ? 'Fuego' : 'Fuegos'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
