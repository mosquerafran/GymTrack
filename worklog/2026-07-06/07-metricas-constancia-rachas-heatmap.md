# Métricas nuevas: constancia %, rachas, heatmap y meta semanal

- **Fecha:** 2026-07-06
- **Tipo:** feature
- **Estado:** ✅ hecho

## Qué
Se agregaron a la página de **Ranking/Stats** cuatro métricas centradas en **días**
(no en volumen de entrenos), pedidas por Francisco:

1. **% de constancia** — `días entrenados ÷ días transcurridos del período`
   ("el % de los días que se pudo"). Para el mes en curso el denominador son los
   días **hasta hoy**, no los 30 completos. Se muestra como número grande
   (scoreboard) + barra, y **cada persona del ranking** tiene su % y su barra.
2. **Racha actual + récord** — además de la racha vigente (que ya estaba en la
   barra superior), ahora se ve la **mejor racha histórica** (`calcularRachas`).
3. **Heatmap anual** — grilla estilo GitHub (una columna por semana, un cuadrito
   por día que se prende si entrenaste). Componente propio, sin librerías, con
   scroll horizontal en mobile.
4. **Meta semanal por persona** — cada uno fija cuántos días/semana quiere entrenar
   (config en su doc `usuarios/{email}.metaSemanal`, default 4). En Stats se ve
   "esta semana X/meta" con estado cumplido; se configura en **Ajustes**.

Extra sumado: nota metodológica al pie explicando cómo se calcula la constancia,
y el ranking pasó a mostrar % + barra por usuario (ordena igual que por días, pero
comunica mejor la proporción).

## Por qué
El grupo valora la **constancia** (días que aparecés) más que cuántos ejercicios
hiciste. El % contra "lo que se pudo", las rachas y el heatmap hacen visible esa
constancia y pican la competencia entre amigos.

## Datos — sin tocar nada existente
- Constancia, rachas, semana y heatmap se **derivan por cálculo** de las
  asistencias ya existentes. Cero migraciones, cero escrituras sobre datos viejos.
- La única escritura nueva es `metaSemanal`, que **cada usuario guarda en su propio
  doc** con `merge: true` (las reglas ya permiten que uno escriba su `usuarios/{email}`).
  No pisa ningún campo previo.

## Archivos tocados
- `frontend/src/utils/date.ts` — `parseFechaLocal`, `diasTranscurridos`, `inicioSemanaLocal`.
- `frontend/src/services/statsService.ts` — `calcularRachas` + `calcularStats`
  extendido (diasPosibles, porcentaje, rachas, díasEstaSemana, díasEntrenadosAnio,
  % por usuario en el ranking).
- `frontend/src/services/usuarioService.ts` — **nuevo**: get/set de `metaSemanal`.
- `frontend/src/types/index.ts` — `Usuario.metaSemanal?` + `META_SEMANAL_DEFAULT`.
- `frontend/src/components/YearHeatmap.tsx` — **nuevo** (heatmap anual).
- `frontend/src/components/MetaSemanalConfig.tsx` — **nuevo** (selector 1–7 en Ajustes).
- `frontend/src/pages/Stats.tsx` — rediseño con panel personal (constancia, rachas,
  semana), heatmap y ranking con %.
- `frontend/src/pages/Settings.tsx` — incluye `MetaSemanalConfig`.
- `frontend/src/App.test.tsx` — tests de `calcularRachas`.

## Cómo se verificó
- `npx tsc --noEmit` → **sin errores**.
- `CI=true npm run build` → **Compiled successfully**.
- `CI=true npm test` → **8/8 tests OK** (fechas + rachas).

## Decisiones / notas
- **Base de días que cuentan**: la constancia, el heatmap, la semana y las rachas de
  Stats usan solo categorías con `cuenta=true`. La racha de la barra superior
  (`useStreak`) sigue contando cualquier día; en casos borde (ej. un día solo de
  Fútbol que no cuenta) pueden diferir. Se puede unificar más adelante.
- Ordenar el ranking por % o por días da el **mismo orden** dentro de un período
  (el denominador es igual para todos), por eso no se agregó un toggle: se muestran
  ambos números.
- El heatmap muestra el **año calendario actual**, independiente del selector de período.
