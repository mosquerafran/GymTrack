import { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { verificarEstadoUsuario } from "../services/authService";

/**
 * Hook que centraliza toda la lógica de autenticación.
 * Reemplaza la mayoría del código de App.js.
 *
 * @returns {{ user, estadoUsuario, loading, errorAuth, reintentar }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadoUsuario, setEstadoUsuario] = useState(null); // null | "aprobado" | "pendiente" | "rechazado"
  const [errorAuth, setErrorAuth] = useState(null);

  // Listener de Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setEstadoUsuario(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Verificar estado cuando cambia el usuario
  useEffect(() => {
    if (!user) return;
    _verificar(user);
  }, [user]);

  const _verificar = async (u) => {
    setErrorAuth(null);
    try {
      const estado = await verificarEstadoUsuario(u);
      setEstadoUsuario(estado);
      if (estado === "rechazado") await signOut(auth);
    } catch (e) {
      console.error("Error verificando estado:", e);
      setErrorAuth(e.message || "Error de conexión con el servidor");
    }
  };

  const reintentar = () => {
    if (user) _verificar(user);
  };

  return { user, estadoUsuario, loading, errorAuth, reintentar };
}
