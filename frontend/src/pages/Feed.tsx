import React, { lazy, Suspense, useEffect, useState } from "react";
import { cargarFeedGlobal } from "../services/asistenciasService";
import { cargarMapaCategorias } from "../services/categoriasService";
import { Dumbbell, MessageSquare, Calendar, Flame } from "lucide-react";
import { Cargando, EstadoVacio, ErrorCarga } from "../components/ui/Estados";
import IconoTipo from "../components/IconoTipo";
import { Asistencia, Categoria } from "../types";
import { SEXO_DEFAULT } from "../config/entrenos";
import { descripcionDe, etiquetaDe, musculosDe, tipoDe, NombresCategoria } from "../utils/entrenos";

// Cuerpito del entreno sobre la foto: trae los paths del cuerpo, se carga aparte.
const MiniCuerpo = lazy(() => import("../components/cuerpo/MiniCuerpo"));

interface FeedProps {
  grupoId: string;
  /** Aumenta cuando se guarda o borra un entreno, para recargar. */
  refresco?: number;
}

export default function Feed({ grupoId, refresco = 0 }: FeedProps): React.ReactElement {
  const [posts, setPosts] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState(false);
  const [mapaCat, setMapaCat] = useState<Record<string, Categoria>>({});
  const nombres: NombresCategoria = Object.fromEntries(Object.entries(mapaCat).map(([id, c]) => [id, c.nombre]));

  useEffect(() => {
    if (grupoId) {
      cargarMuro();
      cargarNombres();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoId, refresco]);

  const cargarNombres = async () => {
    try {
      setMapaCat(await cargarMapaCategorias());
    } catch (e) {
      console.error(e); // sin nombres el muro igual se ve (sin etiquetas viejas)
    }
  };

  const cargarMuro = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await cargarFeedGlobal(grupoId);
      setPosts(data as Asistencia[]);
    } catch (e) {
      console.error(e);
      setError(true); // un error no es "no hay registros"
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
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <div>
        <p className="eyebrow">Lo que entrenó el grupo</p>
        <h1 className="font-display text-4xl uppercase leading-none mt-1">Muro</h1>
      </div>

      {loading ? (
        <Cargando texto="Cargando el muro…" />
      ) : error ? (
        <ErrorCarga texto="No se pudo cargar el muro" onReintentar={cargarMuro} />
      ) : posts.length === 0 ? (
        <EstadoVacio icono={Flame} titulo="Todavía no hay entrenos" texto="Cuando alguien del grupo registre uno, aparece acá." />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            return (
              <div key={post.id || post.docId} className="glass-panel border-none shadow-2xl overflow-hidden animate-slide-up bg-surface/40">
                {/* Header: Usuario, Fecha y Cat */}
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-12 hex bg-textMain text-background grid place-items-center font-display text-lg shrink-0" aria-hidden="true">
                      {post.userName?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-textMain text-base leading-none truncate">{post.userName}</p>
                      <p className="text-xs text-textMuted mt-1.5 flex items-center gap-1 font-bold">
                        <Calendar size={10} /> {formatTiempo(post.timestamp, post.fecha)}
                      </p>
                    </div>
                  </div>
                  {etiquetaDe(post, nombres) && (
                    <span className="font-mono text-xs font-bold px-2.5 py-1.5 border-2 border-textMain uppercase tracking-wide max-w-[45%] truncate shrink-0">
                      {etiquetaDe(post, nombres)}
                    </span>
                  )}
                </div>

                {/* Foto */}
                {post.imagenUrl ? (
                  <div className="relative w-full bg-black aspect-square flex items-center justify-center overflow-hidden border-y border-borderBase/10">
                    <img
                      src={post.imagenUrl}
                      alt={`Foto del entreno de ${post.userName}`}
                      loading="lazy"
                      decoding="async"
                      width={1024}
                      height={1024}
                      className="w-full h-full object-cover"
                    />
                    {musculosDe(post, nombres).length > 0 && (
                      <Suspense fallback={null}>
                        <MiniCuerpo
                          sexo={post.sexo || SEXO_DEFAULT}
                          musculos={musculosDe(post, nombres)}
                          className="absolute right-2.5 bottom-2.5 bg-surface rounded-xl px-1.5 pt-1.5 pb-1 shadow-premium"
                        />
                      </Suspense>
                    )}
                  </div>
                ) : null}

                {/* Contenido Detallado */}
                <div className="p-5 space-y-4">
                  <p className="flex items-center gap-2 font-heading text-base tracking-wide text-textMain">
                    <IconoTipo tipo={tipoDe(post, nombres)} size={18} className="shrink-0 text-textMuted" />
                    {descripcionDe(post, nombres)}
                  </p>
                  {/* Notas / Mensaje Primero */}
                  {post.notas && (
                    <div className="flex gap-3 items-start bg-primary/5 p-4 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                      <MessageSquare size={18} className="text-accent mt-1 shrink-0" />
                      <p className="text-sm text-textMain italic leading-relaxed font-medium">"{post.notas}"</p>
                    </div>
                  )}

                  {/* Rutina / PRs después */}
                  {post.rutina && post.rutina.length > 0 && (
                    <div className="bg-surfaceHighlight/20 rounded-2xl p-4 border border-borderBase/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Dumbbell size={14} className="text-textMuted" />
                        <span className="text-xs font-black uppercase text-textMuted tracking-widest">PRs LOGRADOS</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {post.rutina.map((ej: any, i) => (
                          <div key={i} className="flex items-center gap-2 bg-surface p-2 rounded-xl border border-borderBase/40 text-xs shadow-sm">
                            <span className="font-bold text-textMain">{ej.nombre}</span>
                            <span className="font-black bg-surfaceHighlight px-1.5 py-0.5">
                              {ej.peso ? `${ej.peso}kg` : ""} {ej.reps ? `x ${ej.reps}` : ""}
                              {ej.series && !ej.peso && !ej.reps ? `${ej.series.length} series` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
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
