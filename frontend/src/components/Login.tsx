import React from "react";
import { auth } from "../config/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Swal from "sweetalert2";

export default function Login(): React.ReactElement {
  const loginGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error login Google:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema iniciando sesión.",
        icon: "error",
        background: "var(--color-surface)",
        color: "var(--color-text-main)",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel p-8 md:p-12 max-w-md w-full text-center animate-slide-up relative z-10">
        <div className="mb-8">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <span className="text-4xl">💪</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-textMain mb-2 tracking-tight">Gym Tracker</h1>
          <p className="text-textMuted text-sm md:text-base">Registra tu progreso y mantén la consistencia</p>
        </div>

        <button className="btn-secondary w-full py-4 text-lg" onClick={loginGoogle}>
          <img
            className="w-6 h-6"
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
            alt="Google"
          />
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
