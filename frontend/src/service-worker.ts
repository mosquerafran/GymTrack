/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// Service worker de Silverback (CRA lo compila con Workbox InjectManifest).
//
// Qué hace:
//  - Guarda la app (JS, CSS, íconos) para que abra al instante y SIN señal.
//  - Fotos de Storage y fuentes de Google: caché con límite (las fotos no cambian: la URL
//    lleva un token fijo).
// Qué NO hace, a propósito (ver .claude/skills/TERCEROS.md → pwa-development):
//  - NO toca Firestore, Auth ni Cloud Functions: pasan directo a la red. Los datos offline
//    los maneja la caché propia de Firestore (config/firebase.js → persistentLocalCache).
//  - NO se actualiza solo: espera a que la app le pida "SKIP_WAITING" (el usuario toca
//    "Actualizar"), para no cambiar la app en medio de un registro.

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// App shell: todo lo que genera el build (con hash) queda guardado.
precacheAndRoute(self.__WB_MANIFEST);

// Navegación de la SPA: cualquier ruta sirve el index.html guardado (abre sin señal).
const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
registerRoute(({ request, url }) => {
  if (request.mode !== "navigate") return false;
  if (url.pathname.startsWith("/_")) return false; // /__/auth/... de Firebase: siempre red
  if (url.pathname.match(fileExtensionRegexp)) return false;
  return true;
}, createHandlerBoundToURL(process.env.PUBLIC_URL + "/index.html"));

// Fotos de los entrenos (Firebase Storage): cache-first con tope.
registerRoute(
  ({ url }) => url.hostname === "firebasestorage.googleapis.com" && url.pathname.includes("/o/entrenamientos"),
  new CacheFirst({
    cacheName: "fotos",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true }),
    ],
  })
);

// Google Fonts: la hoja se revalida, los archivos de fuente son inmutables.
registerRoute(({ url }) => url.origin === "https://fonts.googleapis.com", new StaleWhileRevalidate({ cacheName: "fuentes-css" }));
registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "fuentes",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// La app avisa "Actualizar" y recién ahí la versión nueva toma el control.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
