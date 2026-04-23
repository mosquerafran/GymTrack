import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { Home, BarChart2, Calendar, Settings, LogOut, Sun, Moon, ShieldCheck, UserCheck, ArrowLeftRight } from "lucide-react";
import { useState, useEffect } from "react";

const ADMIN_EMAIL = "mosquerafran265@gmail.com";

export default function Navbar({ view, setView, user, theme, toggleTheme, grupoActivo, onCambiarGrupo }) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user || !grupoActivo) return;

    const q = query(
      collection(db, "asistencias"), 
      where("userId", "==", user.uid), 
      where("grupoId", "==", grupoActivo.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      try {
        const fechasSet = new Set();
        snap.forEach(doc => {
          if (doc.data().fecha) fechasSet.add(doc.data().fecha);
        });

        const fechas = Array.from(fechasSet).sort((a, b) => b.localeCompare(a));
        if (fechas.length === 0) {
          setStreak(0);
          return;
        }

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
          setStreak(0);
          return;
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
    });

    return () => unsubscribe();
  }, [user, grupoActivo]);

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
      {/* Top Header - Always visible but different content per-platform */}
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

          <div className="hidden md:block w-px h-6 bg-borderBase mx-1"></div>

          {/* Desktop Only Main Nav */}
          <div className="hidden md:flex items-center gap-2">
            <NavButton targetView="home" icon={Home} label="Inicio" />
            <NavButton targetView="stats" icon={BarChart2} label="Ranking" />
            <NavButton targetView="dayDetail" icon={Calendar} label="Detalle" />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
          {streak > 0 && (
            <div className="flex items-center gap-1 text-orange-500 font-bold px-3 py-1.5 bg-orange-500/10 rounded-xl border border-orange-500/20 animate-float" title={`¡Racha de ${streak} días seguidos!`}>
              <span className="text-xl leading-none">🔥</span>
              <span className="inline">{streak}</span>
            </div>
          )}

          <button onClick={toggleTheme} className="flex items-center justify-center p-2 rounded-xl text-textMuted hover:text-textMain hover:bg-surfaceHighlight transition-all duration-300" title="Alternar tema">
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="w-px h-6 bg-borderBase mx-1"></div>

          <button onClick={() => setView("settings")} className={`hidden md:flex items-center gap-2 p-2 rounded-xl transition-all duration-300 ${view === "settings" ? "text-primary" : "text-textMuted hover:text-textMain hover:bg-surfaceHighlight"}`} title="Ajustes">
            <Settings size={20} />
          </button>

          {user?.email === ADMIN_EMAIL && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setView("admin")}
                title="Admin"
                className={`p-2 rounded-xl transition-all duration-300 ${view === "admin" ? "bg-accent text-slate-900" : "text-accent hover:bg-accent/10"}`}
              >
                <ShieldCheck size={20} />
              </button>
            </div>
          )}

          <button onClick={logout} className="flex items-center gap-2 p-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 transition-all duration-300" title="Salir">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <div className="glass-panel rounded-2xl flex items-center justify-around p-2 pointer-events-auto">
          <button 
            onClick={() => setView("home")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'home' ? 'text-primary' : 'text-textMuted'}`}
          >
            <Home size={24} fill={view === 'home' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>
          
          <button 
            onClick={() => setView("stats")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'stats' ? 'text-primary' : 'text-textMuted'}`}
          >
            <BarChart2 size={24} />
            <span className="text-[10px] font-bold">Ranking</span>
          </button>

          <button 
            onClick={() => setView("dayDetail")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'dayDetail' ? 'text-primary' : 'text-textMuted'}`}
          >
            <Calendar size={24} />
            <span className="text-[10px] font-bold">Detalle</span>
          </button>

          <button 
            onClick={() => setView("settings")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${view === 'settings' ? 'text-primary' : 'text-textMuted'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-bold">Ajustes</span>
          </button>
        </div>
      </div>
    </>
  );
}