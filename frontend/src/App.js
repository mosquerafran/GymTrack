import { useState, Suspense, lazy } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./config/firebase";

import { useAuth } from "./hooks/useAuth";
import { useGrupo } from "./hooks/useGrupo";
import { useTheme } from "./hooks/useTheme";

import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

// Lazy Loading
const Stats = lazy(() => import("./pages/Stats"));
const Settings = lazy(() => import("./pages/Settings"));
const DiaDetalle = lazy(() => import("./pages/DiaDetalle"));
const Admin = lazy(() => import("./pages/Admin"));
const Aprobaciones = lazy(() => import("./pages/Aprobaciones"));
const GrupoSelector = lazy(() => import("./pages/GrupoSelector"));

const Spinner = ({ size = "large" }) => (
  <div className={`animate-spin rounded-full border-t-4 border-b-4 border-primary ${size === "large" ? "h-16 w-16" : "h-12 w-12"}`} />
);

export default function App() {
  const { user, estadoUsuario, loading, errorAuth, reintentar } = useAuth();
  const { grupoActivo, seleccionarGrupo, cambiarGrupo } = useGrupo(user, estadoUsuario);
  const { theme, toggleTheme } = useTheme();

  const [view, setView] = useState("home");
  const [fecha, setFecha] = useState(new Date());
  const [fechaDetalle, setFechaDetalle] = useState(null);

  const abrirDetalle = (fecha) => {
    setFechaDetalle(fecha);
    setView("dayDetail");
  };

  const handleSeleccionarGrupo = (grupo) => {
    seleccionarGrupo(grupo);
    setView("home");
  };

  // ── Cargando ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
      <Spinner size="large" />
    </div>
  );

  // ── No logueado ────────────────────────────────────────────────────────────
  if (!user) return <Login />;

  // ── Error de auth / verificando ────────────────────────────────────────────
  if (estadoUsuario === null) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {errorAuth ? (
        <div className="glass-panel p-8 max-w-sm w-full text-center animate-slide-up border-red-500/30">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-textMain mb-2">Error de Conexión</h2>
          <p className="text-textMuted mb-6 text-sm">{errorAuth}</p>
          <div className="space-y-3">
            <button className="btn-primary w-full py-2" onClick={reintentar}>Reintentar</button>
            <button className="btn-secondary w-full py-2" onClick={() => signOut(auth)}>Cerrar Sesión</button>
          </div>
        </div>
      ) : (
        <>
          <Spinner size="large" />
          <p className="text-textMuted animate-pulse mt-4">Verificando acceso...</p>
        </>
      )}
    </div>
  );

  // ── Pendiente de aprobación ────────────────────────────────────────────────
  if (estadoUsuario === "pendiente") return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="glass-panel p-8 md:p-12 max-w-md w-full text-center animate-slide-up">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-2xl font-bold text-textMain mb-3">Solicitud Enviada</h1>
        <p className="text-textMuted mb-6">
          ¡Hola <span className="text-textMain font-semibold">{user.displayName}</span>! 
          Tu solicitud fue enviada al administrador. Cuando te aprueben, podrás entrar.
        </p>
        <button className="btn-secondary w-full py-3" onClick={() => signOut(auth)}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  // ── Selector de grupo ──────────────────────────────────────────────────────
  if (estadoUsuario === "aprobado" && !grupoActivo) return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>
        <GrupoSelector
          user={user}
          onSelectGrupo={handleSeleccionarGrupo}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </Suspense>
    </div>
  );

  // ── App principal ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-28 md:pb-20 max-w-5xl mx-auto transition-colors duration-300">
      <Navbar
        view={view} setView={setView}
        user={user}
        theme={theme} toggleTheme={toggleTheme}
        grupoActivo={grupoActivo} onCambiarGrupo={cambiarGrupo}
      />

      <main className="px-4 md:px-8 animate-fade-in relative min-h-[60vh]">
        <Suspense fallback={
          <div className="absolute inset-0 flex justify-center items-center">
            <Spinner />
          </div>
        }>
          {view === "home" && (
            <Home
              user={user} fecha={fecha} setFecha={setFecha}
              abrirDetalle={abrirDetalle} grupoId={grupoActivo?.id} theme={theme}
            />
          )}
          {view === "stats" && <Stats user={user} grupoId={grupoActivo?.id} />}
          {view === "settings" && <Settings user={user} />}
          {view === "admin" && <Admin user={user} grupoActivo={grupoActivo} setView={setView} />}
          {view === "aprobaciones" && <Aprobaciones user={user} />}
          {view === "dayDetail" && <DiaDetalle fecha={fechaDetalle} user={user} grupoId={grupoActivo?.id} />}
        </Suspense>
      </main>
    </div>
  );
}
