import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import { initAuth } from "./config/firebase";
import { BrowserRouter } from "react-router-dom";

async function start() {
  await initAuth();

  const container = document.getElementById("root");
  if (!container) throw new Error("No se encontró el div con id 'root'");

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

start();

// Registra el service worker para que la app funcione offline y cargue más rápido.
// Cambia unregister() a register() a continuación.
serviceWorkerRegistration.unregister();

reportWebVitals();
