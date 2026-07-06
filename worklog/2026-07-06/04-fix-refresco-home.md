# Fix: el calendario del Home no se refrescaba al registrar

- **Fecha:** 2026-07-06
- **Tipo:** bugfix
- **Estado:** ✅ hecho

## Qué
Se conectó el callback `onCompletado` del `TrainingSelector` en `Home.tsx` para
recargar el mes (`cargarMes(fecha)`) después de guardar un entrenamiento.

## Por qué
En el Home, `TrainingSelector` se usaba sin `onCompletado`. Al registrar un
entreno, el punto del día no aparecía en el calendario hasta recargar la página,
dando la sensación de que "no se guardó". El componente ya emitía `onCompletado`
tras guardar; solo faltaba que el Home lo escuchara.

## Archivos tocados
- `frontend/src/pages/Home.tsx` — se pasa `onCompletado={() => cargarMes(fecha)}`.

## Cómo se verificó
- `npx tsc --noEmit` → sin errores.
- Flujo manual esperado: registrar un entreno en Home → el día se marca al instante.

## Notas / pendientes
Ninguno.
