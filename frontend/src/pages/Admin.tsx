import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { cargarMiembrosGrupo, agregarMiembro, eliminarMiembro } from "../services/gruposService";
import { ShieldCheck, UserPlus, Trash2, UserCheck, ChevronLeft } from "lucide-react";
import { ADMIN_EMAIL } from "../config/constants";
import { Alerta } from "../config/alertas";
import { Cargando, ErrorCarga } from "../components/ui/Estados";
import CodigoCopiable from "../components/CodigoCopiable";
import { Grupo } from "../types";

interface AdminProps {
  user: User;
  grupoActivo: Grupo;
  setView: (view: string) => void;
}

/** Admin del grupo: invitar por código o email y quitar miembros. */
export default function Admin({ user, grupoActivo, setView }: AdminProps): React.ReactElement {
  const [miembros, setMiembros] = useState<string[]>([]);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  useEffect(() => {
    if (grupoActivo) cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupoActivo]);

  const cargar = async () => {
    setEstado("cargando");
    try {
      setMiembros(await cargarMiembrosGrupo(grupoActivo.id));
      setEstado("listo");
    } catch (error) {
      console.error("Error al cargar miembros:", error);
      setEstado("error");
    }
  };

  const fallo = (e: unknown) => {
    console.error(e);
    Alerta.fire({ titleText: "No se pudo guardar", text: "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = nuevoEmail.toLowerCase().trim();
    if (!email.includes("@")) return;
    if (miembros.includes(email)) {
      Alerta.fire({ titleText: "Ya es miembro", text: `${email} ya está en el grupo.`, icon: "info", confirmButtonText: "Entendido" });
      return;
    }
    try {
      await agregarMiembro(grupoActivo.id, email);
      setNuevoEmail("");
      cargar();
    } catch (err) {
      fallo(err);
    }
  };

  const handleEliminar = async (email: string) => {
    if (email === ADMIN_EMAIL) return;
    const res = await Alerta.fire({
      titleText: "¿Quitar del grupo?",
      text: `${email} ya no va a ver este grupo. Sus entrenos no se borran.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });
    if (!res.isConfirmed) return;
    try {
      await eliminarMiembro(grupoActivo.id, email);
      cargar();
    } catch (err) {
      fallo(err);
    }
  };

  if (user?.email !== ADMIN_EMAIL && grupoActivo?.adminEmail !== user?.email) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto space-y-2">
        <h2 className="font-heading text-xl uppercase tracking-wide">Solo para el admin</h2>
        <p className="text-sm text-textMuted">Solo el administrador del grupo puede ver esta pantalla.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <button type="button" onClick={() => setView("settings")} className="flex items-center gap-1 min-h-tap text-sm font-semibold text-textMuted -ml-1">
        <ChevronLeft size={20} aria-hidden="true" /> Ajustes
      </button>
      <div>
        <p className="eyebrow flex items-center gap-1.5"><ShieldCheck size={14} aria-hidden="true" /> Admin</p>
        <h1 className="font-display text-4xl uppercase leading-none mt-1 break-words">{grupoActivo?.nombre}</h1>
      </div>

      <section className="glass-panel p-4 space-y-3" aria-labelledby="adm-invitar">
        <h2 id="adm-invitar" className="font-heading text-base uppercase tracking-wide">Invitar</h2>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-textMuted">Pasales este código para que se unan:</p>
          <CodigoCopiable codigo={grupoActivo.codigoInvitacion} />
        </div>
        <form onSubmit={handleAgregar} className="flex gap-2 pt-3 border-t border-borderBase">
          <input
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="o agregá un email"
            aria-label="Email del nuevo miembro"
            className="input-field flex-1 min-w-0"
            value={nuevoEmail}
            onChange={(e) => setNuevoEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary !px-4 shrink-0" aria-label="Agregar miembro">
            <UserPlus size={20} aria-hidden="true" />
          </button>
        </form>
      </section>

      <section className="glass-panel p-4 space-y-2" aria-labelledby="adm-miembros">
        <h2 id="adm-miembros" className="font-heading text-base uppercase tracking-wide">Miembros ({miembros.length})</h2>
        {estado === "cargando" ? (
          <Cargando />
        ) : estado === "error" ? (
          <ErrorCarga texto="No se pudieron cargar los miembros" onReintentar={cargar} />
        ) : (
          <ul>
            {miembros.map((m) => (
              <li key={m} className="flex items-center gap-3 min-h-[56px] border-t border-borderBase first:border-t-0">
                <span className="w-9 h-10 hex bg-textMain text-background grid place-items-center font-display shrink-0" aria-hidden="true">
                  {m.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold break-all">{m}</span>
                  {(m === ADMIN_EMAIL || m === grupoActivo.adminEmail) && (
                    <span className="text-xs font-bold text-accent uppercase tracking-wide">
                      {m === ADMIN_EMAIL ? "Admin de la app" : "Admin del grupo"}
                    </span>
                  )}
                </span>
                {m !== ADMIN_EMAIL && m !== grupoActivo.adminEmail && (
                  <button type="button" onClick={() => handleEliminar(m)} className="btn-icon text-textMuted hover:text-red-600" aria-label={`Quitar a ${m} del grupo`}>
                    <Trash2 size={20} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {user.email === ADMIN_EMAIL && (
        <button type="button" onClick={() => setView("aprobaciones")} className="btn-secondary w-full">
          <UserCheck size={20} aria-hidden="true" /> Aprobaciones de la app
        </button>
      )}
    </div>
  );
}
