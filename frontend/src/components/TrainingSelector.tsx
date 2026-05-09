import React, { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { cargarCategoriasActivas } from "../services/categoriasService";
import { guardarAsistencia, actualizarAsistencia } from "../services/asistenciasService";
import { subirFotoEntrenamiento } from "../services/storageService";
import { chisteRandom } from "../config/constants";
import { PlusCircle, Calendar as CalendarIcon, Camera, Loader, Dumbbell, Trash2, ImagePlus, Save } from "lucide-react";
import Swal from "sweetalert2";
import { Categoria, EjercicioRutina, Asistencia } from "../types";

interface TrainingSelectorProps {
  fecha: Date;
  user: User;
  grupoId: string;
  theme: "dark" | "light";
  asistenciaAEditar?: Asistencia | null;
  onCompletado?: () => void;
  onCancelar?: () => void;
}

export default function TrainingSelector({ fecha, user, grupoId, theme, asistenciaAEditar, onCompletado, onCancelar }: TrainingSelectorProps): React.ReactElement {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [rutina, setRutina] = useState<EjercicioRutina[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadCategorias();
    
    if (asistenciaAEditar) {
      setCategoria(asistenciaAEditar.categoriaId);
      setNotas(asistenciaAEditar.notas || "");
      setRutina(asistenciaAEditar.rutina || []);
      if (asistenciaAEditar.imagenUrl) setFotoPreview(asistenciaAEditar.imagenUrl);
    }
  }, [user, asistenciaAEditar]);

  const loadCategorias = async () => {
    try {
      const datos = await cargarCategoriasActivas(user.uid);
      setCategorias(datos);
      if (datos.length && !asistenciaAEditar) setCategoria(datos[0].id || "");
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const agregarEjercicio = () => {
    setRutina([...rutina, { nombre: "", peso: 0, reps: 0 }]);
  };

  const eliminarEjercicio = (index: number) => {
    setRutina(rutina.filter((_, i) => i !== index));
  };

  const actualizarEjercicio = (index: number, campo: keyof EjercicioRutina, valor: any) => {
    const nuevaRutina = [...rutina];
    nuevaRutina[index] = { ...nuevaRutina[index], [campo]: valor };
    setRutina(nuevaRutina);
  };

  const guardar = async () => {
    if (!categoria) {
      Swal.fire("Error", "Debes seleccionar una categoría.", "error");
      return;
    }
    
    if (!foto && !asistenciaAEditar?.imagenUrl) {
      Swal.fire("¡Falta la foto!", "No hay foto, no hay gains. Subí una foto para registrar el entrenamiento.", "warning");
      return;
    }

    setIsUploading(true);

    try {
      let imagenUrl = asistenciaAEditar?.imagenUrl || null;
      
      // 1. Subir foto si hay una nueva
      if (foto) {
        imagenUrl = await subirFotoEntrenamiento(foto, user.uid);
      }

      // 2. Filtrar ejercicios vacíos
      const rutinaLimpia = rutina.filter(ej => ej.nombre.trim() !== "");

      // 3. Guardar o Actualizar
      const data: Partial<Asistencia> = {
        categoriaId: categoria,
        notas,
        rutina: rutinaLimpia,
        imagenUrl,
      };

      if (asistenciaAEditar?.id || asistenciaAEditar?.docId) {
        const id = (asistenciaAEditar.id || asistenciaAEditar.docId)!;
        await actualizarAsistencia(id, data);
        Swal.fire({ title: "¡Actualizado! ✨", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        await guardarAsistencia({
          userId: user.uid,
          userName: user.displayName || "Usuario",
          fecha,
          categoriaId: categoria,
          notas,
          rutina: rutinaLimpia,
          imagenUrl,
          grupoId: grupoId || "",
        });
        
        // Limpiar solo si es nuevo
        setNotas("");
        setFoto(null);
        setFotoPreview(null);
        setRutina([]);
        if (fileInputRef.current) fileInputRef.current.value = "";

        Swal.fire({
          title: "¡Épico! 💪",
          text: chisteRandom(),
          icon: "success",
          background: theme === "dark" ? "#1e293b" : "#ffffff",
          color: theme === "dark" ? "#f8fafc" : "#0f172a",
          confirmButtonColor: "#3b82f6",
          confirmButtonText: "Seguir rompiéndola",
        });
      }

      if (onCompletado) onCompletado();
    } catch (err) {
      console.error("Error guardando entrenamiento:", err);
      Swal.fire("Error", "Hubo un problema al guardar. Intenta de nuevo.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`glass-panel p-6 ${asistenciaAEditar ? "border-primary/30" : "animate-slide-up"}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
          {asistenciaAEditar ? <Save className="text-primary" /> : <CalendarIcon className="text-primary" />}
          {asistenciaAEditar ? "Editar Registro" : "Registrar Día"}
        </h2>
        {asistenciaAEditar && (
          <button onClick={onCancelar} className="text-textMuted hover:text-textMain">
            Cancelar
          </button>
        )}
      </div>

      <div className="bg-surfaceHighlight/50 rounded-xl p-4 mb-6 border border-borderBase flex justify-between items-center">
        <span className="text-textMuted text-sm">Fecha:</span>
        <span className="font-bold text-textMain">
          {fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" })}
        </span>
      </div>

      <div className="space-y-6 mb-6">
        {/* Foto */}
        <div>
          <label className="block text-sm font-bold text-textMain mb-2 flex items-center gap-2">
            <Camera size={16} className="text-pink-500" /> Foto de Evidencia
          </label>
          <div 
            className="border-2 border-dashed border-borderBase rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors bg-surfaceHighlight/30 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ minHeight: "150px" }}
            onClick={() => fileInputRef.current?.click()}
          >
            {fotoPreview ? (
              <img src={fotoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
            ) : (
              <div className="text-textMuted flex flex-col items-center gap-2">
                <ImagePlus size={32} />
                <span className="text-sm">Toca para subir foto</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFotoChange}
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Tipo de Entrenamiento</label>
          <select
            className="input-field appearance-none cursor-pointer"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="" disabled>Selecciona...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface text-textMain">{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* PRs del Día */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-textMuted flex items-center gap-2">
              <Dumbbell size={16} /> PRs del Día (Opcional)
            </label>
            <button onClick={agregarEjercicio} className="text-xs text-primary font-bold hover:underline">
              + PR
            </button>
          </div>
          
          <div className="space-y-3">
            {rutina.map((ej, index) => (
              <div key={index} className="flex gap-2 items-center bg-surfaceHighlight/50 p-2 rounded-lg border border-borderBase animate-fade-in">
                <input 
                  type="text" 
                  placeholder="Ejercicio" 
                  className="bg-transparent border-b border-borderBase text-textMain flex-1 outline-none focus:border-primary text-sm px-1 py-1 min-w-0"
                  value={ej.nombre}
                  onChange={(e) => actualizarEjercicio(index, "nombre", e.target.value)}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input 
                    type="number" 
                    placeholder="Kg" 
                    className="bg-surface border border-borderBase rounded text-textMain w-16 text-center text-sm p-1"
                    value={ej.peso || 0}
                    onChange={(e) => actualizarEjercicio(index, "peso", Number(e.target.value))}
                  />
                  <span className="text-textMuted text-[10px] font-bold">Kg</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input 
                    type="number" 
                    placeholder="Reps" 
                    className="bg-surface border border-borderBase rounded text-textMain w-12 text-center text-sm p-1"
                    value={ej.reps || 0}
                    onChange={(e) => actualizarEjercicio(index, "reps", Number(e.target.value))}
                  />
                  <span className="text-textMuted text-[10px] font-bold">Reps</span>
                </div>
                <button onClick={() => eliminarEjercicio(index)} className="text-red-500 hover:text-red-400 p-1 shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notas generales */}
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Mensaje del día</label>
          <input
            type="text"
            placeholder="¿Cómo te sentiste hoy?"
            className="input-field"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
      </div>

      <button 
        className="btn-primary w-full py-3 flex items-center justify-center gap-2" 
        onClick={guardar}
        disabled={isUploading}
      >
        {isUploading ? <Loader className="animate-spin" size={20} /> : (asistenciaAEditar ? <Save size={20} /> : <PlusCircle size={20} />)}
        {isUploading ? "Guardando..." : (asistenciaAEditar ? "Guardar Cambios" : "Guardar Entrenamiento")}
      </button>
    </div>
  );
}
