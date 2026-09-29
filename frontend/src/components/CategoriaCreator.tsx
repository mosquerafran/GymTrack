import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  cargarCategorias,
  crearCategoria,
  renombrarCategoria,
  toggleActivoCategoria,
} from "../services/categoriasService";
import { Tag, Plus, Edit2, Check, X, EyeOff, Eye, ChevronDown } from "lucide-react";
import { Alerta } from "../config/alertas";
import { Categoria } from "../types";

interface CategoriaCreatorProps {
  user: User;
}

/**
 * "Tus etiquetas": las viejas categorías, ahora sugerencias para la etiqueta del registro.
 * No se borran: se ocultan (activo=false). Así los entrenos viejos que las usan siguen
 * mostrando su nombre en el muro y en el detalle del día.
 */
export default function CategoriaCreator({ user }: CategoriaCreatorProps): React.ReactElement {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [verOcultas, setVerOcultas] = useState(false);

  useEffect(() => {
    if (user) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cargar = async () => {
    setLoading(true);
    try {
      setCategorias(await cargarCategorias(user.uid));
    } catch (e) {
      console.error(e);
      Alerta.fire({ titleText: "No se pudieron cargar tus etiquetas", icon: "error", confirmButtonText: "Entendido" });
    }
    setLoading(false);
  };

  const fallo = (e: unknown) => {
    console.error(e);
    Alerta.fire({ titleText: "No se pudo guardar", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return;
    try {
      await crearCategoria({ userId: user.uid, nombre: limpio, cuenta: true });
      setNombre("");
      cargar();
    } catch (err) {
      fallo(err);
    }
  };

  const guardarEdicion = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editNombre.trim()) return;
    try {
      await renombrarCategoria(id, editNombre);
      setEditando(null);
      cargar();
    } catch (err) {
      fallo(err);
    }
  };

  const alternarOculta = async (cat: Categoria) => {
    try {
      await toggleActivoCategoria(cat.id!, cat.activo !== false);
      cargar();
    } catch (err) {
      fallo(err);
    }
  };

  const visibles = categorias.filter((c) => c.activo !== false);
  const ocultas = categorias.filter((c) => c.activo === false);

  const fila = (cat: Categoria) => (
    <li key={cat.id} className="flex items-center gap-1 min-h-[52px] border-t border-borderBase first:border-t-0">
      {editando === cat.id ? (
        <form className="flex-1 flex items-center gap-1" onSubmit={(e) => guardarEdicion(e, cat.id!)}>
          <input
            className="input-field !py-2 flex-1 min-w-0"
            value={editNombre}
            maxLength={40}
            aria-label={`Nuevo nombre para ${cat.nombre}`}
            onChange={(e) => setEditNombre(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-icon text-primary" aria-label="Guardar nombre"><Check size={20} /></button>
          <button type="button" onClick={() => setEditando(null)} className="btn-icon text-textMuted" aria-label="Cancelar"><X size={20} /></button>
        </form>
      ) : (
        <>
          <span className={`flex-1 min-w-0 truncate font-semibold ${cat.activo === false ? "text-textMuted" : "text-textMain"}`}>{cat.nombre}</span>
          {cat.activo !== false && (
            <button
              type="button"
              onClick={() => { setEditando(cat.id || null); setEditNombre(cat.nombre); }}
              className="btn-icon text-textMuted"
              aria-label={`Renombrar ${cat.nombre}`}
            >
              <Edit2 size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={() => alternarOculta(cat)}
            className="btn-icon text-textMuted"
            aria-label={cat.activo === false ? `Volver a mostrar ${cat.nombre}` : `Ocultar ${cat.nombre}`}
          >
            {cat.activo === false ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </>
      )}
    </li>
  );

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg uppercase tracking-wide text-textMain flex items-center gap-2">
          <Tag size={20} className="text-accent" /> Tus etiquetas
        </h3>
        <p className="text-sm text-textMuted mt-1">
          Aparecen como sugerencia al registrar. Ocultar una no cambia tus entrenos viejos.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-textMuted py-2">Todavía no tenés etiquetas. Creá una abajo.</p>
      ) : (
        <ul>{visibles.map(fila)}</ul>
      )}

      <form className="flex gap-2" onSubmit={crear}>
        <input
          className="input-field flex-1 min-w-0"
          type="text"
          maxLength={40}
          placeholder="Nueva etiqueta (ej: Push pesado)"
          aria-label="Nueva etiqueta"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button type="submit" className="btn-accent !px-0 w-12 shrink-0" aria-label="Agregar etiqueta" disabled={!nombre.trim()}>
          <Plus size={22} />
        </button>
      </form>

      {ocultas.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setVerOcultas((v) => !v)}
            aria-expanded={verOcultas}
            className="w-full min-h-tap flex items-center justify-between text-sm font-semibold text-textMuted"
          >
            Ocultas ({ocultas.length})
            <ChevronDown size={18} className={`transition-transform ${verOcultas ? "rotate-180" : ""}`} />
          </button>
          {verOcultas && <ul>{ocultas.map(fila)}</ul>}
        </div>
      )}
    </div>
  );
}
