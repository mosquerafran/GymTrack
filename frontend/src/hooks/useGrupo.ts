import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { cargarGrupoGuardado } from "../services/gruposService";
import { Grupo, EstadoUsuario } from "../types";

/**
 * Hook que centraliza la gestión del grupo activo.
 */
export function useGrupo(user: User | null, estadoUsuario: EstadoUsuario) {
  const [grupoActivo, setGrupoActivo] = useState<Grupo | null>(null);
  const [cargandoGrupo, setCargandoGrupo] = useState<boolean>(false);

  // Cargar grupo guardado cuando el usuario está aprobado
  useEffect(() => {
    if (!user || !user.email || estadoUsuario !== "aprobado") return;

    const cargar = async () => {
      setCargandoGrupo(true);
      try {
        const grupo = await cargarGrupoGuardado(user.email!);
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

  const seleccionarGrupo = useCallback((grupo: Grupo) => {
    setGrupoActivo(grupo);
    localStorage.setItem("grupoActivo", grupo.id);
  }, []);

  const cambiarGrupo = useCallback(() => {
    setGrupoActivo(null);
    localStorage.removeItem("grupoActivo");
  }, []);

  return { grupoActivo, seleccionarGrupo, cambiarGrupo, cargandoGrupo };
}
