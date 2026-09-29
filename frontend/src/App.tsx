import React, { useState, Suspense, lazy } from "react";

import { useAuth } from "./hooks/useAuth";
import { useGrupo } from "./hooks/useGrupo";
import { useTheme } from "./hooks/useTheme";
import { useVistaConHistorial } from "./hooks/useHistorial";
import { cerrarSesion } from "./services/authService";

import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Hoja from "./components/ui/Hoja";
import { Spinner } from "./components/ui/Estados";
import { TriangleAlert } from "lucide-react";
import { Asistencia, Grupo } from "./types";
import { formatDateLocal, parseFechaLocal } from "./utils/date";

// Lazy Loading
const Stats = lazy(() => import("./pages/Stats"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Aprobaciones = lazy(() => import("./pages/Aprobaciones"));
const GrupoSelector = lazy(() => import("./pages/GrupoSelector"));
const Feed = lazy(() => import("./pages/Feed"));
const TrainingSelector = lazy(() => import("./components/TrainingSelector"));
const DetalleDia = lazy(() => import("./components/DetalleDia"));

const PantallaCentrada = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 pt-safe">{children}</div>
);

const fechaCorta = (f: Date) =>
  f.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).replace(".", "");

export default function App(): React.ReactElement {
  const { user, estadoUsuario, loading, errorAuth, reintentar } = useAuth();
  const { grupoActivo, seleccionarGrupo, cambiarGrupo } = useGrupo(user, estadoUsuario);
  const { theme, toggleTheme } = useTheme();
  const [view, irA] = useVistaConHistorial("home");

  // Paneles: registrar/editar un entreno y el detalle de un día (se pueden apilar).
  const [registro, setRegistro] = useState<{ fecha: Date; editar?: Asistencia } | null>(null);
  const [diaAbierto, setDiaAbierto] = useState<Date | null>(null);
  // Cambia cada vez que se guarda o borra un entreno: Inicio y el detalle se recargan.
  const [refresco, setRefresco] = useState(0);
  const huboCambios = () => setRefresco((n) => n + 1);

  const handleSeleccionarGrupo = (grupo: Grupo) => {
    seleccionarGrupo(grupo);
    irA("home");
  };

  // ── Cargando ───────────────────────────────────────────────────────────────
  if (loading) return <PantallaCentrada><Spinner grande /></PantallaCentrada>;

  // ── No logueado ────────────────────────────────────────────────────────────
  if (!user) return <Login />;

  // ── Error de auth / verificando ────────────────────────────────────────────
  if (estadoUsuario === null) return (
    <PantallaCentrada>
      {errorAuth ? (
        <div className="glass-panel p-8 max-w-sm w-full text-center animate-slide-up space-y-4">
          <TriangleAlert size={40} className="mx-auto text-primary" aria-hidden="true" />
          <h2 className="font-heading text-xl uppercase tracking-wide">Error de conexión</h2>
          <p className="text-textMuted text-sm">{errorAuth}</p>
          <div className="space-y-2">
            <button className="btn-primary w-full" onClick={reintentar}>Reintentar</button>
            <button className="btn-secondary w-full" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </div>
      ) : (
        <>
          <Spinner grande />
          <p className="text-textMuted mt-4" aria-live="polite">Verificando acceso…</p>
        </>
      )}
    </PantallaCentrada>
  );

  // ── Pendiente de aprobación ────────────────────────────────────────────────
  if (estadoUsuario === "pendiente") return (
    <PantallaCentrada>
      <div className="glass-panel p-8 max-w-md w-full text-center animate-slide-up space-y-4">
        <span className="text-5xl" aria-hidden="true">⏳</span>
        <h1 className="font-heading text-2xl uppercase tracking-wide">Solicitud enviada</h1>
        <p className="text-textMuted">
          ¡Hola <span className="text-textMain font-semibold">{user.displayName}</span>! El administrador tiene
          que aprobarte. Cuando lo haga, vas a poder entrar.
        </p>
        <button className="btn-secondary w-full" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </PantallaCentrada>
  );

  // ── Selector de grupo ──────────────────────────────────────────────────────
  if (estadoUsuario === "aprobado" && !grupoActivo) return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<PantallaCentrada><Spinner /></PantallaCentrada>}>
        <GrupoSelector user={user} onSelectGrupo={handleSeleccionarGrupo} theme={theme} toggleTheme={toggleTheme} />
      </Suspense>
    </div>
  );

  const grupoId = grupoActivo?.id || "";
  const registrar = (fecha: Date) => setRegistro({ fecha });

  // ── App principal ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28 md:pb-12 max-w-5xl mx-auto">
      <Navbar
        view={view} irA={irA}
        onRegistrar={() => registrar(new Date())}
        user={user}
        theme={theme} toggleTheme={toggleTheme}
        grupoActivo={grupoActivo} onCambiarGrupo={cambiarGrupo}
      />

      <main className="px-4 md:px-8 relative min-h-[60vh]">
        <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
          {view === "home" && (
            <Home user={user} grupoId={grupoId} onRegistrar={registrar} onAbrirDia={setDiaAbierto} refresco={refresco} />
          )}
          {view === "feed" && <Feed grupoId={grupoId} refresco={refresco} />}
          {view === "stats" && <Stats user={user} grupoId={grupoId} />}
          {view === "settings" && <Settings user={user} grupoActivo={grupoActivo} irA={irA} onCambiarGrupo={cambiarGrupo} />}
          {view === "admin" && <Admin user={user} grupoActivo={grupoActivo!} setView={irA} />}
          {view === "aprobaciones" && <Aprobaciones user={user} />}
        </Suspense>
      </main>

      {/* Detalle de un día (desde el calendario o "Hoy ya entrenaste") */}
      <Hoja
        abierta={!!diaAbierto}
        onCerrar={() => setDiaAbierto(null)}
        titulo={diaAbierto ? diaAbierto.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) : ""}
      >
        {diaAbierto && (
          <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
            <DetalleDia
              user={user}
              grupoId={grupoId}
              fecha={diaAbierto}
              refresco={refresco}
              onCambio={huboCambios}
              onEditar={(a) => setRegistro({ fecha: diaAbierto, editar: a })}
              onRegistrar={registrar}
            />
          </Suspense>
        )}
      </Hoja>

      {/* Registrar / editar (pantalla completa, arriba del detalle si está abierto) */}
      <Hoja
        abierta={!!registro}
        onCerrar={() => setRegistro(null)}
        titulo={registro?.editar ? "Editar entreno" : "Registrar"}
        completa
        barraPropia
        accion={registro && (registro.editar ? (
          <span className="font-heading text-sm uppercase tracking-wide px-3 py-2 rounded-xl border border-borderBase bg-background whitespace-nowrap">
            {fechaCorta(registro.fecha)}
          </span>
        ) : (
          // Tocar la fecha abre el calendario del celu: se puede cargar un día anterior (nunca a futuro).
          <label className="relative font-heading text-sm uppercase tracking-wide min-h-tap flex items-center gap-1 px-3 border-2 border-textMain text-textMain bg-background whitespace-nowrap cursor-pointer">
            {fechaCorta(registro.fecha)} ▾
            <input
              type="date"
              aria-label="Fecha del entreno"
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={formatDateLocal(registro.fecha)}
              max={formatDateLocal(new Date())}
              onChange={(e) => {
                const v = e.target.value;
                if (v && v <= formatDateLocal(new Date())) setRegistro({ fecha: parseFechaLocal(v) });
              }}
            />
          </label>
        ))}
      >
        {registro && (
          <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
            <TrainingSelector
              enHoja
              fecha={registro.fecha}
              user={user}
              grupoId={grupoId}
              asistenciaAEditar={registro.editar || null}
              onCancelar={() => setRegistro(null)}
              onCompletado={() => { setRegistro(null); huboCambios(); }}
            />
          </Suspense>
        )}
      </Hoja>
    </div>
  );
}
