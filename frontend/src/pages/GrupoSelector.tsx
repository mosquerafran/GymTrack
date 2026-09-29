import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { Users, Plus, KeyRound, LogOut, Sun, Moon, ShieldCheck, ChevronRight, Building2, Dumbbell } from "lucide-react";
import CodigoCopiable from "../components/CodigoCopiable";
import Logo from "../components/Logo";
import { cargarGruposDeUsuario, crearGrupo, unirseConCodigo } from "../services/gruposService";
import { cerrarSesion } from "../services/authService";
import { Alerta } from "../config/alertas";
import { Cargando, ErrorCarga } from "../components/ui/Estados";
import { Grupo } from "../types";

interface GrupoSelectorProps {
  user: User;
  onSelectGrupo: (grupo: Grupo) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

type Modo = "lista" | "crear" | "unirse";

export default function GrupoSelector({ user, onSelectGrupo, theme, toggleTheme }: GrupoSelectorProps): React.ReactElement {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [modo, setModo] = useState<Modo>("lista");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [codigoInput, setCodigoInput] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cargar = async () => {
    setEstado("cargando");
    try {
      const lista = await cargarGruposDeUsuario(user);
      setGrupos(lista);
      setEstado("listo");
      if (lista.length === 0) setModo("unirse");
    } catch (e) {
      console.error("Error cargando grupos:", e);
      setEstado("error");
    }
  };

  const handleCrearGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !user.email || enviando) return;
    setEnviando(true);
    try {
      await crearGrupo(nombreNuevo);
      setNombreNuevo("");
      setModo("lista");
      await cargar();
    } catch (err) {
      console.error(err);
      Alerta.fire({ titleText: "No se pudo crear el grupo", text: err instanceof Error ? err.message : "Revisá la conexión y probá de nuevo.", icon: "error", confirmButtonText: "Entendido" });
    }
    setEnviando(false);
  };

  const handleUnirse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput.trim() || !user.email || enviando) return;
    setEnviando(true);
    try {
      await unirseConCodigo(codigoInput);
      setCodigoInput("");
      setModo("lista");
      await cargar();
    } catch (err) {
      Alerta.fire({
        titleText: "No te pudiste unir",
        text: err instanceof Error ? err.message : "Revisá el código y probá de nuevo.",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    }
    setEnviando(false);
  };

  const pestanas: { id: Modo; icono: React.ReactNode; label: string }[] = [
    { id: "lista", icono: <Users size={18} aria-hidden="true" />, label: "Mis grupos" },
    { id: "unirse", icono: <KeyRound size={18} aria-hidden="true" />, label: "Unirme" },
    { id: "crear", icono: <Plus size={18} aria-hidden="true" />, label: "Crear" },
  ];

  return (
    <div className="min-h-screen bg-background pt-safe">
      <header className="flex items-center gap-1 px-3 py-2">
        <Logo className="w-11 h-auto text-textMain mr-auto ml-1" />
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-icon text-textMuted"
          aria-label={theme === "dark" ? "Pasar a modo claro" : "Pasar a modo oscuro"}
        >
          {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        <button type="button" onClick={cerrarSesion} className="btn-icon text-red-600 dark:text-red-400" aria-label="Cerrar sesión">
          <LogOut size={22} />
        </button>
      </header>

      <main className="w-full max-w-xl mx-auto px-4 pb-10 space-y-6 animate-fade-in">
        <div>
          <p className="eyebrow">Hola, {(user.displayName || "").split(" ")[0] || "crack"}</p>
          <h1 className="font-display text-5xl uppercase leading-none mt-1">
            Elegí tu <span className="text-primary">grupo</span>
          </h1>
        </div>

        {estado === "cargando" ? (
          <Cargando texto="Cargando tus grupos…" />
        ) : estado === "error" ? (
          <ErrorCarga texto="No se pudieron cargar tus grupos" onReintentar={cargar} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1 bg-surfaceHighlight p-1 rounded-2xl" role="tablist" aria-label="Qué querés hacer">
              {pestanas.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={modo === t.id}
                  onClick={() => setModo(t.id)}
                  className={`flex items-center justify-center gap-1.5 min-h-tap rounded-xl font-semibold text-sm transition-colors ${modo === t.id ? "bg-textMain text-background" : "text-textMuted"}`}
                >
                  {t.icono} {t.label}
                </button>
              ))}
            </div>

            {modo === "lista" && (
              grupos.length === 0 ? (
                <div className="glass-panel p-8 text-center space-y-4">
                  <Users size={36} className="text-accent mx-auto" aria-hidden="true" />
                  <p className="font-heading text-lg uppercase tracking-wide">No tenés grupos todavía</p>
                  <p className="text-sm text-textMuted">Pedile el código a un amigo para unirte, o creá uno nuevo.</p>
                  <div className="grid gap-2">
                    <button type="button" onClick={() => setModo("unirse")} className="btn-primary">Unirme con un código</button>
                    <button type="button" onClick={() => setModo("crear")} className="btn-secondary">Crear un grupo</button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {grupos.map((g) => (
                    <li key={g.id} className="glass-panel p-4 space-y-3">
                      <button type="button" onClick={() => onSelectGrupo(g)} className="w-full flex items-center gap-3 text-left min-h-tap">
                        <span className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center text-2xl shrink-0" aria-hidden="true">
                          {g.nombre.includes("Miller") ? <Building2 size={22} /> : <Dumbbell size={22} />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-heading text-lg uppercase tracking-wide truncate">{g.nombre}</span>
                          <span className="flex items-center gap-3 text-sm text-textMuted">
                            <span className="flex items-center gap-1"><Users size={14} aria-hidden="true" /> {g.miembros?.length || 0} miembros</span>
                            {g.adminEmail === user.email && (
                              <span className="flex items-center gap-1 text-accent font-semibold"><ShieldCheck size={14} aria-hidden="true" /> Sos admin</span>
                            )}
                          </span>
                        </span>
                        <ChevronRight size={22} className="text-textMain shrink-0" aria-hidden="true" />
                      </button>
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-borderBase">
                        <span className="text-sm text-textMuted">Código para invitar</span>
                        <CodigoCopiable codigo={g.codigoInvitacion} />
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            {modo === "crear" && (
              <form onSubmit={handleCrearGrupo} className="glass-panel p-5 space-y-4">
                <div>
                  <h2 className="font-heading text-xl uppercase tracking-wide">Crear un grupo</h2>
                  <p className="text-sm text-textMuted">Vas a ser el admin y vas a poder invitar con un código.</p>
                </div>
                <label className="block">
                  <span className="block text-sm font-semibold mb-2">Nombre del grupo</span>
                  <input
                    type="text"
                    placeholder="Ej: Los del gym de la esquina"
                    className="input-field"
                    value={nombreNuevo}
                    maxLength={60}
                    onChange={(e) => setNombreNuevo(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="btn-primary w-full" disabled={enviando}>
                  {enviando ? "Creando…" : "Crear grupo"}
                </button>
              </form>
            )}

            {modo === "unirse" && (
              <form onSubmit={handleUnirse} className="glass-panel p-5 space-y-4">
                <div>
                  <h2 className="font-heading text-xl uppercase tracking-wide">Unirme con un código</h2>
                  <p className="text-sm text-textMuted">Pedíselo a alguien del grupo: está en su pantalla de Ajustes.</p>
                </div>
                <label className="block">
                  <span className="block text-sm font-semibold mb-2">Código de invitación</span>
                  <input
                    type="text"
                    placeholder="GYM-XXXX"
                    className="input-field text-center font-heading text-3xl tracking-[0.2em] uppercase"
                    value={codigoInput}
                    onChange={(e) => setCodigoInput(e.target.value)}
                    required
                    maxLength={8}
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
                <button type="submit" className="btn-accent w-full" disabled={enviando}>
                  {enviando ? "Uniéndote…" : "Unirme al grupo"}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
