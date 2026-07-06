# Reskin "Hierro Forjado" + Node 22 + GitHub Actions

- **Fecha:** 2026-07-06
- **Tipo:** diseño + chore
- **Estado:** ✅ hecho

## Qué

### 1. Rediseño estético "rústico y moderno" (Hierro Forjado)
Nueva identidad visual, aplicada de forma global vía tokens (se re-skinea toda la
app) + retoques puntuales en las pantallas hero.
- **Paleta cálida**: charcoal/concreto + **naranja óxido (hierro al rojo)** como
  primario, **bronce** como acento, **hueso/tiza** para el texto. Reemplaza el
  azul + slate + glassmorphism anterior (muy "SaaS", nada rústico).
- **Tipografía**: **Anton** (póster de gimnasio) para heros e impacto, **Oswald**
  (condensada, tabular) para títulos y números, **Inter** para el cuerpo y
  **Space Mono** para las etiquetas (sello industrial). Se cargan de Google Fonts.
- **Paneles mate** (sin blur), bordes finos, arista de luz superior y radios más
  contenidos (más "industrial"). Botones "estampados" con arista inferior y hundido
  al presionar; CTAs en Oswald mayúsculas.
- **Grano sutil** sobre toda la app (textura fractal en CSS, `body::after`,
  opacidad 0.05, `mix-blend-mode: overlay`).
- Retoques hero: Login (wordmark GYM**TRACKER** en Anton + tagline mono), Stats
  (título y % en Anton, eyebrows mono), Feed y GrupoSelector.

### 2. Backend a Node 22
`backend/package.json` engines `20 → 22` (Node 20 se decomisiona el 2026-10-30).

### 3. GitHub Actions arregladas
Los workflows corrían `npm run build` en la **raíz** (donde ya no está la app) y
fallaban. Ahora ambos (merge y PR) instalan y buildean en **`frontend/`** con
**Node 22** y `npm ci`, y despliegan hosting. Deploy de hosting automático al pushear
a `main`.

## Datos
Cero cambios de datos. Solo estilos, config y CI.

## Archivos tocados
- `frontend/public/index.html` — fuentes Anton + Space Mono; theme-color nuevo.
- `frontend/tailwind.config.js` — familias `display`/`heading`/`mono`.
- `frontend/src/index.css` — **reescrito**: paleta forja, paneles mate, botones
  estampados, grano, `.eyebrow`, headings en Oswald, calendario re-teñido.
- `frontend/src/components/Login.tsx`, `pages/Stats.tsx`, `pages/Feed.tsx`,
  `pages/GrupoSelector.tsx` — retoques hero (Anton + eyebrows mono).
- `backend/package.json` — Node 22.
- `.github/workflows/firebase-hosting-merge.yml` y `...-pull-request.yml` — build en
  `frontend/` con Node 22.
- `frontend/package-lock.json` — sincronizado (se removió `recharts`).

## Cómo se verificó
- `npx tsc --noEmit` → **sin errores**.
- `CI=true npm run build` → **Compiled successfully**.
- `CI=true npm test` → **8/8 OK**.
- Verificación visual real pendiente en el dispositivo (no automatizable por el login).

## Notas
- Node 22 aplica al redeployar las functions (se hace en este mismo deploy).
- El deploy de las Actions es **solo hosting**; functions y reglas se siguen
  desplegando manualmente con `firebase deploy`.
- Pendiente sugerido (perf): cachear el mapa de categorías entre vistas, paginar el
  Muro, y evaluar `minInstances` para el cold start del login.
