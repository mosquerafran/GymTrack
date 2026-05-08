import { useState, useEffect } from "react";
import { cargarCategoriasActivas } from "../services/categoriasService";
import { guardarAsistencia } from "../services/asistenciasService";
import { chisteRandom } from "../config/constants";
import { PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import Swal from "sweetalert2";

export default function TrainingSelector({ fecha, user, grupoId, theme }) {
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [notas, setNotas] = useState("");

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

  const guardar = async () => {
    if (!categoria) return;

    try {
      await guardarAsistencia({
        userId: user.uid,
        userName: user.displayName,
        fecha,
        categoriaId: categoria,
        notas,
        grupoId: grupoId || "",
      });

      setNotas("");

      Swal.fire({
        title: "¡Entrenamiento Guardado! 💪",
        text: chisteRandom(),
        icon: "success",
        background: theme === "dark" ? "#1e293b" : "#ffffff",
        color: theme === "dark" ? "#f8fafc" : "#0f172a",
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "¡A darle!",
        showClass: { popup: "animate__animated animate__fadeInUp animate__faster" },
        hideClass: { popup: "animate__animated animate__fadeOutDown animate__faster" },
      });
    } catch (err) {
      console.error("Error guardando entrenamiento:", err);
    }
  };

  return (
    <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
      <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
        <CalendarIcon className="text-primary" /> Registrar Día
      </h2>

      <div className="bg-surfaceHighlight/50 rounded-xl p-4 mb-6 border border-borderBase flex justify-between items-center">
        <span className="text-textMuted text-sm">Fecha Seleccionada:</span>
        <span className="font-bold text-textMain text-lg">
          {fecha.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">¿Qué entrenaste?</label>
          <div className="relative">
            <select
              className="input-field appearance-none cursor-pointer"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="" disabled>Selecciona una categoría...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface text-textMain">{c.nombre}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-textMuted">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Notas / Peso (Opcional)</label>
          <input
            type="text"
            placeholder="Ej: Pecho 100kg x 8 reps..."
            className="input-field"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
      </div>

      <button className="btn-primary w-full py-3" onClick={guardar}>
        <PlusCircle size={20} /> Guardar Entrenamiento
      </button>
    </div>
  );
}
