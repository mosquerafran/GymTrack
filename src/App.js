import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import Login from "./components/Login";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import DiaDetalle from "./pages/DiaDetalle"; // 👈 FALTABA ESTO

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date());
  const [view, setView] = useState("home");
  const [fechaDetalle, setFechaDetalle] = useState(null);

  // 🔥 Escuchar sesión Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 👉 abrir pantalla detalle día
  const abrirDetalle = (fecha) => {
    console.log("📅 Abriendo detalle:", fecha);
    setFechaDetalle(fecha);
    setView("detalleDia");
  };

  // ⏳ Esperando respuesta de Firebase
  if (loading) return <p>Cargando sesión...</p>;

  // 🔐 No logueado
  if (!user) return <Login />;

  return (
    <div>
      <Navbar view={view} setView={setView} user={user} />

      {view === "home" && (
        <Home
          user={user}
          fecha={fecha}
          setFecha={setFecha}
          abrirDetalle={abrirDetalle}
        />
      )}

      {view === "stats" && <Stats user={user} />}
      {view === "settings" && <Settings user={user} />}

      {view === "dayDetail" && (
        <DiaDetalle fecha={fechaDetalle} user={user} />
      )}
    </div>
  );
}