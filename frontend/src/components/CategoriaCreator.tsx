import React, { lazy, Suspense, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Tag, Plus, EyeOff, Eye, ChevronDown, ChevronRight } from "lucide-react";
import {
  cargarCategorias,
  crearCategoria,
  actualizarCategoria,
  toggleActivoCategoria,
  DatosCategoria,
} from "../services/categoriasService";
import { Alerta } from "../config/alertas";
import { Musculo, NOMBRE_MUSCULO, TIPOS, TIPOS_ORDEN } from "../config/entrenos";
import { plantillaDe } from "../utils/entrenos";
import { useSexo } from "../hooks/useSexo";
import Hoja from "./ui/Hoja";
import IconoTipo from "./IconoTipo";
import { Categoria } from "../types";

const SelectorMusculos = lazy(() => import("./cuerpo/SelectorMusculos"));

interface CategoriaCreatorProps {
  user: User;
}

const VACIA: DatosCategoria = { nombre: "", tipo: "gym", musculos: [], cuenta: true };

/**
 * "Tus categorías": plantillas personales de entreno. Cada una precarga tipo, músculos y
 * nombre al registrar, y decide si SUMA al ranking (tu "Fútbol" puede no sumar y el de otro sí).
 * No se borran: se ocultan (activo=false), así los entrenos viejos siguen mostrando su nombre.
 */
