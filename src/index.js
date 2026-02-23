import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

import { initAuth } from './firebase';
import { BrowserRouter } from "react-router-dom";

async function start() {
  await initAuth();

  const container = document.getElementById('root');
  if (!container) throw new Error("No se encontró el div con id 'root'");

  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <MantineProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </React.StrictMode>
  );
}

start();

reportWebVitals();