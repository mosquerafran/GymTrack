import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { signOut, User } from "firebase/auth";
import { Users, Plus, KeyRound, LogOut, Sun, Moon, Copy, Check, ShieldCheck } from "lucide-react";
import Swal from "sweetalert2";
import { cargarGruposDeUsuario, crearGrupo, unirseConCodigo } from "../services/gruposService";
import { Grupo } from "../types";

interface GrupoSelectorProps {
  user: User;
  onSelectGrupo: (grupo: Grupo) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export default function GrupoSelector({ user, onSelectGrupo, theme, toggleTheme }: GrupoSelectorProps): React.ReactElement {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modo, setModo] = useState<"lista" | "crear" | "unirse">("lista");
  const [nombreNuevo, setNombreNuevo] = useState<string>("");
  const [codigoInput, setCodigoInput] = useState<string>("");

  useEffect(() => {
    cargar();
  }, [user]);

  const cargar = async () => {
    setLoading(true);
    try {
      const lista = await cargarGruposDeUsuario(user);
      setGrupos(lista);
    } catch (e) {
      console.error("Error cargando grupos:", e);
    }
    setLoading(false);
  };

  const handleCrearGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !user.email) return;
    try {
      await crearGrupo(nombreNuevo, user.email);
      Swal.fire({
        title: "¡Grupo Creado! 🎉",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        background: "var(--color-surface)",
        color: "var(--color-text-main)",
      });
      setNombreNuevo("");
      setModo("lista");
      cargar();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnirse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput.trim() || !user.email) return;
    try {
      await unirseConCodigo(codigoInput, user.email);
      Swal.fire({
        title: `¡Te uniste! 💪`,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        background: "var(--color-surface)",
        color: "var(--color-text-main)",
      });
      setCodigoInput("");
      setModo("lista");
      cargar();
    } catch (e: any) {
      Swal.fire({
        title: e.message || "Error",
        icon: "error",
        background: "var(--color-surface)",
        color: "var(--color-text-main)",
      });
    }
  };

  const CodigoCopiable = ({ codigo }: { codigo: string }) => {
    const [copiado, setCopiado] = useState(false);
    const copiar = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    };
    return (
      <button
        onClick={copiar}
        className="flex items-center gap-1.5 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/20 transition-all font-mono"
        title="Copiar código"
      >
        {copiado ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
        <span>{codigo}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Header Navigation */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
        <button onClick={toggleTheme} className="p-3 rounded-2xl bg-surface/50 backdrop-blur-sm border border-borderBase text-textMuted hover:text-textMain hover:border-primary/50 transition-all shadow-sm">
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={() => signOut(auth)} className="p-3 rounded-2xl bg-red-500/5 backdrop-blur-sm border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Salir">
          <LogOut size={20} />
        </button>
      </div>

      <div className="w-full max-w-2xl relative z-20 animate-fade-in px-2">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold mb-4 border border-primary/20">
            <Users size={14} /> MULTI-TENANT SYSTEM
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-textMain mb-3 tracking-tight">
            Elegí tu grupo <span className="text-primary italic">Fitness</span>
          </h1>
          <p className="text-textMuted text-lg">
            Hola <span className="text-textMain font-bold underline decoration-primary/40 underline-offset-4">{user.displayName}</span>, ¿qué equipo te acompaña hoy?
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
            <p className="text-textMuted font-medium animate-pulse">Cargando tus grupos...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode Selector Tabs */}
            <div className="flex bg-surface/50 backdrop-blur-md p-1.5 rounded-2xl border border-borderBase shadow-sm mb-2">
              {[
                { id: "lista", icon: <Users size={18} />, label: "Mis Grupos" },
                { id: "crear", icon: <Plus size={18} />, label: "Crear" },
                { id: "unirse", icon: <KeyRound size={18} />, label: "Unirme" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModo(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${modo === tab.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-textMuted hover:text-textMain"}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[300px]">
              {/* Lista de grupos */}
              {modo === "lista" && (
                <div className="space-y-4 animate-slide-up">
                  {grupos.length === 0 ? (
                    <div className="glass-panel p-12 text-center">
                      <div className="w-20 h-20 bg-surfaceHighlight rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-borderBase">
                        <Users size={40} className="text-textMuted" />
                      </div>
                      <h3 className="text-xl font-bold text-textMain mb-2">No tenés grupos todavía</h3>
                      <p className="text-textMuted mb-8 max-w-xs mx-auto">Comenzá creando un grupo nuevo o pedile el código a un amigo para unirte.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => setModo("crear")} className="btn-primary">Crear mi primer grupo</button>
                        <button onClick={() => setModo("unirse")} className="btn-secondary">Unirme a uno</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {grupos.map((g, i) => (
                        <button
                          key={g.id}
                          onClick={() => onSelectGrupo(g)}
                          className="glass-panel p-6 text-left group hover:border-primary hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 flex flex-col relative overflow-hidden"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                          <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-inner">
                              {g.nombre.includes("Miller") ? "🏢" : "💪"}
                            </div>
                            <CodigoCopiable codigo={g.codigoInvitacion} />
                          </div>
                          <div className="relative z-10">
                            <h3 className="text-xl font-black text-textMain mb-1 group-hover:text-primary transition-colors tracking-tight">{g.nombre}</h3>
                            <div className="flex items-center gap-4 text-textMuted text-sm font-medium">
                              <span className="flex items-center gap-1.5 bg-surfaceHighlight/50 px-2 py-1 rounded-lg border border-borderBase">
                                <Users size={14} className="text-primary" /> {g.miembros?.length || 0} miembros
                              </span>
                              {g.adminEmail === user.email && (
                                <span className="flex items-center gap-1.5 text-accent font-bold uppercase text-[10px] tracking-wider">
                                  <ShieldCheck size={12} /> Propietario
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-6 flex items-center justify-between text-primary font-bold text-sm group-hover:translate-x-2 transition-transform duration-300 relative z-10">
                            Entrar al grupo <Plus size={16} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Crear grupo */}
              {modo === "crear" && (
                <div className="glass-panel p-8 md:p-10 animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Plus size={24} /></div>
                    <div>
                      <h2 className="text-2xl font-black text-textMain tracking-tight">Crear Grupo Nuevo</h2>
                      <p className="text-textMuted text-sm">Convertite en el admin de un nuevo equipo</p>
                    </div>
                  </div>
                  <form onSubmit={handleCrearGrupo} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-textMain mb-2 ml-1">Nombre del Equipo</label>
                      <input type="text" placeholder="Ej: Los Pibes de Miller, Strong Team..." className="input-field text-lg" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} required autoFocus />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="submit" className="btn-primary flex-[2] py-4 text-lg">Confirmar Creación</button>
                      <button type="button" onClick={() => setModo("lista")} className="btn-secondary flex-1 py-4">Volver</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Unirse con código */}
              {modo === "unirse" && (
                <div className="glass-panel p-8 md:p-10 animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-accent" />
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent"><KeyRound size={24} /></div>
                    <div>
                      <h2 className="text-2xl font-black text-textMain tracking-tight">Unirse con Código</h2>
                      <p className="text-textMuted text-sm">Ingresá el código que te pasó tu amigo</p>
                    </div>
                  </div>
                  <form onSubmit={handleUnirse} className="space-y-6 text-center">
                    <div>
                      <label className="block text-sm font-bold text-textMain mb-4">Código de Invitación</label>
                      <input type="text" placeholder="GYM-XXXX" className="input-field text-center font-black text-3xl tracking-[0.2em] uppercase py-6 border-dashed border-2 focus:border-accent focus:ring-accent/20" value={codigoInput} onChange={(e) => setCodigoInput(e.target.value)} required autoFocus maxLength={8} />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button type="submit" className="btn-accent flex-[2] py-4 text-lg !text-slate-900">Unirse al Equipo</button>
                      <button type="button" onClick={() => setModo("lista")} className="btn-secondary flex-1 py-4">Volver</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center mt-12 text-textMuted text-xs font-medium tracking-widest uppercase">
          Gym Tracker v3.0 • Clean Architecture
        </p>
      </div>
    </div>
  );
}
