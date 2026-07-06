# Podio top-3, nudge de récord y comparativa semanal

- **Fecha:** 2026-07-06
- **Tipo:** feature
- **Estado:** ✅ hecho

## Qué
Tres agregados de gamificación en la página de Ranking/Stats:

1. **Podio top-3** 🥇🥈🥉 — arriba del ranking, con el 1° al centro y más alto,
   avatar con inicial, días y %. Resalta tu lugar con "(vos)". Si hay menos de 3
   personas muestra las que haya; con menos de 2 no se dibuja.
2. **Nudge de récord de racha** 🏆 — mensaje contextual: si estás en tu mejor racha
   histórica te avisa que no la cortes; si estás a ≤3 días de igualar tu récord, te
   dice cuántos faltan.
3. **Comparativa semanal** ↑/↓ — en el tile "Semana", indicador de días de esta
   semana vs la pasada (verde si subiste, rojo si bajaste, gris si igual).

## Por qué
Francisco quería más pique competitivo entre los 4 amigos. El podio hace visual el
ranking, el nudge empuja a no cortar la racha, y la comparativa muestra si venís
mejorando semana a semana.

## Datos
Todo se **deriva por cálculo** de las asistencias existentes. Se agregó
`diasSemanaPasada` a `StatsData` (mismo criterio lunes-domingo que la semana en
curso). Ninguna escritura ni migración.

## Archivos tocados
- `frontend/src/services/statsService.ts` — nuevo campo `diasSemanaPasada`.
- `frontend/src/components/Podio.tsx` — **nuevo** (podio top-3, mobile-first).
- `frontend/src/pages/Stats.tsx` — podio + nudge de récord + delta semanal.

## Cómo se verificó
- `npx tsc --noEmit` → **sin errores**.
- `CI=true npm run build` → **Compiled successfully**.
- `CI=true npm test` → **8/8 OK**.

## Notas
- El podio ordena por días (igual que el ranking); el % se muestra como dato extra.
- El delta semanal usa solo días que cuentan (consistente con el resto de Stats).
