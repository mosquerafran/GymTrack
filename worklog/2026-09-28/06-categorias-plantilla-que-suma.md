# Categorías como plantilla, qué suma por categoría, varios entrenos por día y días anteriores

- **Fecha:** 2026-09-28
- **Tipo:** feature
- **Estado:** ✅ hecho · deploy: push (hosting) + `firebase deploy --only firestore:rules`

## Qué
- **Categorías personales = plantillas** (Ajustes → "Tus categorías"): nombre, tipo, **músculos
  preseleccionados** (con el cuerpo) y **"Suma al ranking"**. Editor en panel a pantalla completa.
  Las viejas precargan tipo y músculos deducidos del nombre (`plantillaDe`), editables.
- **Registrar**: arriba, tus categorías como botones; tocar una precarga tipo, músculos y nombre
  (se pueden ajustar). Aviso en línea de si ese entreno suma. Sin categoría: suma.
- **Qué suma lo decide la categoría de cada uno** (`cuentaDe`, al leer): mi "Fútbol" no suma, el de
  otro sí. Días entrenados, ranking, racha (header y Stats) y meta semanal. Músculos y "por tipo"
  cuentan todo. El detalle del día marca "No suma al ranking". La semana de Inicio distingue
  "entrenó" de "entrenó y suma".
- **Varios entrenos por día**: "Agregar otro entreno" en Inicio y en el detalle de cualquier día.
- **Días anteriores**: la fecha del registro se toca y abre el calendario del celu (hasta hoy).
- Los entrenos nuevos vuelven a guardar `categoriaId`. Rules validan `tipo`/`musculos` de categorías.

## Por qué
Pedido del dueño el mismo día: "para mí fútbol no suma, solo las de gimnasio" (por usuario), "más
de un entreno un día", "registrar un día anterior si me olvidé", y "categorías propias como
preselección de los músculos". Revierte en parte el "todo suma" de la mañana (worklog `03`).

## Decisiones
- **Se calcula al leer, no se guarda en cada entreno**: cambiar "suma" en una categoría aplica
  también a lo pasado, sin tocar datos. Los entrenos viejos vuelven a contar como contaban antes
  (sus categorías conservaban `cuenta`).
- Sin categoría, o categoría inexistente → **suma** (decisión del dueño).

## Archivos tocados
- `utils/entrenos.ts` (+ tests: `cuentaDe`, `plantillaDe`), `types/index.ts`
- `services/{categorias,asistencias,stats}Service.ts`, `hooks/useStreak.ts`
- `components/{CategoriaCreator,TrainingSelector,DetalleDia,CalendarView}.tsx`, `pages/Home.tsx`, `App.tsx`
- `firestore.rules` (+3 tests), docs

## Cómo se verificó
- `.\verify.ps1` completo en verde: rules+functions **72/72**, Jest **55/55**, typecheck, build.
- ⚠️ Sin prueba visual logueado: queda del dueño.

## Notas / pendientes
- **Pasada de diseño** pedida: paleta blanco y negro sobria, logo por toda la app, tablas y
  gráficos con la estética geométrica del gorila, y **nombre nuevo para la app**. Con maqueta antes.
