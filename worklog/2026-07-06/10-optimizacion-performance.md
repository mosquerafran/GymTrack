# Optimización de performance

- **Fecha:** 2026-07-06
- **Tipo:** performance
- **Estado:** ✅ hecho

## Qué
Tres optimizaciones, sin tocar datos:

1. **Cache de categorías en memoria** (`categoriasService`). La colección de
   categorías se leía completa en casi cada pantalla (Home, Feed, DiaDetalle,
   Stats) y en cada navegación. Ahora se lee **una sola vez** y se reutiliza por
   60s; `cargarCategorias`, `cargarCategoriasActivas` y `cargarMapaCategorias`
   derivan del mismo cache. Las mutaciones invalidan el cache
   (`invalidarCacheCategorias`). Menos lecturas y navegación más ágil.

2. **Login optimista** (`useAuth`). Se guarda el estado verificado en
   `localStorage` por uid. En las siguientes entradas, la app se muestra **al
   instante** desde el cache y la verificación real (Cloud Function `verificarAcceso`
   + fallback) corre en segundo plano. Elimina la espera del **cold-start** en cada
   entrada. Si la verificación falla pero hay cache, la sesión sigue usable (no se
   muestra el error); solo se corta para usuarios sin cache (nuevos).

3. **Muro con índice** (`cargarFeedGlobal` + `firestore.indexes.json`). Antes traía
   **todas** las asistencias del grupo y ordenaba/recortaba en el cliente. Ahora usa
   `where(grupoId) + orderBy(timestamp desc) + limit(50)` apoyado en un índice
   compuesto, trayendo solo 50 documentos del servidor. Incluye **fallback** al
   método viejo por si el índice todavía se está construyendo.

## Por qué
La lentitud percibida venía de (a) el cold-start del login en cada entrada y
(b) lecturas amplias repetidas a Firestore. Estas tres medidas atacan ambos.

## Datos
Cero cambios de datos. El índice es configuración de Firestore (no modifica
documentos). El cache es en memoria/localStorage del cliente.

## Archivos tocados
- `frontend/src/services/categoriasService.ts` — cache + invalidación en mutaciones.
- `frontend/src/hooks/useAuth.ts` — estado optimista desde localStorage.
- `frontend/src/services/asistenciasService.ts` — feed con orderBy+limit + fallback.
- `firestore.indexes.json` — **nuevo**: índice compuesto asistencias(grupoId, timestamp desc).
- `firebase.json` — referencia a `firestore.indexes.json`.

## Cómo se verificó
- `npx tsc --noEmit` → **sin errores**.
- `CI=true npm run build` → **Compiled successfully**.
- `CI=true npm test` → **8/8 OK**.

## Pendientes / futuro
- Evaluar `minInstances: 1` en `verificarAcceso` para matar el cold-start del todo
  (tiene un costo mensual chico; por ahora el login optimista lo mitiga gratis).
- El detalle de día (`cargarAsistenciasMes`) sigue filtrando el grupo en cliente;
  se puede indexar (grupoId + fecha) si hiciera falta, pero está acotado por mes.
