import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { obtenerUsuarios, cambiarEstadoUsuario } from "../services/authService";
import { UserCheck, UserX, ShieldCheck, Clock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { ADMIN_EMAIL } from "../config/constants";
import { Alerta } from "../config/alertas";
import { Cargando, EstadoVacio, ErrorCarga } from "../components/ui/Estados";
import { Usuario, EstadoUsuario } from "../types";

interface AprobacionesProps {
  user: User;
}

interface UsuarioDoc extends Usuario {
  id: string;
}

/** Aprobar o rechazar usuarios de la app (solo el admin global). */
export default function Aprobaciones({ user }: AprobacionesProps): React.ReactElement {
  const [pendientes, setPendientes] = useState<UsuarioDoc[]>([]);
  const [aprobados, setAprobados] = useState<UsuarioDoc[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) cargar();
  }, [user]);

  const cargar = async () => {
    setEstado("cargando");
    try {
      const { pendientes: pend, aprobados: apr } = await obtenerUsuarios();
      setPendientes(pend as UsuarioDoc[]);
      setAprobados(apr as UsuarioDoc[]);
      setEstado("listo");
    } catch (e) {
      console.error(e);
      setEstado("error");
    }
  };

  // `id` es el email (doc id de `usuarios`). Se usa el id y no el campo `email`
  // porque este último lo escribe el propio usuario. `titleText` (no `title`)
  // para que SweetAlert lo muestre como texto y no interprete HTML.
  const cambiarEstado = async (id: string, nuevoEstado: EstadoUsuario) => {
    const accion = nuevoEstado === "aprobado" ? "aprobar" : "rechazar";
    const res = await Alerta.fire({
      titleText: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} a ${id}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    try {
      await cambiarEstadoUsuario(id, nuevoEstado);
    } catch (e) {
      console.error(e);
      Alerta.fire({ titleText: "No se pudo cambiar el estado", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
    }
    cargar();
  };

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto space-y-2">
        <h2 className="font-heading text-xl uppercase tracking-wide">Solo para el admin</h2>
        <p className="text-sm text-textMuted">Solo el administrador de la app puede ver esta pantalla.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <button type="button" onClick={() => window.history.back()} className="flex items-center gap-1 min-h-tap text-sm font-semibold text-textMuted -ml-1">
        <ChevronLeft size={20} aria-hidden="true" /> Volver
      </button>
      <div>
        <p className="eyebrow flex items-center gap-1.5"><Clock size={14} aria-hidden="true" /> Admin de la app</p>
        <h1 className="font-display text-4xl uppercase leading-none mt-1">Aprobaciones</h1>
      </div>

      {estado === "cargando" ? (
        <Cargando />
      ) : estado === "error" ? (
        <ErrorCarga texto="No se pudieron cargar los usuarios" onReintentar={cargar} />
      ) : (
        <>
          {pendientes.length === 0 ? (
            <EstadoVacio icono={CheckCircle2} titulo="Todo al día" texto="No hay solicitudes pendientes." />
          ) : (
            <ul className="space-y-3">
              {pendientes.map((u) => (
                <li key={u.id} className="glass-panel p-4 space-y-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{u.displayName || "Sin nombre"}</p>
                    <p className="text-sm text-textMuted break-all">{u.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => cambiarEstado(u.id, "aprobado")} className="btn-primary !py-2">
                      <UserCheck size={18} aria-hidden="true" /> Aprobar
                    </button>
                    <button type="button" onClick={() => cambiarEstado(u.id, "rechazado")} className="min-h-tap rounded-xl border-[1.5px] border-red-600/60 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2">
                      <UserX size={18} aria-hidden="true" /> Rechazar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {aprobados.length > 0 && (
            <section className="glass-panel p-4 space-y-1" aria-labelledby="apr-aprobados">
              <h2 id="apr-aprobados" className="font-heading text-base uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck size={18} className="text-accent" aria-hidden="true" /> Aprobados ({aprobados.length})
              </h2>
              <ul>
                {aprobados.map((u) => (
                  <li key={u.id} className="py-2.5 border-t border-borderBase first:border-t-0 min-w-0">
                    <p className="text-sm font-semibold truncate">{u.displayName || u.id}</p>
                    <p className="text-xs text-textMuted break-all">{u.id}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
