import { useState, useEffect, useCallback } from "react";
import { cargarGrupoGuardado } from "../services/gruposService";

/**
 * Hook que centraliza la gestión del grupo activo.
 *
 * @param {object|null} user - Usuario de Firebase Auth
 * @param {string} estadoUsuario - Estado de acceso del usuario
 * @returns {{ grupoActivo, seleccionarGrupo, cambiarGrupo, cargandoGrupo }}
 */
export function useGrupo(user, estadoUsuario) {
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [cargandoGrupo, setCargandoGrupo] = useState(false);

  // Cargar grupo guardado cuando el usuario está aprobado
  useEffect(() => {
    if (!user || estadoUsuario !== "aprobado") return;

    const cargar = async () => {
      setCargandoGrupo(true);
      try {
        const grupo = await cargarGrupoGuardado(user.email);
        setGrupoActivo(grupo);
      } catch (e) {
        console.error("Error cargando grupo guardado:", e);
      }
      setCargandoGrupo(false);
    };

    cargar();
  }, [user, estadoUsuario]);

  // Limpiar grupo cuando el usuario se desloguea
  useEffect(() => {
    if (!user) setGrupoActivo(null);
  }, [user]);

  const seleccionarGrupo = useCallback((grupo) => {
    setGrupoActivo(grupo);
    localStorage.setItem("grupoActivo", grupo.id);
  }, []);

  const cambiarGrupo = useCallback(() => {
    setGrupoActivo(null);
    localStorage.removeItem("grupoActivo");
  }, []);

  return { grupoActivo, seleccionarGrupo, cambiarGrupo, cargandoGrupo };
}
