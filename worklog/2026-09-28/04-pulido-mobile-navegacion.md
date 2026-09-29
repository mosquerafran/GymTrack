# Tanda 2: pulido mobile (navegación nueva, paneles, popups, estados)

- **Fecha:** 2026-09-28
- **Tipo:** diseño / refactor
- **Estado:** ✅ hecho en código · deploy: solo hosting (push)

## Qué
Según la maqueta aprobada (`maqueta-app`) y la auditoría UI/UX mobile del mismo día:

- **Navegación**: barra inferior Inicio · Muro · **Registrar** (botón central) · Ranking · Ajustes.
  "Detalle" dejó de ser pestaña: se abre tocando un día del calendario. Header con grupo, racha
  y tema (≥44 px, respeta el notch con `pt-safe`). En escritorio, pestañas + Registrar arriba.
- **Botón "atrás" del celu** (`hooks/useHistorial.ts`): la vista y los paneles abiertos viven en
  el historial del navegador. "Atrás" vuelve a la pantalla anterior o cierra el panel de arriba
  (antes cerraba la app). Scroll arriba al cambiar de vista.
- **Paneles** (`components/ui/Hoja.tsx`): registro a pantalla completa con **Guardar fijo abajo**;
  detalle del día como panel inferior (reemplaza la página `DiaDetalle`, que duplicaba el
  calendario). Diálogo accesible, Escape/tocar afuera/X, bloqueo de scroll, foco devuelto.
- **Inicio**: tarjeta "Hoy" (Registrar / "Hoy ya entrenaste"), semana contra la meta, calendario.
- **Popups**: todos por `Alerta` (`config/alertas.ts`); `verify.ps1` ahora lo controla. Adiós
  fondos transparentes (`var(--color-surface)` era un triplete, no un color), blanco en oscuro y
  el azul de la identidad vieja.
- **Ajustes**: cambiar de grupo, admin, aprobaciones y **cerrar sesión con confirmación** (antes
  era un botón rojo arriba, sin confirmar). `signOut`/`signInWithPopup` centralizados en `authService`.
- **Estados**: `components/ui/Estados.tsx` (spinner único, cargando, vacío, error con Reintentar).
  Muro, detalle, admin, aprobaciones, grupos y stats distinguen **error** de **vacío**.
- **Tamaños**: textos de contenido ≥12 px (`.eyebrow`, Podio, heatmap, calendario...), targets
  ≥44 px (Admin, Aprobaciones, grupos, código copiable, meta semanal).
- **GrupoSelector** reescrito: sin botón adentro de botón (HTML inválido), sin jerga ("Multi-tenant",
  "Clean Architecture"), sin fondos animados con blur (caros en el celu), input de código con
  mayúsculas/sin autocorrector, errores visibles. **Login**: logo de Google inline (sin CDN),
  título que no desborda en 360 px, cerrar el popup de Google ya no muestra error.
- **Identidad**: `lang="es-AR"`, manifest con los colores de la app (era azul pizarra), barra del
  navegador y `color-scheme` siguen al tema elegido en la app, sin brillos azules (calendario,
  heatmap). Heatmap anual arranca mostrando la semana de hoy (antes enero).
- `touch-action: manipulation` global (sin zoom por doble toque).

## Archivos tocados
- Nuevos: `hooks/useHistorial.ts`, `components/ui/{Hoja,Estados}.tsx` (+ `Hoja.test.tsx`),
  `components/{DetalleDia,CodigoCopiable}.tsx`
- Reescritos: `App.tsx`, `components/{Navbar,CalendarView,Login}.tsx`,
  `pages/{Home,Settings,GrupoSelector,Admin,Aprobaciones}.tsx`, `hooks/useTheme.ts`
- Tocados: `TrainingSelector` (variante `enHoja`), `Feed`, `YearHeatmap`, `Podio`,
  `MetaSemanalConfig`, `authService`, `index.css`, `public/{index.html,manifest.json}`, `verify.ps1`
- Borrado: `pages/DiaDetalle.tsx`

## Cómo se verificó
- `.\verify.ps1` completo en verde: rules 52/52, Jest **50/50** (3 nuevos del botón atrás con
  paneles apilados), typecheck, build `CI=true`, paso nuevo "SweetAlert solo vía alertas.ts".
- JS inicial **−22 KB** gzip (registro y popups ahora cargan cuando se usan).
- ⚠️ **Sin prueba visual logueado** (el login con Google no se automatiza). Queda del dueño.

## Notas / pendientes
- **Login en PWA instalada de iOS**: `signInWithPopup` puede fallar en modo standalone.
  `signInWithRedirect` tiene sus propios problemas (cookies de terceros) → probar antes de cambiar.
- Iconos del manifest: falta un maskable de verdad (512 con zona segura) y screenshots.
- Service worker / offline: sigue desactivado (skill `pwa-development`, ver `TERCEROS.md`).
