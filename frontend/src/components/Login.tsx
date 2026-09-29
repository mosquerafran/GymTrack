import React, { useState } from "react";
import { iniciarSesionGoogle } from "../services/authService";
import { Alerta } from "../config/alertas";
import Logo from "./Logo";

/** Logo de Google inline (antes venía de un CDN: otro dominio en la pantalla de entrada). */
const LogoGoogle = () => (
  <svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export default function Login(): React.ReactElement {
  const [entrando, setEntrando] = useState(false);

  const loginGoogle = async (): Promise<void> => {
    setEntrando(true);
    try {
      await iniciarSesionGoogle();
    } catch (error: unknown) {
      const codigo = (error as { code?: string })?.code || "";
      // Cerrar el popup de Google no es un error.
      if (!/popup-closed-by-user|cancelled-popup-request/.test(codigo)) {
        console.error("Error login Google:", error);
        Alerta.fire({
          titleText: "No se pudo entrar",
          text: /popup-blocked/.test(codigo)
            ? "El navegador bloqueó la ventana de Google. Permitila y probá de nuevo."
            : "Revisá la conexión y probá de nuevo.",
          icon: "error",
          confirmButtonText: "Entendido",
        });
      }
    }
    setEntrando(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 pt-safe bg-background">
      <div className="glass-panel p-6 sm:p-10 max-w-md w-full text-center animate-slide-up space-y-8">
        <div>
          <Logo className="w-32 h-auto mx-auto mb-6 text-textMain" titulo="Logo de Gym Tracker" />
          <h1 className="font-display text-[clamp(2.75rem,14vw,4.5rem)] leading-[0.9] uppercase break-words">
            Gym<span className="text-primary">Tracker</span>
          </h1>
          <p className="eyebrow mt-4">Fierros · Constancia · Hermandad</p>
        </div>

        <button className="btn-secondary w-full min-h-[56px] text-lg" onClick={loginGoogle} disabled={entrando}>
          <LogoGoogle />
          {entrando ? "Entrando…" : "Continuar con Google"}
        </button>
      </div>
    </main>
  );
}
