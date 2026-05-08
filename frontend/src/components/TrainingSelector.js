import { useState, useEffect, useRef } from "react";
import { cargarCategoriasActivas } from "../services/categoriasService";
import { guardarAsistencia } from "../services/asistenciasService";
import { subirFotoEntrenamiento } from "../services/storageService";
import { chisteRandom } from "../config/constants";
import { PlusCircle, Calendar as CalendarIcon, Camera, Loader, Dumbbell, Trash2, ImagePlus } from "lucide-react";
import Swal from "sweetalert2";

export default function TrainingSelector({ fecha, user, grupoId, theme }) {
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [notas, setNotas] = useState("");
  
  // Nuevos estados
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [rutina, setRutina] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) cargarCategorias();
  }, [user]);

  const cargarCategorias = async () => {
    try {
      const datos = await cargarCategoriasActivas(user.uid);
      setCategorias(datos);
      if (datos.length) setCategoria(datos[0].id);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const agregarEjercicio = () => {
    setRutina([...rutina, { nombre: "", series: 3, reps: 10, peso: 0 }]);
  };

  const eliminarEjercicio = (index) => {
    setRutina(rutina.filter((_, i) => i !== index));
  };

  const actualizarEjercicio = (index, campo, valor) => {
    const nuevaRutina = [...rutina];
    nuevaRutina[index][campo] = valor;
    setRutina(nuevaRutina);
  };

  const guardar = async () => {
    if (!categoria) {
      Swal.fire("Error", "Debes seleccionar una categoría.", "error");
      return;
    }
    
    if (!foto) {
      Swal.fire("¡Falta la foto!", "No hay foto, no hay gains. Subí una foto para registrar el entrenamiento.", "warning");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Subir foto
      const imagenUrl = await subirFotoEntrenamiento(foto, user.uid);

      // 2. Filtrar ejercicios vacíos de la rutina
      const rutinaLimpia = rutina.filter(ej => ej.nombre.trim() !== "");

      // 3. Guardar en Firestore
      await guardarAsistencia({
        userId: user.uid,
        userName: user.displayName,
        fecha,
        categoriaId: categoria,
        notas,
        rutina: rutinaLimpia,
        imagenUrl,
        grupoId: grupoId || "",
      });

      // Limpiar formulario
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
    } catch (err) {
      console.error("Error guardando entrenamiento:", err);
      Swal.fire("Error", "Hubo un problema al guardar. Intenta de nuevo.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel p-6 animate-slide-up">
      <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
        <CalendarIcon className="text-primary" /> Registrar Día
      </h2>

      <div className="bg-surfaceHighlight/50 rounded-xl p-4 mb-6 border border-borderBase flex justify-between items-center">
        <span className="text-textMuted text-sm">Fecha:</span>
        <span className="font-bold text-textMain">
          {fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric" })}
        </span>
      </div>

      <div className="space-y-6 mb-6">
        {/* Foto Obligatoria */}
        <div>
          <label className="block text-sm font-bold text-textMain mb-2 flex items-center gap-2">
            <Camera size={16} className="text-pink-500" /> Foto Obligatoria
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
                <span className="text-sm">Toca para sacar/subir foto</span>
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
          <label className="block text-sm font-medium text-textMuted mb-2">Categoría</label>
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

        {/* Rutina Detallada (Opcional) */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-textMuted flex items-center gap-2">
              <Dumbbell size={16} /> Rutina (Opcional)
            </label>
            <button onClick={agregarEjercicio} className="text-xs text-primary font-bold hover:underline">
              + Ejercicio
            </button>
          </div>
          
          <div className="space-y-3">
            {rutina.map((ej, index) => (
              <div key={index} className="flex gap-2 items-center bg-surfaceHighlight/50 p-2 rounded-lg border border-borderBase animate-fade-in">
                <input 
                  type="text" 
                  placeholder="Ej: Press Banca" 
                  className="bg-transparent border-b border-borderBase text-textMain w-1/3 outline-none focus:border-primary text-sm px-1 py-1"
                  value={ej.nombre}
                  onChange={(e) => actualizarEjercicio(index, "nombre", e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="Series" 
                  className="bg-surface border border-borderBase rounded text-textMain w-16 text-center text-sm p-1"
                  value={ej.series}
                  onChange={(e) => actualizarEjercicio(index, "series", Number(e.target.value))}
                />
                <span className="text-textMuted text-xs">x</span>
                <input 
                  type="number" 
                  placeholder="Reps" 
                  className="bg-surface border border-borderBase rounded text-textMain w-16 text-center text-sm p-1"
                  value={ej.reps}
                  onChange={(e) => actualizarEjercicio(index, "reps", Number(e.target.value))}
                />
                <span className="text-textMuted text-xs">@</span>
                <input 
                  type="number" 
                  placeholder="Kg" 
                  className="bg-surface border border-borderBase rounded text-textMain w-16 text-center text-sm p-1"
                  value={ej.peso}
                  onChange={(e) => actualizarEjercicio(index, "peso", Number(e.target.value))}
                />
                <button onClick={() => eliminarEjercicio(index)} className="text-red-500 hover:text-red-400 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notas generales */}
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Notas generales</label>
          <input
            type="text"
            placeholder="Ej: Fui con poca energía..."
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
        {isUploading ? <Loader className="animate-spin" size={20} /> : <PlusCircle size={20} />}
        {isUploading ? "Subiendo la evidencia..." : "Guardar Entrenamiento"}
      </button>
    </div>
  );
}
