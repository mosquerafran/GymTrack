import React, { lazy, Suspense, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Dumbbell, Edit2, MessageSquare, Plus, Trash2, CalendarX } from "lucide-react";
import { cargarAsistenciasMes, eliminarAsistencia } from "../services/asistenciasService";
import { cargarMapaCategorias } from "../services/categoriasService";
import { Alerta } from "../config/alertas";
import { SEXO_DEFAULT } from "../config/entrenos";
import { cuentaDe, descripcionDe, etiquetaDe, musculosDe, NombresCategoria } from "../utils/entrenos";
import { formatDateLocal } from "../utils/date";
import { Asistencia, Categoria } from "../types";
import { Cargando, ErrorCarga } from "./ui/Estados";

const MiniCuerpo = lazy(() => import("./cuerpo/MiniCuerpo"));

interface DetalleDiaProps {
  user: User;
  grupoId: string;
  fecha: Date;
  onEditar: (a: Asistencia) => void;
  onRegistrar: (fecha: Date) => void;
  /** Aumenta cuando se guarda o borra algo, para recargar. */
  refresco: number;
  onCambio: () => void;
}

/** Quién entrenó un día (del grupo) y, lo propio, editar o borrar. Va dentro de una Hoja. */
export default function DetalleDia({ user, grupoId, fecha, onEditar, onRegistrar, refresco, onCambio }: DetalleDiaProps): React.ReactElement {
  const [porUsuario, setPorUsuario] = useState<Record<string, Asistencia[]>>({});
  const [nombres, setNombres] = useState<NombresCategoria>({});
  const [categorias, setCategorias] = useState<Record<string, Categoria>>({});
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  const cargar = async () => {
    setEstado("cargando");
    try {
      const [mes, mapa] = await Promise.all([cargarAsistenciasMes(grupoId, fecha), cargarMapaCategorias()]);
      setPorUsuario((mes[formatDateLocal(fecha)] || {}) as Record<string, Asistencia[]>);
      setNombres(Object.fromEntries(Object.entries(mapa).map(([id, c]) => [id, c.nombre])));
      setCategorias(mapa);
      setEstado("listo");
    } catch (e) {
      console.error(e);
      setEstado("error");
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoId, fecha, refresco]);

  const borrar = async (a: Asistencia) => {
    const titulo = etiquetaDe(a, nombres) || descripcionDe(a, nombres);
    const res = await Alerta.fire({
      titleText: "¿Borrar el entreno?",
      text: `Se borra "${titulo}" y su foto. No se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    try {
      await eliminarAsistencia((a.docId || a.id)!);
      onCambio();
    } catch (e) {
      console.error(e);
      Alerta.fire({ titleText: "No se pudo borrar", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
    }
  };

  if (estado === "cargando") return <Cargando />;
  if (estado === "error") return <ErrorCarga texto="No se pudo cargar el día" onReintentar={cargar} />;

  const usuarios = Object.entries(porUsuario);
  const esMio = (a: Asistencia) => a.userId === user.uid;
  const yaRegistre = usuarios.some(([, items]) => items.some(esMio));
  const futuro = formatDateLocal(fecha) > formatDateLocal(new Date());

  return (
    <div className="space-y-4">
      {usuarios.length === 0 && (
        <div className="flex flex-col items-center text-center gap-2 py-6">
          <CalendarX size={32} className="text-accent" aria-hidden="true" />
          <p className="font-heading text-lg uppercase tracking-wide">Nadie entrenó este día</p>
        </div>
      )}

      {usuarios.map(([nombre, items]) => (
        <section key={nombre} className="space-y-2">
          <h3 className="flex items-center gap-2.5 font-bold">
            <span className="w-9 h-9 rounded-full bg-accent text-surface grid place-items-center font-heading shrink-0" aria-hidden="true">
              {nombre.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{nombre}{items.some(esMio) && " (vos)"}</span>
          </h3>
          {items.map((a) => {
            const etiqueta = etiquetaDe(a, nombres);
            const detalle = descripcionDe(a, nombres);
            const musculos = musculosDe(a, nombres);
            return (
              <article key={a.docId || a.id} className="bg-background border border-borderBase rounded-2xl p-3 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    {etiqueta && (
                      <span className="inline-block max-w-full truncate text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary uppercase tracking-wide">
                        {etiqueta}
                      </span>
                    )}
                    <p className="font-heading text-base tracking-wide">{detalle}</p>
                    {!cuentaDe(a, categorias) && (
                      <p className="text-xs font-semibold text-textMuted uppercase tracking-wide">No suma al ranking</p>
                    )}
                  </div>
                  {musculos.length > 0 && (
                    <Suspense fallback={null}>
                      <MiniCuerpo sexo={a.sexo || SEXO_DEFAULT} musculos={musculos} className="shrink-0" />
                    </Suspense>
                  )}
                </div>
                {a.notas && (
                  <p className="flex gap-2 text-sm italic">
                    <MessageSquare size={16} className="text-accent mt-0.5 shrink-0" aria-hidden="true" />"{a.notas}"
                  </p>
                )}
                {a.rutina && a.rutina.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Dumbbell size={16} className="text-textMuted" aria-label="PRs" />
                    {a.rutina.map((ej, i) => (
                      <span key={i} className="text-sm font-semibold bg-surface border border-borderBase rounded-lg px-2 py-1">
                        {ej.nombre} <span className="text-primary">{ej.peso ? `${ej.peso} kg` : ""}{ej.reps ? ` × ${ej.reps}` : ""}</span>
                      </span>
                    ))}
                  </div>
                )}
                {esMio(a) && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" className="btn-secondary !py-2" onClick={() => onEditar(a)}>
                      <Edit2 size={18} aria-hidden="true" /> Editar
                    </button>
                    <button type="button" className="min-h-tap rounded-xl border-[1.5px] border-red-600/60 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2" onClick={() => borrar(a)}>
                      <Trash2 size={18} aria-hidden="true" /> Borrar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}

      {!futuro && (
        <button type="button" className={yaRegistre ? "btn-secondary w-full" : "btn-primary w-full"} onClick={() => onRegistrar(fecha)}>
          <Plus size={20} aria-hidden="true" /> {yaRegistre ? "Agregar otro entreno" : "Registrar este día"}
        </button>
      )}
    </div>
  );
}
