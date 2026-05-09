import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import Calendar from "react-calendar";
import Swal from "sweetalert2";
import { cargarAsistenciasMes, eliminarAsistencia, AsistenciasMapa } from "../services/asistenciasService";
import { cargarMapaCategorias } from "../services/categoriasService";
import { Search, Calendar as CalendarIcon, X, Edit2, MessageSquare, Dumbbell } from "lucide-react";
import { Categoria, Asistencia } from "../types";
import TrainingSelector from "../components/TrainingSelector";

const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

interface DiaDetalleProps {
  user: User;
  fecha: Date;
  grupoId: string;
  theme: "dark" | "light";
}

export default function DiaDetalle({ user, fecha: fechaProp, grupoId, theme }: DiaDetalleProps): React.ReactElement {
  const [fecha, setFecha] = useState<Date>(fechaProp || new Date());
  const [entrenos, setEntrenos] = useState<AsistenciasMapa>({});
  const [categoriasMap, setCategoriasMap] = useState<Record<string, Categoria>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [editando, setEditando] = useState<Asistencia | null>(null);

  useEffect(() => {
    cargar();
  }, [grupoId]);

  const cargar = async () => {
    setLoading(true);
    const [mapa, asistencias] = await Promise.all([
      cargarMapaCategorias(),
      cargarAsistenciasMes(grupoId, fecha),
    ]);
    setCategoriasMap(mapa);
    setEntrenos(asistencias);
    setLoading(false);
  };

  const mostrarEntrenos = (tiene: any) => {
    let texto = "Nadie entrenó ese día";
    if (tiene) {
      texto = Object.entries(tiene as Record<string, any[]>)
        .map(([usr, items]) => {
          const cats = items
            .map((item) => {
              const catName = (categoriasMap[item.catId] as Categoria)?.nombre || "…";
              return item.notas ? `${catName} (${item.notas})` : catName;
            })
            .join(", ");
          return `${usr}: ${cats}`;
        })
        .join("\n");
    }
    Swal.fire({
      title: tiene ? "Día de Entrenamiento 💪" : "Descanso General 😴",
      text: texto,
      icon: tiene ? "success" : "info",
      confirmButtonText: "OK",
      background: "var(--color-surface)",
      color: "var(--color-text-main)",
    });
  };

  const handleEliminar = async (docId: string, nombreCategoria: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar?",
      text: `Borraras tu entrenamiento de ${nombreCategoria}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Sí, eliminar",
      background: "var(--color-surface)",
      color: "var(--color-text-main)",
    });

    if (result.isConfirmed) {
      try {
        await eliminarAsistencia(docId);
        cargar();
        Swal.fire({ title: "Eliminado!", icon: "success", timer: 1000, showConfirmButton: false });
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar.", "error");
      }
    }
  };

  const key = formatDate(fecha);
  const usuariosDia = entrenos[key] || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in relative">
      {/* Modal de Edición */}
      {editando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
            <TrainingSelector 
              fecha={fecha} 
              user={user} 
              grupoId={grupoId} 
              theme={theme}
              asistenciaAEditar={editando}
              onCancelar={() => setEditando(null)}
              onCompletado={() => {
                setEditando(null);
                cargar();
              }}
            />
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="glass-panel p-6 h-fit">
        <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
          <Search className="text-primary" size={18} /> Explorar Calendario
        </h2>
        <div className="custom-calendar-container">
          <Calendar
            onChange={(val) => setFecha(val as Date)}
            value={fecha}
            onActiveStartDateChange={async ({ activeStartDate }) => {
              if (activeStartDate) {
                const asistencias = await cargarAsistenciasMes(grupoId, activeStartDate);
                setEntrenos(asistencias);
              }
            }}
            tileContent={({ date, view }) => {
              if (view !== "month") return null;
              const key = formatDate(date);
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              const esPasado = date < hoy;
              const tiene = entrenos[key];
              let colorClass = "";
              if (tiene && Object.keys(tiene).length > 0) colorClass = "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.6)]";
              else if (esPasado) colorClass = "bg-red-500/20";
              else return null;
              return (
                <div className="flex justify-center mt-1">
                  <div
                    className={`w-1.5 h-1.5 rounded-full cursor-pointer ${colorClass}`}
                    onClick={(e) => { e.stopPropagation(); mostrarEntrenos(tiene); }}
                  />
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Detalle del día */}
      <div className="glass-panel p-6 min-h-[400px]">
        <h2 className="text-xl font-black text-textMain mb-8 flex items-center gap-3 border-b border-borderBase pb-6">
          <CalendarIcon className="text-accent" />
          {fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
          </div>
        ) : Object.keys(usuariosDia).length === 0 ? (
          <div className="flex flex-col items-center justify-center text-textMuted py-20 space-y-4">
            <div className="w-16 h-16 rounded-full bg-surfaceHighlight flex items-center justify-center text-3xl">😴</div>
            <p className="font-bold text-lg uppercase tracking-widest text-[10px]">Nadie entrenó hoy</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(usuariosDia).map(([userName, items]) => (
              <div key={userName} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/20">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-black text-textMain text-base tracking-tight">{userName}</span>
                  </div>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-borderBase/50">
                  {items.map((item: any) => {
                    const catName = categoriasMap[item.catId]?.nombre || "Entrenamiento";
                    const esMio = item.userId === user?.uid || item.userName === user?.displayName;

                    return (
                      <div key={item.docId} className="bg-surfaceHighlight/20 rounded-2xl p-4 border border-borderBase/30 relative group">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-wider">{catName}</span>
                          {esMio && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditando({ ...item, id: item.docId })} 
                                className="p-1.5 text-textMuted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleEliminar(item.docId, catName)} 
                                className="p-1.5 text-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Mensaje primero */}
                        {item.notas && (
                          <div className="flex gap-2 items-start mb-3">
                            <MessageSquare size={14} className="text-accent mt-0.5 shrink-0" />
                            <p className="text-sm text-textMain italic font-medium leading-relaxed">"{item.notas}"</p>
                          </div>
                        )}

                        {/* PRs después */}
                        {item.rutina && item.rutina.length > 0 && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-borderBase/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Dumbbell size={12} className="text-textMuted" />
                              <span className="text-[9px] font-black text-textMuted uppercase tracking-widest">PRs del Día</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {item.rutina.map((ej: any, i: number) => (
                                <div key={i} className="bg-surface px-2 py-1 rounded-lg border border-borderBase/50 text-[11px] font-bold text-textMain flex items-center gap-2 shadow-sm">
                                  <span>{ej.nombre}</span>
                                  <span className="text-primary font-black">
                                    {ej.peso ? `${ej.peso}kg` : ""} {ej.reps ? `x ${ej.reps}` : ""}
                                    {ej.series && !ej.peso && !ej.reps ? `${ej.series.length} series` : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
