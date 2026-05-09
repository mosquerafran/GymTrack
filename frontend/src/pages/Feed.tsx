import React, { useEffect, useState } from "react";
import { cargarFeedGlobal } from "../services/asistenciasService";
import { cargarMapaCategorias } from "../services/categoriasService";
import { Clock, Dumbbell, MessageSquare, Calendar } from "lucide-react";
import { Asistencia, Categoria } from "../types";

interface FeedProps {
  grupoId: string;
}

export default function Feed({ grupoId }: FeedProps): React.ReactElement {
  const [posts, setPosts] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapaCat, setMapaCat] = useState<Record<string, Categoria>>({});

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
      setPosts(data as Asistencia[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const formatTiempo = (timestamp: number | undefined, fechaStr: string) => {
    // Si no hay timestamp, usamos la fecha guardada como string
    if (!timestamp) return fechaStr ? fechaStr.split('-').reverse().join('/') : "Sin fecha";
    
    const fecha = new Date(timestamp);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, '0');
    const min = String(fecha.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes}/${anio} - ${hora}:${min}`;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in pb-24">
      <div className="glass-panel p-6 border-b-4 border-b-primary bg-surface/60">
        <h2 className="text-2xl font-black text-textMain flex items-center gap-2 tracking-tight">
          COMUNIDAD <span className="text-primary font-black">GYM</span>
        </h2>
        <p className="text-textMuted text-[10px] font-bold uppercase tracking-widest mt-1">Registros de Actividad</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
          <p className="text-textMuted text-sm font-medium animate-pulse">Cargando registros...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-textMuted py-10 font-medium">No hay registros recientes.</div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            return (
              <div key={post.id || post.docId} className="glass-panel border-none shadow-2xl overflow-hidden animate-slide-up bg-surface/40">
                {/* Header: Usuario, Fecha y Cat */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/50 to-orange-600/50 p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-full bg-surface flex items-center justify-center font-black text-textMain border-2 border-surface text-base">
                        {post.userName?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-textMain text-base leading-none">{post.userName}</p>
                      <p className="text-[11px] text-textMuted mt-1.5 flex items-center gap-1 font-bold">
                        <Calendar size={10} /> {formatTiempo(post.timestamp, post.fecha)}
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
                    Registro sin foto de evidencia
                  </div>
                )}

                {/* Contenido Detallado */}
                <div className="p-5 space-y-5">
                  {/* Rutina */}
                  {post.rutina && post.rutina.length > 0 && (
                    <div className="bg-surfaceHighlight/30 rounded-2xl p-4 border border-borderBase/30 shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <Dumbbell size={16} className="text-primary" />
                        <span className="text-[11px] font-black uppercase text-textMuted tracking-widest">Detalle del Entrenamiento</span>
                      </div>
                      <div className="space-y-3">
                        {post.rutina.map((ej: any, i) => (
                          <div key={i} className="flex justify-between items-center text-sm border-b border-borderBase/5 pb-2 last:border-0 last:pb-0">
                            <span className="font-bold text-textMain">{ej.nombre}</span>
                            <span className="text-primary font-black bg-primary/5 px-2 py-1 rounded text-xs">
                              {/* Soporte para formato nuevo y legacy */}
                              {ej.series && Array.isArray(ej.series) 
                                ? `${ej.series.length} series` 
                                : `${ej.series || 0}x${ej.reps || 0} @ ${ej.peso || 0}kg`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {post.notas && (
                    <div className="flex gap-3 items-start bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 shadow-sm">
                      <MessageSquare size={18} className="text-blue-500 mt-1 shrink-0" />
                      <p className="text-sm text-textMain italic leading-relaxed font-medium">"{post.notas}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
