# Logo de Gym Tracker

Gorila de la marca **King Concretos**, usado con permiso del dueño (2026-09-28).

- `image.png`: hoja de marca original (captura). **Solo local**, fuera del repo (`.gitignore`):
  tiene datos de contacto de terceros.
- `gorila.svg`: el gorila vectorizado (potrace, desde la versión negra ampliada ×8). Es la fuente
  de todo lo demás y del componente `frontend/src/components/Logo.tsx`.
- `iconos/`: lo que se publica en `frontend/public/` (favicon .svg/.ico, logo192/512, maskable 512
  con zona segura, apple-touch-icon 180). Gorila hueso `#ede6d8` sobre carbón `#1a1612`.
- `proceso/`: recortes, trazados de prueba (versión negra vs. blanca) y los scripts
  (`trazar2.js`, `iconos.js`: necesitan `sharp`, `potrace` y `svg-path-bbox`).

Para regenerar los íconos (por ejemplo, si cambia la paleta): ajustar colores en `iconos.js`.
