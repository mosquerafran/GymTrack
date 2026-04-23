import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import Swal from "sweetalert2";

export default function TrainingSelector({ fecha, user, grupoId }) {
  const [categorias, setCategorias] = useState([]);
  const [categoria, setCategoria] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (user) cargarCategorias();
  }, [user]);

  const cargarCategorias = async () => {
    // Traemos las categorías personales del usuario
    const q = query(
      collection(db, "categorias"),
      where("userId", "==", user.uid)
    );
    const snap = await getDocs(q);

    const datos = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(c => c.activo !== false);

    setCategorias(datos);

    if (datos.length) setCategoria(datos[0].id);
  };

  const guardar = async () => {
    if (!categoria) return;

    const fechaISO = fecha.toISOString().slice(0, 10);

    await addDoc(collection(db, "asistencias"), {
      userId: user.uid,
      userName: user.displayName,
      fecha: fechaISO,
      categoriaId: categoria,
      notas: notas.trim(),
      grupoId: grupoId || ""
    });

    setNotas(""); // Limpiar después de guardar

    const chistes = [
      "¡Guardado! Increíble que te animes a llamar 'entrenamiento' a lo que acabás de hacer.",
      "Bien ahí, pero acordate que caminar a la heladera no cuenta como cardio.",
      "Guardado. Preparate porque mañana vas a llorar hasta para sentarte en el inodoro.",
      "Excelente. Ya estás para ganarle una pulseada a un nene de 5 años.",
      "Aprobado. Igual seguís estando a un asado de la obesidad clínica.",
      "Guardado. Ahora a comer pollo con arroz porque si seguís comiendo empanadas no hay arreglo.",
      "¡Felicidades! Lograste transpirar sin estar comiendo algo picante."
    ];

    Swal.fire({
      title: "¡Guardado! 💪",
      text: chistes[Math.floor(Math.random() * chistes.length)],
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 4000,
      background: 'var(--color-surface)',
      color: 'var(--color-text-main)'
    });
  };

  return (
    <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h2 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
        <CalendarIcon className="text-primary" /> Registrar Día
      </h2>

      <div className="bg-surfaceHighlight/50 rounded-xl p-4 mb-6 border border-borderBase flex justify-between items-center">
        <span className="text-textMuted text-sm">Fecha Seleccionada:</span>
        <span className="font-bold text-textMain text-lg">
          {fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">
            ¿Qué entrenaste?
          </label>
          <div className="relative">
            <select
              className="input-field appearance-none cursor-pointer"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="" disabled>Selecciona una categoría...</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id} className="bg-surface text-textMain">
                  {c.nombre}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-textMuted">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">
            Notas / Peso (Opcional)
          </label>
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