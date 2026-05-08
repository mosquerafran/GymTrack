import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import { Home, BarChart2, Calendar, Settings, LogOut, Sun, Moon, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { useStreak } from "../hooks/useStreak";
import { ADMIN_EMAIL } from "../config/constants";

export default function Navbar({ view, setView, user, theme, toggleTheme, grupoActivo, onCambiarGrupo }) {
  const streak = useStreak(user, grupoActivo);

  const logout = async () => { await signOut(auth); };

  const NavButton = ({ targetView, icon: Icon, label }) => (
    <button
      onClick={() => setView(targetView)}
      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
        view === targetView
          ? "bg-primary text-white shadow-lg shadow-primary/30"
          : "text-textMuted hover:text-textMain hover:bg-surfaceHighlight"
      }`}
      title={label}
    >
      <Icon size={20} />
      <span className={`${view === targetView ? "inline" : "hidden"} xl:inline text-sm md:text-base`}>{label}</span>
    </button>
  );

  return (
    <>
      {/* Top Header */}
      <nav className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none px-4 py-3 mb-6 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onCambiarGrupo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-all font-bold text-sm border border-accent/20 shrink-0"
            title="Cambiar de grupo"
          >
            <ArrowLeftRight size={16} />
            <span className="max-w-[120px] truncate">{grupoActivo?.nombre || "Grupo"}</span>
          </button>

          <div className="hidden md:block w-px h-6 bg-borderBase mx-1" />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <NavButton targetView="home" icon={Home} label="Inicio" />
            <NavButton targetView="stats" icon={BarChart2} label="Ranking" />
            <NavButton targetView="dayDetail" icon={Calendar} label="Detalle" />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
          {streak > 0 && (
            <div
              className="flex items-center gap-1 text-orange-500 font-bold px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 animate-float"
              title={`¡Racha de ${streak} días seguidos!`}
            >
              <span className="text-xl leading-none">🔥</span>
              <span className="inline">{streak}</span>
            </div>
          )}

          <button onClick={toggleTheme} className="flex items-center justify-center p-2 rounded-xl text-textMuted hover:text-textMain hover:bg-surfaceHighlight transition-all duration-300" title="Alternar tema">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="w-px h-6 bg-borderBase mx-1" />

          <button
            onClick={() => setView("settings")}
            className={`hidden md:flex items-center gap-2 p-2 rounded-xl transition-all duration-300 ${view === "settings" ? "text-primary" : "text-textMuted hover:text-textMain hover:bg-surfaceHighlight"}`}
            title="Ajustes"
          >
            <Settings size={20} />
          </button>

          {user?.email === ADMIN_EMAIL && (
            <button
              onClick={() => setView("admin")}
              title="Admin"
              className={`p-2 rounded-xl transition-all duration-300 ${view === "admin" ? "bg-accent text-slate-900" : "text-accent hover:bg-accent/10"}`}
            >
              <ShieldCheck size={20} />
            </button>
          )}

          <button onClick={logout} className="flex items-center gap-2 p-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 transition-all duration-300" title="Salir">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <div className="glass-panel rounded-2xl flex items-center justify-around p-2 pointer-events-auto">
          {[
            { view: "home", icon: Home, label: "Inicio" },
            { view: "stats", icon: BarChart2, label: "Ranking" },
            { view: "dayDetail", icon: Calendar, label: "Detalle" },
            { view: "settings", icon: Settings, label: "Ajustes" },
          ].map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === item.view ? "text-primary" : "text-textMuted"}`}
            >
              <item.icon size={24} fill={item.view === "home" && view === "home" ? "currentColor" : "none"} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
