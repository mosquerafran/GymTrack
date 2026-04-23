import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Home, BarChart2, Calendar, Settings, LogOut, Sun, Moon, Activity, ShieldCheck, UserCheck, ArrowLeftRight } from "lucide-react";
import { useState, useEffect } from "react";

const ADMIN_EMAIL = "mosquerafran265@gmail.com";

export default function Navbar({ view, setView, user, theme, toggleTheme, grupoActivo, onCambiarGrupo }) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user || !grupoActivo) return;
    const calculateStreak = async () => {
      try {
        const q = query(collection(db, "asistencias"), where("userName", "==", user.displayName), where("grupoId", "==", grupoActivo.id));
        const snap = await getDocs(q);
        const fechasSet = new Set();
        snap.forEach(doc => {
          if (doc.data().fecha) fechasSet.add(doc.data().fecha);
        });

        const fechas = Array.from(fechasSet).sort((a, b) => b.localeCompare(a));
        if (fechas.length === 0) return setStreak(0);

        let currentStreak = 0;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const formatDate = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, "0");
          const d = String(date.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        };

        const strToday = formatDate(today);
        const strYesterday = formatDate(yesterday);

        if (fechas[0] !== strToday && fechas[0] !== strYesterday) {
          return setStreak(0);
        }

        let checkDate = new Date(fechas[0] + "T12:00:00");
        for (let f of fechas) {
          if (f === formatDate(checkDate)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        setStreak(currentStreak);
      } catch(e) {
        console.error("Error al calcular racha", e);
      }
    };
    calculateStreak();
  }, [user, view, grupoActivo]);

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
    <nav className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none px-4 py-3 mb-6 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-1 sm:gap-2">
        <button 
          onClick={onCambiarGrupo} 
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-all font-bold text-sm border border-accent/20 shrink-0"
          title="Cambiar de grupo"
        >
          <ArrowLeftRight size={16} />
          <span className="hidden sm:inline max-w-[100px] truncate">{grupoActivo?.nombre || "Grupo"}</span>
        </button>

        <div className="w-px h-6 bg-borderBase mx-1"></div>

        <NavButton targetView="home" icon={Home} label="Inicio" />
        <NavButton targetView="stats" icon={BarChart2} label="Ranking" />
        <NavButton targetView="feed" icon={Activity} label="Feed" />
        <NavButton targetView="dayDetail" icon={Calendar} label="Detalle" />
        
        {user?.email === ADMIN_EMAIL && (
          <>
            <button
              onClick={() => setView("admin")}
              title="Admin"
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
                view === "admin" ? "bg-accent text-slate-900 shadow-lg shadow-accent/30" : "text-accent hover:bg-accent/10"
              }`}
            >
              <ShieldCheck size={20} />
            </button>
            <button
              onClick={() => setView("aprobaciones")}
              title="Aprobaciones"
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
                view === "aprobaciones" ? "bg-yellow-500 text-slate-900 shadow-lg" : "text-yellow-500 hover:bg-yellow-500/10"
              }`}
            >
              <UserCheck size={20} />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-500 font-bold px-2 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 animate-fade-in" title={`¡Racha de ${streak} días seguidos!`}>
            <span className="text-xl leading-none">🔥</span>
            <span className="hidden sm:inline">{streak}</span>
          </div>
        )}

        <button onClick={toggleTheme} className="flex items-center justify-center p-2 rounded-xl text-textMuted hover:text-textMain hover:bg-surfaceHighlight transition-all duration-300" title="Alternar tema">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="w-px h-6 bg-borderBase mx-1"></div>

        <button onClick={() => setView("settings")} className={`flex items-center gap-2 p-2 rounded-xl transition-all duration-300 ${view === "settings" ? "text-primary" : "text-textMuted hover:text-textMain hover:bg-surfaceHighlight"}`} title="Ajustes">
          <Settings size={20} />
        </button>

        <button onClick={logout} className="flex items-center gap-2 p-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 transition-all duration-300" title="Salir">
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}