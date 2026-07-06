# Limpieza: test por defecto de CRA y dependencia sin usar

- **Fecha:** 2026-07-06
- **Tipo:** chore
- **Estado:** ✅ hecho

## Qué
1. Se reemplazó el test por defecto de Create React App (`App.test.tsx`, que
   buscaba el texto "learn react") por tests reales de `utils/date.ts`.
2. Se removió la dependencia `recharts` de `frontend/package.json`.

## Por qué
1. El test de CRA **siempre fallaba** (ese texto no existe en la app) y rompía
   `npm test` / CI sin aportar nada. Los nuevos tests además fijan el fix de zona
   horaria para que no vuelva a aparecer.
2. `recharts` quedó sin uso cuando se rediseñó Stats sin gráficos. Es peso muerto
   en el árbol de dependencias.

## Archivos tocados
- `frontend/src/App.test.tsx` — tests de `formatDateLocal`, `inicioMesLocal`, `finMesLocal`.
- `frontend/package.json` — quitada `recharts`.

## Cómo se verificó
- Búsqueda global: `recharts` no se importa en ningún archivo de `src`.
- `npx tsc --noEmit` → sin errores.

## Notas / pendientes
`node_modules` de `recharts` sigue instalado localmente hasta el próximo
`npm install`; no afecta el build (no se importa).
