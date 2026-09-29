import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Integración con el botón/gesto "atrás" del celu (Android sobre todo): sin esto, "atrás"
 * cierra la app entera, porque la navegación es un estado de React y no una URL.
 *
 * El estado del historial guarda { vista, hojas: string[] }:
 *  - cambiar de vista → pushState; "atrás" vuelve a la vista anterior.
 *  - abrir una hoja (panel inferior) → pushState con su id; "atrás" la cierra.
 */

interface EstadoHistorial {
  vista?: string;
  hojas?: string[];
}

const estadoActual = (): EstadoHistorial => (window.history.state as EstadoHistorial) || {};

/** Vista actual sincronizada con el historial del navegador. */
export function useVistaConHistorial(inicial: string): [string, (v: string) => void] {
  const [vista, setVista] = useState<string>(() => estadoActual().vista || inicial);

  useEffect(() => {
    if (!estadoActual().vista) window.history.replaceState({ ...estadoActual(), vista, hojas: [] }, "");
    const alVolver = (e: PopStateEvent) => setVista((e.state as EstadoHistorial)?.vista || inicial);
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const irA = useCallback((nueva: string) => {
    setVista((actual) => {
      if (nueva !== actual) window.history.pushState({ vista: nueva, hojas: [] }, "");
      return nueva;
    });
    window.scrollTo({ top: 0 });
  }, []);

  return [vista, irA];
}

/**
 * Mientras `abierta` sea true, "atrás" llama a `onCerrar` (y no navega). Si se cierra desde la
 * UI, se saca la entrada del historial para que el próximo "atrás" haga lo esperado.
 * Soporta hojas anidadas (detalle del día → editar): cada una se identifica por su id.
 */
export function useCerrarConAtras(abierta: boolean, onCerrar: () => void): void {
  const cerrarRef = useRef(onCerrar);
  cerrarRef.current = onCerrar;

  useEffect(() => {
    if (!abierta) return;
    const id = Math.random().toString(36).slice(2);
    const previo = estadoActual();
    window.history.pushState({ ...previo, hojas: [...(previo.hojas || []), id] }, "");

    const alVolver = (e: PopStateEvent) => {
      const hojas = (e.state as EstadoHistorial)?.hojas || [];
      if (!hojas.includes(id)) cerrarRef.current();
    };
    window.addEventListener("popstate", alVolver);
    return () => {
      window.removeEventListener("popstate", alVolver);
      // Cerrada desde la UI (no con "atrás"): quitar su entrada del historial.
      if ((estadoActual().hojas || []).includes(id)) window.history.back();
    };
  }, [abierta]);
}
