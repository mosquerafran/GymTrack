import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import Swal from "sweetalert2";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";

export default function DiaDetalle({ user, fecha: fechaProp, grupoId }) {

  const [fecha, setFecha] = useState(fechaProp || new Date());
  const [entrenos, setEntrenos] = useState({});
  const [categoriasMap, setCategoriasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [detalleDia, setDetalleDia] = useState({});

  const formatDate = (date)=>{
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,"0");
    const d = String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d}`;
  };

  const mostrarEntrenos = (tiene)=>{
    let texto = "Nadie entrenó ese día";
    if (tiene) {
      texto = Object.entries(tiene).map(([usr, items]) => {
        const cats = items.map(item => {
          const catName = categoriasMap?.[item.catId] || "…";
          return item.notas ? `${catName} (${item.notas})` : catName;
        }).join(", ");
        return `${usr}: ${cats}`;
      }).join("\n");
    }

    Swal.fire({
      title: tiene ? "Día de Entrenamiento 💪" : "Descanso General 😴",
      text: texto,
      icon: tiene ? "success" : "info",
      confirmButtonText: "OK",
      background: 'var(--color-surface)',
      color: 'var(--color-text-main)'
    });
  };

  const cargarCategorias = async () => {
    try{
      const snap = await getDocs(collection(db,"categorias"));
      const mapa = {};
      snap.forEach(document=>{
        mapa[document.id] = document.data().nombre;
      });
      setCategoriasMap(mapa);
    }catch(err){
      console.error("❌ Error cargando categorías:", err);
    }
  };

  const cargarEntrenosMes = async (fechaActual) => {
    setLoading(true);

    const inicioMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth(),1);
    const finMes = new Date(fechaActual.getFullYear(),fechaActual.getMonth()+1,0);

    const inicioStr = inicioMes.toISOString().split("T")[0];
    const finStr = finMes.toISOString().split("T")[0];

    try{
      const q = query(
        collection(db,"asistencias"),
        where("fecha",">=",inicioStr),
        where("fecha","<=",finStr)
      );

      const snap = await getDocs(q);
      const mapa = {};

      snap.forEach(document=>{
        const data = document.data();
        // Filtrar por grupo
        if (grupoId && data.grupoId && data.grupoId !== grupoId) return;
        const fechaKey = data.fecha;
        const usr = data.userName || "Desconocido";

        if(!mapa[fechaKey]) mapa[fechaKey] = {};
        if(!mapa[fechaKey][usr]) mapa[fechaKey][usr] = [];
        
        mapa[fechaKey][usr].push({
          docId: document.id,
          catId: data.categoriaId,
          notas: data.notas || ""
        });
      });

      setEntrenos(mapa);

    }catch(err){
      console.error("❌ Error cargando entrenos del mes:",err);
    }

    setLoading(false);
  };

  const eliminarEntrenamiento = async (docId, nombreCategoria) => {
    const result = await Swal.fire({
      title: '¿Eliminar entrenamiento?',
      text: `Estás por borrar tu entrenamiento de ${nombreCategoria}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--color-surface)',
      color: 'var(--color-text-main)'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "asistencias", docId));
        Swal.fire({
          title: 'Eliminado!',
          text: 'El entrenamiento fue borrado.',
          icon: 'success',
          background: 'var(--color-surface)',
          color: 'var(--color-text-main)',
          timer: 1500,
          showConfirmButton: false
        });
        cargarEntrenosMes(fecha); // Recargar el mes para refrescar la UI
      } catch (error) {
        console.error("Error al eliminar documento: ", error);
        Swal.fire('Error', 'Hubo un problema al eliminar.', 'error');
      }
    }
  };

  useEffect(()=>{
    cargarCategorias();
    cargarEntrenosMes(fecha);
  }, []);

  useEffect(()=>{
    const key = formatDate(fecha);
    const usuariosDia = entrenos[key] || {};
    const detalle = {};
    
    Object.entries(usuariosDia).forEach(([usr, items]) => {
      detalle[usr] = items.map(item => ({
        docId: item.docId,
        nombre: categoriasMap[item.catId] || "Sin categoría",
        notas: item.notas
      }));
    });
    
    setDetalleDia(detalle);
  }, [fecha, entrenos, categoriasMap]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
          <Search className="text-primary" /> Explorar Calendario
        </h2>
        <div className="custom-calendar-container">
          <Calendar
            onChange={setFecha}
            value={fecha}
            onActiveStartDateChange={({activeStartDate})=>{
              cargarEntrenosMes(activeStartDate);
            }}
            tileContent={({ date, view })=>{
              if(view !== "month") return null;

              const key = formatDate(date);
              const hoy = new Date();
              hoy.setHours(0,0,0,0);

              const esPasado = date < hoy;
              const tiene = entrenos[key];

              let colorClass = null;
              if(tiene && Object.keys(tiene).length > 0) colorClass="bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]";
              else if(esPasado) colorClass="bg-red-500/50";
              else return null;

              return (
                <div className="flex justify-center mt-1">
                  <div
                    className={`w-2 h-2 rounded-full cursor-pointer ${colorClass}`}
                    onClick={(e)=>{
                      e.stopPropagation();
                      mostrarEntrenos(tiene);
                    }}
                  />
                </div>
              );
            }}
          />
        </div>
      </div>

      <div className="glass-panel p-6 relative min-h-[300px]">
        <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2 border-b border-borderBase pb-4">
          <CalendarIcon className="text-accent" />
          Resumen del {fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>

        {loading ? (
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : Object.keys(detalleDia).length === 0 ? (
          <div className="flex flex-col items-center justify-center text-textMuted py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-surfaceHighlight flex items-center justify-center">
              <span className="text-3xl">😴</span>
            </div>
            <p className="font-medium text-lg">Nadie entrenó pajeros</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(detalleDia).map(([userName, lista])=>(
              <div key={userName} className="bg-surfaceHighlight/30 rounded-xl p-4 border border-borderBase">
                <div className="font-bold text-primary mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-textMain">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  {userName}
                </div>
                <div className="flex flex-wrap gap-2">
                  {lista.map((item)=>(
                    <span key={item.docId} className="bg-surface px-3 py-1.5 rounded-lg text-sm text-textMain font-medium border border-borderBase shadow-sm flex items-center gap-1 group">
                      <span className="flex flex-col">
                        <span>{item.nombre}</span>
                        {item.notas && <span className="text-xs text-textMuted font-normal italic">{item.notas}</span>}
                      </span>
                      {userName === user?.displayName && (
                        <button 
                          onClick={() => eliminarEntrenamiento(item.docId, item.nombre)}
                          className="text-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-full p-1 transition-colors ml-2 opacity-50 hover:opacity-100"
                          title="Eliminar este entrenamiento"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </span>
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