export default function CategoriaCreator({ user }: CategoriaCreatorProps): React.ReactElement {
  const sexo = useSexo(user.email);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [verOcultas, setVerOcultas] = useState(false);
  // Edición: null = cerrado; id "" = nueva.
  const [editando, setEditando] = useState<{ id: string; datos: DatosCategoria } | null>(null);
  const [guardando, setGuardando] = useState(false);

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
      Alerta.fire({ titleText: "No se pudieron cargar tus categorías", icon: "error", confirmButtonText: "Entendido" });
    }
    setLoading(false);
  };

  const fallo = (e: unknown) => {
    console.error(e);
    Alerta.fire({ titleText: "No se pudo guardar", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
  };

  const abrir = (cat?: Categoria) => {
    if (!cat) return setEditando({ id: "", datos: { ...VACIA } });
    const { tipo, musculos } = plantillaDe(cat);
    setEditando({ id: cat.id || "", datos: { nombre: cat.nombre, tipo, musculos, cuenta: cat.cuenta !== false } });
  };

  const cambiar = (parcial: Partial<DatosCategoria>) =>
    setEditando((e) => (e ? { ...e, datos: { ...e.datos, ...parcial } } : e));

  const guardar = async () => {
    if (!editando || !editando.datos.nombre.trim() || guardando) return;
    setGuardando(true);
    try {
      if (editando.id) await actualizarCategoria(editando.id, editando.datos);
      else await crearCategoria(user.uid, editando.datos);
      setEditando(null);
      cargar();
    } catch (err) {
      fallo(err);
    }
    setGuardando(false);
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

  const resumen = (cat: Categoria) => {
    const { tipo, musculos } = plantillaDe(cat);
    return tipo === "gym" && musculos.length
      ? musculos.map((m) => NOMBRE_MUSCULO[m]).join(" · ")
      : TIPOS[tipo].nombre;
  };

  const fila = (cat: Categoria) => (
    <li key={cat.id} className="flex items-center gap-1 border-t border-borderBase first:border-t-0">
      <button
        type="button"
        onClick={() => (cat.activo === false ? alternarOculta(cat) : abrir(cat))}
        className="flex-1 min-w-0 flex items-center gap-2 min-h-[60px] text-left"
        aria-label={cat.activo === false ? `Volver a mostrar ${cat.nombre}` : `Editar ${cat.nombre}`}
      >
        <span className="flex-1 min-w-0">
          <span className={`block font-semibold truncate ${cat.activo === false ? "text-textMuted" : ""}`}>{cat.nombre}</span>
          <span className="block text-sm text-textMuted truncate">{resumen(cat)}</span>
        </span>
        {cat.activo !== false && (
          <span className={`shrink-0 text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${cat.cuenta !== false ? "bg-textMain text-background" : "bg-surfaceHighlight text-textMuted"}`}>
            {cat.cuenta !== false ? "Suma" : "No suma"}
          </span>
        )}
        {cat.activo === false ? <Eye size={18} className="text-textMuted shrink-0" aria-hidden="true" /> : <ChevronRight size={18} className="text-textMuted shrink-0" aria-hidden="true" />}
      </button>
    </li>
  );

  const d = editando?.datos;

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="font-heading text-lg uppercase tracking-wide text-textMain flex items-center gap-2">
          <Tag size={20} className="text-accent" /> Tus categorías
        </h3>
        <p className="text-sm text-textMuted mt-1">
          Al registrar, elegís una y se cargan solos el tipo y los músculos. Vos decidís cuáles suman al ranking.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-primary border-t-transparent" />
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-sm text-textMuted py-2">Todavía no tenés categorías. Creá la primera.</p>
      ) : (
        <ul>{visibles.map(fila)}</ul>
      )}

      <button type="button" onClick={() => abrir()} className="btn-secondary w-full">
        <Plus size={20} aria-hidden="true" /> Nueva categoría
      </button>

      {ocultas.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setVerOcultas((v) => !v)}
            aria-expanded={verOcultas}
            className="w-full min-h-tap flex items-center justify-between text-sm font-semibold text-textMuted"
          >
            Ocultas ({ocultas.length}) · tocá una para volver a mostrarla
            <ChevronDown size={18} className={`transition-transform ${verOcultas ? "rotate-180" : ""}`} />
          </button>
          {verOcultas && <ul>{ocultas.map(fila)}</ul>}
        </div>
      )}

      {/* Editor (panel desde abajo) */}
      <Hoja
        abierta={!!editando}
        onCerrar={() => setEditando(null)}
        titulo={editando?.id ? "Editar categoría" : "Nueva categoría"}
        completa
      >
        {d && (
          <div className="space-y-6">
            <label className="block">
              <span className="eyebrow block mb-2">Nombre</span>
              <input
                type="text"
                className="input-field"
                maxLength={40}
                placeholder="Ej: Pecho-bíceps"
                value={d.nombre}
                onChange={(e) => cambiar({ nombre: e.target.value })}
              />
            </label>

            <div>
              <span className="eyebrow block mb-2">Tipo</span>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Tipo">
                {TIPOS_ORDEN.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={d.tipo === t}
                    onClick={() => cambiar({ tipo: t })}
                    className={`min-h-[60px] rounded-2xl border-[1.5px] flex flex-col items-center justify-center gap-0.5 font-heading text-[13px] uppercase tracking-wide ${d.tipo === t ? "border-textMain bg-textMain text-background" : "border-borderBase bg-background"}`}
                  >
                    <IconoTipo tipo={t} size={20} />
                    {TIPOS[t].nombre}
                  </button>
                ))}
              </div>
            </div>

            {d.tipo === "gym" && (
              <Suspense fallback={<div className="h-[360px] rounded-2xl bg-background animate-pulse" />}>
                <SelectorMusculos
                  sexo={sexo}
                  seleccion={new Set(d.musculos)}
                  onChange={(s: Set<Musculo>) => cambiar({ musculos: Array.from(s) })}
                />
              </Suspense>
            )}

            <label className="flex items-center justify-between gap-3 min-h-[56px] px-4 rounded-2xl border border-borderBase bg-background cursor-pointer">
              <span>
                <span className="block font-semibold">Suma al ranking</span>
                <span className="block text-sm text-textMuted">Días entrenados, racha y meta semanal.</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={d.cuenta}
                onChange={(e) => cambiar({ cuenta: e.target.checked })}
                className="w-6 h-6 accent-primary shrink-0"
              />
            </label>

            <div className="sticky bottom-0 -mx-4 -mb-4 px-4 pt-3 pb-safe-3 bg-surface border-t border-borderBase space-y-2">
              <button type="button" className="btn-primary w-full min-h-[52px]" onClick={guardar} disabled={!d.nombre.trim() || guardando}>
                {guardando ? "Guardando…" : "Guardar categoría"}
              </button>
              {editando?.id && (
                <button
                  type="button"
                  className="w-full min-h-tap flex items-center justify-center gap-2 text-sm font-semibold text-textMuted"
                  onClick={() => {
                    const cat = categorias.find((c) => c.id === editando.id);
                    setEditando(null);
                    if (cat) alternarOculta(cat);
                  }}
                >
                  <EyeOff size={18} aria-hidden="true" /> Ocultar categoría
                </button>
              )}
            </div>
          </div>
        )}
      </Hoja>
    </div>
  );
}
