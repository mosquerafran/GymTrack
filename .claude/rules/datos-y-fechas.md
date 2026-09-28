---
paths:
  - "frontend/src/services/**"
  - "frontend/src/hooks/**"
  - "frontend/src/utils/**"
  - "frontend/src/types/**"
---

# Acceso a datos y fechas

## Capas
- **`services/` es la única capa que habla con Firestore/Storage.** Sin JSX ni hooks, devuelve
  datos tipados (`types/index.ts`). `hooks/` puede suscribirse (`onSnapshot`, como `useStreak`).
  `pages/` y `components/` **no** importan `firebase/firestore`: `verify.ps1` lo controla
  (excepción legacy: `Aprobaciones.tsx`).

## Fechas — el bug que ya pasó
- **La clave de un día es `"YYYY-MM-DD"` en HORA LOCAL**: `formatDateLocal()`, `inicioMesLocal()`,
  `finMesLocal()` y `parseFechaLocal()` de `utils/date.ts`.
- **Nunca `toISOString().split("T")[0]`** (ni `.slice(0,10)`): en UTC-3 la medianoche local cae el
  día anterior en UTC, y los rangos de mes/año quedaban corridos un día. `verify.ps1` lo controla.
- `toISOString()` **sí** está bien para un timestamp completo (`creadoEn`); lo prohibido es usarlo
  para la clave del día.

## Retrocompatibilidad (la regla de oro de `protocol.md` §0)
- **No se renombran campos existentes.** Docs viejos tienen `catId` y los nuevos `categoriaId`: al
  leer, normalizá los dos; al escribir, siempre `categoriaId`.
- `cargarAsistenciasMes` filtra el grupo **en el cliente** a propósito: hay docs legacy con
  `grupoId` vacío que una query por `grupoId` excluiría.
- **Tres identidades conviven**: `asistencias.userId` (uid, base de las rules), `userName`
  (displayName, con el que se agrupa el ranking) y `grupos.miembros` (**emails**). No las mezcles.

## Lecturas y cache
- `categoriasService` cachea en memoria **60 s**. Toda mutación de categorías tiene que llamar a
  `invalidarCacheCategorias()`, o la UI muestra datos viejos hasta que vence.
- `cargarFeedGlobal` usa el índice `asistencias(grupoId, timestamp desc)` + `limit(50)`, **con
  fallback** al método viejo si el índice no existe. ⚠️ El fallback **esconde** un índice sin
  deployar: el muro funciona igual, pero leyendo todo el grupo. Si agregás una query que necesita
  índice, declaralo en `firestore.indexes.json`.
- `useAuth` muestra la app desde el estado cacheado en `localStorage` (`estadoUsuario:<uid>`) y
  verifica en segundo plano. Un usuario rechazado con cache vieja entra hasta que la verificación
  vuelve.

## Tests
- La lógica pura (`statsService`, `utils/date`) se testea en Jest. Toda lógica nueva de cálculo
  lleva su test.
