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

    // Optimista: si ya verificamos a este usuario antes, mostramos la app al
    // instante desde el cache local y reverificamos en segundo plano. Evita la
    // espera del cold-start de la Cloud Function en cada entrada.
    try {
      const cached = localStorage.getItem(`estadoUsuario:${user.uid}`);
      if (cached === "aprobado" || cached === "pendiente") {
        setEstadoUsuario(cached as EstadoUsuario);
      }
    } catch {}

    _verificar(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const _verificar = async (u: User) => {
    setErrorAuth(null);
    try {
      const estado = await verificarEstadoUsuario(u);
      setEstadoUsuario(estado);
      try {
        if (estado === "aprobado" || estado === "pendiente") {
          localStorage.setItem(`estadoUsuario:${u.uid}`, estado);
        } else {
          localStorage.removeItem(`estadoUsuario:${u.uid}`);
        }
      } catch {}
      if (estado === "rechazado") await signOut(auth);
    } catch (e: any) {
      console.error("Error verificando estado:", e);
      // Si ya teníamos un estado cacheado, no rompemos la sesión (la app sigue
      // usable con la persistencia offline de Firestore). Solo mostramos el error
      // cuando no hay nada cacheado (típicamente un usuario nuevo).
      let cached: string | null = null;
      try { cached = localStorage.getItem(`estadoUsuario:${u.uid}`); } catch {}
      if (!cached) setErrorAuth(e.message || "Error de conexión con el servidor");
    }
  };

  const reintentar = () => {
    if (user) _verificar(user);
  };

  return { user, estadoUsuario, loading, errorAuth, reintentar };
}
