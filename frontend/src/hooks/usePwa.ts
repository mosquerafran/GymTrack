import { useEffect, useState } from "react";

/**
 * Estado de la PWA para la UI: conexión, versión nueva disponible e instalación.
 * index.tsx conecta los eventos del navegador (service worker, beforeinstallprompt) con
 * estos hooks a través de eventos de window, así la UI no depende del orden de carga.
 */

// ── Conexión ────────────────────────────────────────────────────────────────
export function useConexion(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

// ── Versión nueva (service worker esperando) ────────────────────────────────
export const EVENTO_ACTUALIZACION = "silverback:actualizacion";
let registroEsperando: ServiceWorkerRegistration | null = null;

/** Lo llama index.tsx cuando el service worker nuevo quedó instalado y esperando. */
export const avisarActualizacion = (registro: ServiceWorkerRegistration): void => {
  registroEsperando = registro;
  window.dispatchEvent(new Event(EVENTO_ACTUALIZACION));
};

export function useActualizacion(): { hayVersionNueva: boolean; actualizar: () => void } {
  const [hay, setHay] = useState(() => !!registroEsperando?.waiting);
  useEffect(() => {
    const alAvisar = () => setHay(true);
    window.addEventListener(EVENTO_ACTUALIZACION, alAvisar);
    return () => window.removeEventListener(EVENTO_ACTUALIZACION, alAvisar);
  }, []);

  const actualizar = () => {
    const esperando = registroEsperando?.waiting;
    if (!esperando) return window.location.reload();
    // Cuando la versión nueva toma el control, recargar una sola vez.
    let recargado = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (recargado) return;
      recargado = true;
      window.location.reload();
    });
    esperando.postMessage({ type: "SKIP_WAITING" });
  };

  return { hayVersionNueva: hay, actualizar };
}

// ── Instalar la app ─────────────────────────────────────────────────────────
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const EVENTO_INSTALABLE = "silverback:instalable";
let eventoInstalacion: EventoInstalacion | null = null;

/** index.tsx lo llama apenas carga: Chrome dispara beforeinstallprompt una sola vez. */
export const escucharInstalacion = (): void => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // sin la barrita automática: se instala desde Ajustes
    eventoInstalacion = e as EventoInstalacion;
    window.dispatchEvent(new Event(EVENTO_INSTALABLE));
  });
  window.addEventListener("appinstalled", () => {
    eventoInstalacion = null;
    window.dispatchEvent(new Event(EVENTO_INSTALABLE));
  });
};

const esStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export type EstadoInstalacion = "instalada" | "instalable" | "ios" | "no-disponible";

const calcular = (): EstadoInstalacion =>
  esStandalone() ? "instalada" : eventoInstalacion ? "instalable" : esIOS() ? "ios" : "no-disponible";

export function useInstalacion(): { estado: EstadoInstalacion; instalar: () => Promise<void> } {
  const [estado, setEstado] = useState<EstadoInstalacion>(calcular);

  useEffect(() => {
    const alCambiar = () => setEstado(calcular());
    window.addEventListener(EVENTO_INSTALABLE, alCambiar);
    return () => window.removeEventListener(EVENTO_INSTALABLE, alCambiar);
  }, []);

  const instalar = async () => {
    if (!eventoInstalacion) return;
    await eventoInstalacion.prompt();
    await eventoInstalacion.userChoice;
    eventoInstalacion = null;
    setEstado(calcular());
  };

  return { estado, instalar };
}
