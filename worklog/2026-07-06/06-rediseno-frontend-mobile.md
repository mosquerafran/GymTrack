# Rediseño mobile-first del frontend

- **Fecha:** 2026-07-06
- **Tipo:** diseño + bugfix
- **Estado:** ✅ hecho

## Qué
Pasada de diseño sobre todo el frontend siguiendo el skill
`.claude/skills/frontend-design.md`, con foco **mobile-first** y **sin tocar la
capa de datos** (ningún cambio en services/queries/estructura de Firestore).

### Identidad visual ("scoreboard")
La app es, en esencia, una **competencia entre amigos** → se le dio una identidad
de **marcador deportivo**:
- Tipografía display **Oswald** (condensada, tipo jersey/estadio) para todos los
  títulos (`h1/h2/h3`) y para los **números grandes** (racha, días entrenados,
  posiciones y días del ranking, totales por categoría), con cifras **tabulares**
  (`.scoreboard`). Cuerpo en **Inter**.
- Se cargan las fuentes desde Google Fonts en `index.html` (antes `Inter` estaba
  declarada pero nunca se importaba → caía a la fuente del sistema).

### Mobile-first (correcciones concretas)
- **Acciones solo-hover → accesibles al tap.** Editar/borrar en `DiaDetalle` y
  renombrar/borrar en `CategoriaCreator` estaban con `opacity-0 group-hover` →
  en pantallas táctiles eran **invisibles/inaccesibles**. Ahora se ven siempre en
  mobile (`opacity-100 md:opacity-0 md:group-hover:opacity-100`).
- **Áreas táctiles ≥ 44px** (`.btn-icon`, `min-h-tap`) en botones de ícono, toggle
  de "cuenta" de categoría y navegación inferior.
- **Inputs a 16px** (`.input-field`, PRs) para **evitar el zoom automático de iOS**
  al enfocar; teclados correctos con `inputMode` en los campos numéricos.
- **Fila de PRs reestructurada**: en `TrainingSelector` el ejercicio ocupa una fila
  y kg/reps otra, en vez de amontonarse y desbordar en pantallas angostas. Los
  numéricos ya no muestran un `0` fijo molesto (placeholder cuando están vacíos).
- **Safe-area**: la barra inferior respeta el notch/gestos (`.pb-safe`,
  `viewport-fit=cover`).
- **Sin scroll horizontal** del `body`; `-webkit-tap-highlight` transparente.
- **Accesibilidad**: foco visible por teclado (`:focus-visible`),
  `prefers-reduced-motion` respetado, `aria-label`/`aria-current` en navegación e
  íconos de acción. Se relajó el viewport (se quitó `user-scalable=0`) para permitir
  zoom.

### Bugs de UI corregidos de paso
- `CalendarView`: el título "Mi Calendario" estaba hardcodeado en `text-white` →
  **invisible en tema claro**. Ahora usa `text-textMain`.
- Import `Clock` sin usar en `Feed.tsx` (rompía el build con `CI=true`).
- Warnings de `react-hooks/exhaustive-deps` (efectos de montaje intencionales)
  silenciados explícitamente para que `CI=true npm run build` compile limpio.

## Archivos tocados
- `frontend/public/index.html` — fuentes, viewport, theme-color por esquema.
- `frontend/tailwind.config.js` — `fontFamily.display`, spacing safe-area, `min-h/w-tap`.
- `frontend/src/index.css` — títulos en display, `.scoreboard`, `.btn-icon`,
  `.pb-safe/.pt-safe`, focus-visible, reduced-motion, inputs 16px, sin scroll-x.
- `frontend/src/components/Navbar.tsx` — racha scoreboard, nav inferior táctil + safe-area + aria.
- `frontend/src/components/CalendarView.tsx` — fix `text-white`.
- `frontend/src/components/CategoriaCreator.tsx` — acciones táctiles, toggle con área.
- `frontend/src/components/TrainingSelector.tsx` — fila de PRs mobile + inputMode.
- `frontend/src/pages/DiaDetalle.tsx` — acciones editar/borrar táctiles.
- `frontend/src/pages/Stats.tsx` — números scoreboard (hero, ranking, categorías).
- `frontend/src/pages/{Feed,Home,Admin,GrupoSelector}.tsx` — lint (deps) + import.

## Cómo se verificó
- `npx tsc --noEmit` → **sin errores**.
- `CI=true npm run build` → **Compiled successfully** (main.js 279 kB gzip, css 8.7 kB).
- `CI=true npm test` → **3/3 tests OK** (helpers de fecha).
- Revisión de código de los breakpoints (default = mobile, `sm/md/lg` para escalar).

## Notas / pendientes
- No se pudo hacer verificación visual automatizada (la app está detrás de login de
  Google); la validación fue por build + revisión de código. Recomendado: abrir en
  el teléfono (o DevTools ~375px) y confirmar tema claro/oscuro.
- Futuro: centralizar los `formatDate` repetidos en `utils/date.ts`; endurecer la
  regla `grupos.update` (ver `context.md` → Riesgos).
