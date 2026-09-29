import React from "react";
import { User } from "firebase/auth";
import { Home, BarChart2, Settings, Sun, Moon, ArrowLeftRight, Flame, Plus, LucideIcon } from "lucide-react";
import { useStreak } from "../hooks/useStreak";
import { Grupo } from "../types";
import Logo from "./Logo";
import { NOMBRE_APP } from "../config/marca";

interface NavbarProps {
  view: string;
  irA: (view: string) => void;
  onRegistrar: () => void;
  user: User | null;
  theme: "dark" | "light";
  toggleTheme: () => void;
  grupoActivo: Grupo | null;
  onCambiarGrupo: () => void;
}

const PESTANAS: { view: string; icon: LucideIcon; label: string }[] = [
  { view: "home", icon: Home, label: "Inicio" },
  { view: "feed", icon: Flame, label: "Muro" },
  { view: "stats", icon: BarChart2, label: "Ranking" },
  { view: "settings", icon: Settings, label: "Ajustes" },
];

/**
 * Header (grupo, racha, tema) + navegación. En el celu, barra inferior con 4 pestañas y el
 * botón central "Registrar" al alcance del pulgar. "Salir" y el admin viven en Ajustes.
 */
export default function Navbar({ view, irA, onRegistrar, user, theme, toggleTheme, grupoActivo, onCambiarGrupo }: NavbarProps): React.ReactElement {
  const streak = useStreak(user, grupoActivo);

  const pestana = (p: (typeof PESTANAS)[number]) => {
    const activa = view === p.view;
    return (
      <button
        key={p.view}
        type="button"
        onClick={() => irA(p.view)}
        aria-current={activa ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-0.5 min-h-[52px] rounded-xl text-xs font-semibold transition-colors
          ${activa ? "text-textMain" : "text-textMuted active:bg-surfaceHighlight/60"}`}
      >
        <p.icon size={24} strokeWidth={activa ? 2.4 : 2} aria-hidden="true" />
        {p.label}
      </button>
    );
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface border-b-2 border-textMain pt-safe mb-4 md:mb-6">
        <div className="flex items-center gap-2 px-3 md:px-4 py-2">
          <Logo className="w-10 h-auto text-textMain shrink-0" titulo={NOMBRE_APP} />
          <button
            type="button"
            onClick={onCambiarGrupo}
            className="flex items-center gap-2 min-h-tap min-w-0 flex-1 md:flex-none px-3 border-2 border-textMain bg-background font-heading font-bold text-sm uppercase tracking-wide"
            aria-label={`Cambiar de grupo. Grupo actual: ${grupoActivo?.nombre || "sin grupo"}`}
          >
            <ArrowLeftRight size={18} className="text-accent shrink-0" aria-hidden="true" />
            <span className="truncate">{grupoActivo?.nombre || "Grupo"}</span>
          </button>

          {/* Escritorio: pestañas + Registrar en el header */}
          <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Navegación principal">
            {PESTANAS.map((p) => (
              <button
                key={p.view}
                type="button"
                onClick={() => irA(p.view)}
                aria-current={view === p.view ? "page" : undefined}
                className={`flex items-center gap-2 min-h-tap px-3 font-semibold transition-colors border-b-[3px] ${view === p.view ? "border-textMain text-textMain" : "border-transparent text-textMuted hover:text-textMain"}`}
              >
                <p.icon size={20} aria-hidden="true" /> {p.label}
              </button>
            ))}
            <button type="button" onClick={onRegistrar} className="btn-primary !py-2 ml-1">
              <Plus size={20} aria-hidden="true" /> Registrar
            </button>
          </nav>

          <div className="flex items-center gap-1 ml-auto shrink-0">
            {streak > 0 && (
              <div
                className="flex items-center gap-1 min-h-tap px-2.5 bg-primary text-white chanfle"
                title={`Racha de ${streak} días seguidos`}
                aria-label={`Racha de ${streak} días seguidos`}
              >
                <Flame size={18} strokeWidth={2.5} aria-hidden="true" />
                <span className="scoreboard text-xl font-bold leading-none">{streak}</span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-icon text-textMuted hover:text-textMain"
              aria-label={theme === "dark" ? "Pasar a modo claro" : "Pasar a modo oscuro"}
            >
              {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Celu: barra inferior con el botón central de Registrar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface border-t-2 border-textMain pb-safe"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5 items-end px-1.5 pt-1.5 pb-1">
          {pestana(PESTANAS[0])}
          {pestana(PESTANAS[1])}
          <button
            type="button"
            onClick={onRegistrar}
            className="flex flex-col items-center gap-0.5 text-xs font-semibold text-textMain"
            aria-label="Registrar entreno"
          >
            <span className="-mt-8 w-[62px] h-[62px] rombo bg-primary text-white grid place-items-center active:scale-95 transition-transform">
              <Plus size={30} strokeWidth={2.6} aria-hidden="true" />
            </span>
            Registrar
          </button>
          {pestana(PESTANAS[2])}
          {pestana(PESTANAS[3])}
        </div>
      </nav>
    </>
  );
}
