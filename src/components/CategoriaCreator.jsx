import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Tag, Plus, CheckSquare, Trash2, Edit2, Check, X } from "lucide-react";
import Swal from "sweetalert2";

export default function CategoriaCreator({ user }) {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cuenta, setCuenta] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null); // ID de la categoría que se está editando
  const [editNombre, setEditNombre] = useState("");

  useEffect(() => {
    if (user) cargarCategorias();
  }, [user]);

  const cargarCategorias = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "categorias"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      setCategorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const guardar = async () => {
    if (!nombre.trim()) return;

    await addDoc(collection(db, "categorias"), {
      userId: user.uid,
      nombre: nombre.trim(),
      cuenta,
      activo: true
    });

    setNombre("");
    setCuenta(true);
    cargarCategorias();
    
    Swal.fire({
      title: "Categoría creada ✅",
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      background: 'var(--color-surface)',
      color: 'var(--color-text-main)'
    });
  };

  const eliminar = async (id, name) => {
    const res = await Swal.fire({
      title: "¿Eliminar categoría?",
      text: `Se borrará "${name}". Esto no borrará tus entrenamientos pasados, pero ya no aparecerán con este nombre en las gráficas si los borrás de acá.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      background: 'var(--color-surface)',
      color: 'var(--color-text-main)'
    });

    if (res.isConfirmed) {
      await deleteDoc(doc(db, "categorias", id));
      cargarCategorias();
    }
  };

  const iniciarEdicion = (cat) => {
    setEditando(cat.id);
    setEditNombre(cat.nombre);
  };

  const guardarEdicion = async (id) => {
    if (!editNombre.trim()) return;
    await updateDoc(doc(db, "categorias", id), { nombre: editNombre.trim() });
    setEditando(null);
    cargarCategorias();
  };

  const toggleCuenta = async (id, valor) => {
    await updateDoc(doc(db, "categorias", id), { cuenta: !valor });
    cargarCategorias();
  };

  return (
    <div className="space-y-6">
      {/* Creador */}
      <div className="glass-panel p-6 animate-slide-up">
        <h3 className="text-xl font-bold text-textMain mb-6 flex items-center gap-2">
          <Tag className="text-accent" /> Nueva categoría
        </h3>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">
              Nombre de la categoría
            </label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                type="text"
                placeholder="Ej: Pecho y Triceps"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <button className="btn-accent px-4" onClick={guardar}>
                <Plus size={20} />
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={cuenta}
                onChange={(e) => setCuenta(e.target.checked)}
              />
              <div className="w-6 h-6 border-2 border-borderBase rounded bg-surfaceHighlight peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                <CheckSquare size={16} className={`text-white transition-transform ${cuenta ? 'scale-100' : 'scale-0'}`} />
              </div>
            </div>
            <span className="text-textMain group-hover:text-primary transition-colors select-none">
              Cuenta para el ranking de días
            </span>
          </label>
        </div>
      </div>

      {/* Listado */}
      <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h3 className="text-xl font-bold text-textMain mb-6">Mis categorías actuales</h3>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : categorias.length === 0 ? (
          <p className="text-textMuted text-center py-4 italic">No tenés categorías todavía. Creá una arriba.</p>
        ) : (
          <div className="grid gap-3">
            {categorias.map(cat => (
              <div key={cat.id} className="bg-surfaceHighlight/30 border border-borderBase rounded-xl p-4 flex items-center justify-between group">
                <div className="flex-1 flex items-center gap-3">
                  <button 
                    onClick={() => toggleCuenta(cat.id, cat.cuenta)}
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${cat.cuenta ? 'bg-primary border-primary' : 'bg-transparent border-textMuted'}`}
                    title={cat.cuenta ? "Suma puntos" : "No suma puntos"}
                  />
                  
                  {editando === cat.id ? (
                    <div className="flex-1 flex gap-2">
                      <input 
                        className="input-field py-1 text-sm flex-1"
                        value={editNombre}
                        onChange={e => setEditNombre(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => guardarEdicion(cat.id)} className="text-green-500"><Check size={18} /></button>
                      <button onClick={() => setEditando(null)} className="text-red-500"><X size={18} /></button>
                    </div>
                  ) : (
                    <span className="text-textMain font-medium">{cat.nombre}</span>
                  )}
                </div>

                {editando !== cat.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => iniciarEdicion(cat)} className="p-2 text-textMuted hover:text-primary transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => eliminar(cat.id, cat.nombre)} className="p-2 text-textMuted hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}