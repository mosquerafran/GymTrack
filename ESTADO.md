# ESTADO.md — dónde estamos hoy

> **Última actualización: 2026-09-28.**
> Este es el único archivo con **estado que caduca**: qué hay en producción, qué falta, qué riesgo
> está abierto. Las reglas durables van en `CLAUDE.md`; el producto, en `context.md`. Al cerrar una
> tarea se actualiza **acá** (`/cerrar-tarea`).

---

## 1. Producción

| Pieza | Estado | Cómo se sabe |
|---|---|---|
| **Hosting** | ✅ `d82760f` (optimización de performance), deployado el 2026-07-06 | GitHub Actions, run `28817104172`, *success* |
| **Functions** | ⚠️ **sin registro** | Se deployan a mano y el repo no guarda el resultado |
| **Firestore rules** | ⚠️ **sin registro**. En el repo hay rules nuevas (fase 1) **sin deployar** | Ídem |
| **Índice `asistencias(grupoId, timestamp desc)`** | ⚠️ **sin registro** | Ídem. El muro tiene fallback, así que **funciona igual aunque falte** |
| **Storage rules** | ⚠️ **sin registro**. Ídem: nuevas sin deployar | Ídem |

El 2026-09-28 se endurecieron las rules (worklog `2026-09-28/02`). El frontend que las acompaña se
deploya con el push; **las rules no**: van por `/deploy rules`, y siempre **después** del push.

## 2. 🔴 Requiere acción

0. **Deployar las rules de la fase 1, en este orden:** (a) push a `main` → esperar que Actions
   termine en verde; (b) `/deploy rules` (firestore + storage). Al revés, a los VIP/admin se les
   rompe la carga de grupos. Después: probar en el celu unirse a un grupo, registrar y editar un
   entreno, y aprobar a alguien desde Aprobaciones (que **antes estaba rota**).

1. **Confirmar que las Cloud Functions corren en Node 22 — antes del 30/10/2026.** Ese día Google
   decomisiona Node 20. `backend/package.json` pide Node 22 desde el 2026-07-06 (worklog `09`), pero
   una function queda en el runtime con el que **se deployó**. El worklog dice que se deployaba "en
   este mismo deploy"; no hay registro de que haya pasado.
   - **Cómo verificarlo:** consola de Firebase → Functions → columna *Runtime*.
   - **Si dice Node 20:** `/deploy functions`.
2. **Confirmar que el índice del muro está construido.** Consola de Firebase → Firestore → Índices,
   o `! firebase firestore:indexes` (solo lectura). Si falta, el muro sigue leyendo **todo** el grupo
   (el problema que la optimización del 2026-07-06 venía a resolver) y **nadie lo nota**.

## 3. Pendientes (sin fecha)

- ⬜ **Seguridad fase 2** (necesita `/deploy functions`): unirse a un grupo vía callable con
  códigos únicos → recién ahí cerrar la **lectura** de `grupos`, `asistencias` y fotos por grupo;
  filtro `grupoId` + índice `(grupoId, fecha)` en `cargarAsistenciasMes`; App Check; headers de
  seguridad en hosting; `permissions:` y pin por SHA en `firebase-hosting-merge.yml`.
- ⬜ **Selector de cuerpo** (propuesta del dueño, aprobada 2026-09-28): tipo de entreno (gym /
  fútbol / running / otro) + músculos en un SVG frente/espalda; **todo entreno suma** al ranking;
  las categorías pasan a ser **etiqueta** opcional. Las rules ya aceptan `tipo`, `musculos[]`,
  `etiqueta`. Arrancar por un prototipo visual.
- ⬜ Lista completa de mejoras de rendimiento y orden del repo: auditoría del 2026-09-28 (ver
  worklog `2026-09-28/02` → pendientes, y el chat de esa fecha).

- ⬜ `minInstances: 1` en `verificarAcceso` para eliminar el cold start (tiene costo mensual; hoy lo
  mitiga el login optimista). — worklog `10`
- ⬜ Índice `(grupoId, fecha)` para `cargarAsistenciasMes` si el detalle de día se pone lento. — worklog `10`
- ⬜ Fichas por módulo (`docs/specs/`): diferidas. El repo es chico y `context.md` cubre los flujos;
  conviene escribirlas cuando un módulo crezca lo suficiente para que haga falta.
- Backlog de producto e ideas: `context.md` §10.

## 4. Riesgos abiertos (decisiones del dueño)

Detalle en `context.md` §9. Resumen: auto-aprobación de usuarios nuevos · **lectura abierta entre
grupos** (la escritura se cerró en la fase 1) · `userName` como clave del ranking · cruft legacy en
la raíz del repo.

## 5. Registro de deploys

| Fecha | Commit | Qué | Resultado |
|---|---|---|---|
| 2026-07-06 | `d82760f` | Hosting (automático) | ✅ Actions `28817104172` |
| 2026-07-06 | `109f130` | Hosting (automático) | ✅ Actions `28814935694` |
| 2026-07-06 | `45c638b` | Hosting (automático) | ❌ Actions falló (buildeaba en la raíz; lo arregló `109f130`) |

> Los deploys manuales (functions, rules, índices) se registran acá a mano con `/deploy`. Los
> anteriores al 2026-09-28 no quedaron registrados.
