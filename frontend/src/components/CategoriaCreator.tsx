import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  cargarCategorias,
  crearCategoria,
  eliminarCategoria,
  renombrarCategoria,
  toggleCuentaCategoria,
} from "../services/categoriasService";
import { Tag, Plus, CheckSquare, Trash2, Edit2, Check, X } from "lucide-react";
import Swal from "sweetalert2";
import { Categoria } from "../types";

interface CategoriaCreatorProps {
  user: User;
}

export default function CategoriaCreator({ user }: CategoriaCreatorProps): React.ReactElement {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState<string>("");
  const [cuenta, setCuenta] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState<string>("");

  useEffect(() => {
    if (user) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cargar = async () => {
    setLoading(true);
    try {
      const lista = await cargarCategorias(user.uid);
      setCategorias(lista);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const guardar = async () => {
    if (!nombre.trim()) return;
    try {
      await crearCategoria({ userId: user.uid, nombre, cuenta });
      setNombre("");
      setCuenta(true);
      cargar();
      Swal.fire({
        title: "Categoría creada ✅",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        background: "var(--color-surface)",
        color: "var(--color-text-main)",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEliminar = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: "¿Eliminar categoría?",
      text: `Se borrará "${name}". Esto no borrará tus entrenamientos pasados.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      background: "var(--color-surface)",
      color: "var(--color-text-main)",
    });
    if (res.isConfirmed) {
      await eliminarCategoria(id);
      cargar();
    }
  };

  const iniciarEdicion = (cat: Categoria) => {
    setEditando(cat.id || null);
    setEditNombre(cat.nombre);
  };

  const guardarEdicion = async (id: string) => {
    if (!editNombre.trim()) return;
    await renombrarCategoria(id, editNombre);
    setEditando(null);
    cargar();
  };

  const handleToggleCuenta = async (id: string, valor: boolean) => {
    await toggleCuentaCategoria(id, valor);
    cargar();
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
            <label className="block text-sm font-medium text-textMuted mb-2">Nombre de la categoría</label>
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
              <input type="checkbox" className="peer sr-only" checked={cuenta} onChange={(e) => setCuenta(e.target.checked)} />
              <div className="w-6 h-6 border-2 border-borderBase rounded bg-surfaceHighlight peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                <CheckSquare size={16} className={`text-white transition-transform ${cuenta ? "scale-100" : "scale-0"}`} />
              </div>
            </div>
            <span className="text-textMain group-hover:text-primary transition-colors select-none">
              Cuenta para el ranking de días
            </span>
          </label>
        </div>
      </div>

      {/* Listado */}
      <div className="glass-panel p-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
        <h3 className="text-xl font-bold text-textMain mb-6">Mis categorías actuales</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : categorias.length === 0 ? (
          <p className="text-textMuted text-center py-4 italic">No tenés categorías todavía. Creá una arriba.</p>
        ) : (
          <div className="grid gap-3">
            {categorias.map((cat) => (
              <div key={cat.id} className="bg-surfaceHighlight/30 border border-borderBase rounded-xl p-4 flex items-center justify-between group">
                <div className="flex-1 flex items-center gap-1">
                  <button
                    onClick={() => handleToggleCuenta(cat.id!, cat.cuenta)}
                    className="btn-icon shrink-0"
                    title={cat.cuenta ? "Cuenta para el ranking" : "No cuenta para el ranking"}
                    aria-label={cat.cuenta ? `${cat.nombre} cuenta para el ranking` : `${cat.nombre} no cuenta para el ranking`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 transition-colors ${cat.cuenta ? "bg-primary border-primary" : "bg-transparent border-textMuted"}`} />
                  </button>
                  {editando === cat.id ? (
                    <div className="flex-1 flex gap-2">
                      <input className="input-field py-1 text-sm flex-1" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} autoFocus />
                      <button onClick={() => guardarEdicion(cat.id!)} className="text-green-500"><Check size={18} /></button>
                      <button onClick={() => setEditando(null)} className="text-red-500"><X size={18} /></button>
                    </div>
                  ) : (
                    <span className="text-textMain font-medium">{cat.nombre}</span>
                  )}
                </div>
                {editando !== cat.id && (
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => iniciarEdicion(cat)} className="btn-icon text-textMuted hover:text-primary" aria-label={`Renombrar ${cat.nombre}`}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleEliminar(cat.id!, cat.nombre)} className="btn-icon text-textMuted hover:text-red-500" aria-label={`Eliminar ${cat.nombre}`}>
                      <Trash2 size={18} />
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
