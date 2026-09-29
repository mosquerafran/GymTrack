import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import AvisosPwa from "./components/AvisosPwa";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import { initAuth } from "./config/firebase";
import { BrowserRouter } from "react-router-dom";
import { avisarActualizacion, escucharInstalacion } from "./hooks/usePwa";

// Antes de todo: Chrome avisa "se puede instalar" una sola vez, apenas carga.
escucharInstalacion();

async function start() {
  await initAuth();

  const container = document.getElementById("root");
  if (!container) throw new Error("No se encontró el div con id 'root'");

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
        {/* En la raíz: se ven en cualquier pantalla (login incluido). */}
        <AvisosPwa />
      </BrowserRouter>
    </React.StrictMode>
  );
}

start();

// Service worker (src/service-worker.ts): la app abre sin señal y se actualiza cuando el
// usuario toca "Actualizar" (no sola, para no cambiarla en medio de un registro).
serviceWorkerRegistration.register({ onUpdate: avisarActualizacion });

reportWebVitals();
