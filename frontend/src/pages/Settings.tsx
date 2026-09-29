import React from "react";
import { User } from "firebase/auth";
import { ArrowLeftRight, ChevronRight, LogOut, ShieldCheck, UserCheck } from "lucide-react";
import CategoriaCreator from "../components/CategoriaCreator";
import MetaSemanalConfig from "../components/MetaSemanalConfig";
import SexoConfig from "../components/SexoConfig";
import { ADMIN_EMAIL } from "../config/constants";
import { Alerta } from "../config/alertas";
import { cerrarSesion } from "../services/authService";
import { Grupo } from "../types";

interface SettingsProps {
  user: User;
  grupoActivo: Grupo | null;
  irA: (view: string) => void;
  onCambiarGrupo: () => void;
}

/** Ajustes: tu cuerpo, meta, etiquetas; grupo y admin; y cerrar sesión (con confirmación). */
export default function Settings({ user, grupoActivo, irA, onCambiarGrupo }: SettingsProps): React.ReactElement {
  const esAdminGlobal = user.email === ADMIN_EMAIL;
  const esAdminGrupo = esAdminGlobal || grupoActivo?.adminEmail === user.email;

  const salir = async () => {
    const res = await Alerta.fire({
      titleText: "¿Cerrar sesión?",
      text: "Vas a tener que volver a entrar con Google.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Cerrar sesión",
      cancelButtonText: "Cancelar",
    });
    if (res.isConfirmed) await cerrarSesion();
  };

  const fila = (icono: React.ReactNode, titulo: string, detalle: string | null, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 min-h-[56px] text-left border-t border-borderBase first:border-t-0"
    >
      <span className="text-accent shrink-0" aria-hidden="true">{icono}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold">{titulo}</span>
        {detalle && <span className="block text-sm text-textMuted truncate">{detalle}</span>}
      </span>
      <ChevronRight size={20} className="text-textMuted shrink-0" aria-hidden="true" />
    </button>
  );

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <div>
        <p className="eyebrow">Tu cuenta</p>
        <h1 className="font-display text-4xl uppercase leading-none mt-1">Ajustes</h1>
      </div>

      <SexoConfig user={user} />
      <MetaSemanalConfig user={user} />
      <CategoriaCreator user={user} />

      <section className="glass-panel px-4 py-1" aria-label="Grupo y administración">
        {fila(<ArrowLeftRight size={22} />, "Cambiar de grupo", grupoActivo ? `${grupoActivo.nombre} · código ${grupoActivo.codigoInvitacion}` : null, onCambiarGrupo)}
        {esAdminGrupo && fila(<ShieldCheck size={22} />, "Administrar grupo", "Miembros e invitaciones", () => irA("admin"))}
        {esAdminGlobal && fila(<UserCheck size={22} />, "Aprobaciones", "Usuarios pendientes de la app", () => irA("aprobaciones"))}
      </section>

      <button
        type="button"
        onClick={salir}
        className="w-full min-h-[52px] rounded-xl border-[1.5px] border-red-600/60 text-red-600 dark:text-red-400 font-bold flex items-center justify-center gap-2"
      >
        <LogOut size={20} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  );
}
