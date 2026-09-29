# Registro con cuerpo (tipo + músculos + etiqueta) y stats por músculo

- **Fecha:** 2026-09-28
- **Tipo:** feature
- **Estado:** ✅ hecho · deploy: hosting con el push + `/deploy rules`

## Qué
- **Registro nuevo** (`TrainingSelector`, reescrito mobile-first): foto desde cámara **o
  galería** (y se puede cambiar) → **tipo** (gym / fútbol / running / otro) → si es gym,
  **músculos** tocando el cuerpo de frente y espalda (hombre o mujer), con atajos
  (Push, Pull, Legs, Torso, Core) y lista de checkboxes plegable → **etiqueta** libre con
  sugerencias → PRs (inputs de 48 px) → mensaje. Valida en línea ("Falta la foto y al menos
  un músculo") en vez de popups. En el celu aparece **arriba** del calendario.
- **Todo entreno suma al ranking** (se dejó de mirar `categorias.cuenta`).
- **Muro**: etiqueta, "Pecho · Hombros · Tríceps", cuerpito sobre la foto, imágenes lazy.
- **Stats** (según la maqueta aprobada): períodos semana/mes/año, constancia, **mapa de calor
  del cuerpo** (tocás un músculo → días y última vez), **días por músculo**, **músculos
  olvidados** (≥14 días), **arriba vs. abajo**, **reyes de cada zona** del grupo, ranking
  con desglose por tipo, entrenos por tipo, heatmap anual. Estado de error con Reintentar.
- **Ajustes**: "Tu cuerpo" (hombre/mujer → `usuarios.sexo`) y "Tus etiquetas" (las viejas
  categorías: crear, renombrar, **ocultar**; ya no se borran ni tienen "cuenta").
- **Popups**: `config/alertas.ts` (mixin de SweetAlert con la identidad; usado en lo nuevo).
- **Rules**: validan `usuarios.sexo` (hombre/mujer) y `asistencias.tipo` (4 valores).

## Por qué
Propuesta del dueño (checkbox + cuerpo), prototipada 2 veces (el cuerpo geométrico hecho a mano
"no le gustó"; el anatómico sí) y maqueta de la app y de Stats aprobadas antes de programar.

## Decisiones
- **Cuerpo**: dibujos de `react-muscle-highlighter@1.2.0` (MIT) **vendoreados** en
  `components/cuerpo/datos.ts` con su licencia; el componente de la librería no se usa (sin
  teclado, ids repetidos, tamaño fijo, colores por atributo que rompen el tema oscuro).
  `Cuerpo.tsx` propio: accesible, colores por CSS (`.cuerpo` en `index.css`), viewBox
  precalculado. Carga **diferida** (chunk de 56 KB gzip): no pesa en el login ni en Inicio.
- **Entrenos viejos: no se tocó ningún dato.** El dueño pidió "setear" los músculos de cada uno
  deduciéndolos de sus entrenos; se hizo **al leer** (`utils/entrenos.ts → musculosDeNombre`),
  que da el mismo resultado sin escribir en producción (`protocol.md` §0) y es corregible.
  Reconoce todas las categorías por defecto de los 4 (Push, Pull, Legs, Brazos, Pecho-Espalda,
  Espalda-triceps, Pecho-biceps, Pierna-hombro, Brazos-hombro, Torso, Patas, Empuje, Tracción);
  "Futbol"/"Running" → su tipo; "Hikking" → otro; **"Minubi 🥵" no se puede deducir** (suma al
  ranking, no al mapa). Categorías creadas a mano con otros nombres: solo si usan esas palabras.
- **Colores de los gráficos**: validados con el script de la skill `dataviz`. El par óxido/bronce
  **falla** como categórico (ΔE 14,5 normal / 7,1 deutan): nada compara dos colores; todo es
  magnitud en un solo color con el número escrito al lado.

## Archivos tocados
- Nuevos: `config/entrenos.ts`, `config/alertas.ts`, `utils/entrenos.ts` (+ test),
  `components/cuerpo/{datos,Cuerpo,SelectorMusculos,MiniCuerpo}.tsx` (+ `cuerpo.test.tsx`),
  `components/{SexoConfig,StatsMusculos}.tsx`, `hooks/useSexo.ts`
- Reescritos: `components/TrainingSelector.tsx`, `components/CategoriaCreator.tsx`, `pages/Stats.tsx`
- Tocados: `types/index.ts`, `services/{asistencias,stats,usuario}Service.ts`, `pages/{Home,Feed,DiaDetalle,Settings}.tsx`, `index.css`
- `firestore.rules` (+ 4 tests), docs (`CLAUDE.md`, `context.md`, `.claude/rules/datos-y-fechas.md`)

## Cómo se verificó
- `.\verify.ps1` completo en verde: rules **52/52**, typecheck, Jest **47/47** (29 de lógica de
  entrenos: docs viejos, deducción con los nombres reales, todo suma, stats por músculo; 7 de
  render de los componentes del cuerpo con los dos modelos), build `CI=true`.
- ⚠️ **No se vio en la app real**: el login con Google no se automatiza. El diseño es el de las
  maquetas aprobadas; la prueba en el celu queda del dueño.

## Notas / pendientes
- **Avisar al grupo**: el ranking cambia (ahora suma todo, incluidos docs viejos de categorías
  que no contaban o que se borraron).
- Tanda 2 (pulido mobile): navegación con botón central, detalle del día en panel inferior,
  resto de popups al mixin, safe-area, botón atrás, textos ≥12 px, etc. (maqueta aprobada).
- La categoría "Minubi 🥵" y cualquier otra sin palabras reconocibles: si se quiere, se le
  asigna un grupo de músculos a mano en `PALABRAS` (`utils/entrenos.ts`).
