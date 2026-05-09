import { useState, useEffect } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { verificarEstadoUsuario } from "../services/authService";
import { EstadoUsuario } from "../types";

/**
 * Hook que centraliza toda la lógica de autenticación.
 * Reemplaza la mayoría del código de App.js.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [estadoUsuario, setEstadoUsuario] = useState<EstadoUsuario>(null);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);

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

  const _verificar = async (u: User) => {
    setErrorAuth(null);
    try {
      const estado = await verificarEstadoUsuario(u);
      setEstadoUsuario(estado);
      if (estado === "rechazado") await signOut(auth);
    } catch (e: any) {
      console.error("Error verificando estado:", e);
      setErrorAuth(e.message || "Error de conexión con el servidor");
    }
  };

  const reintentar = () => {
    if (user) _verificar(user);
  };

  return { user, estadoUsuario, loading, errorAuth, reintentar };
}
