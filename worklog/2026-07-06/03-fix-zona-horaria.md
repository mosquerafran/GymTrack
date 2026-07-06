# Fix zona horaria (UTC-3): rangos de mes/año corridos

- **Fecha:** 2026-07-06
- **Tipo:** bugfix
- **Estado:** ✅ hecho

## Qué
Se creó `frontend/src/utils/date.ts` con helpers en **hora local**
(`formatDateLocal`, `inicioMesLocal`, `finMesLocal`) y se reemplazaron los usos de
`new Date(...).toISOString().split("T")[0]` en la capa de datos.

## Por qué
Los usuarios están en Argentina (UTC-3). `new Date(2026, 6, 1).toISOString()`
devuelve `"2026-06-30"` porque convierte la medianoche local a UTC (día anterior).
Eso corría **un día** los límites de las queries y filtros por mes/año:
- `cargarAsistenciasMes` y `cargarAsistenciasMesUsuario` podían perder el último
  día del mes y colar el último del mes anterior.
- Los filtros de período de `statsService` (este mes / últimos 6 meses) arrancaban
  un día antes, contando de más.

Además, la fecha con la que se **guarda** un entreno ya usaba lógica local
correcta; se unificó al mismo helper.

## Archivos tocados
- `frontend/src/utils/date.ts` — nuevo (helpers + explicación del bug).
- `frontend/src/services/asistenciasService.ts` — `guardarAsistencia`,
  `cargarAsistenciasMes`, `cargarAsistenciasMesUsuario` usan los helpers.
- `frontend/src/services/statsService.ts` — filtros de período con `formatDateLocal`.
- `frontend/src/App.test.tsx` — tests que fijan el comportamiento (ver entrada 05).

## Cómo se verificó
- `npx tsc --noEmit` → sin errores.
- Tests unitarios de los helpers (incluye el caso 1 de julio a medianoche local).

## Notas / pendientes
`useStreak`, `CalendarView` y `DiaDetalle` ya usaban un `formatDate` local propio
(correcto). Se podrían centralizar en `utils/date.ts` en un refactor futuro para no
repetir la función.
