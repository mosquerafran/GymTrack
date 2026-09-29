# ESTADO.md — dónde estamos hoy

> **Última actualización: 2026-09-28.**
> Este es el único archivo con **estado que caduca**: qué hay en producción, qué falta, qué riesgo
> está abierto. Las reglas durables van en `CLAUDE.md`; el producto, en `context.md`. Al cerrar una
> tarea se actualiza **acá** (`/cerrar-tarea`).

---

## 1. Producción

| Pieza | Estado | Cómo se sabe |
|---|---|---|
| **Hosting** | ✅ `ce634a2` (registro con cuerpo + stats por músculo), deployado el 2026-09-28 | GitHub Actions, run `36501859965`, *success* |
| **Functions** | ⚠️ **sin registro** | Se deployan a mano y el repo no guarda el resultado |
| **Firestore rules** | ✅ `ce634a2` (fase 1 + validación de `sexo` y `tipo`), deployadas el 2026-09-28 | `firebase deploy --only firestore:rules,storage` → *Deploy complete* |
| **Índice `asistencias(grupoId, timestamp desc)`** | ⚠️ **sin registro** | Ídem. El muro tiene fallback, así que **funciona igual aunque falte** |
| **Storage rules** | ✅ fase 1 (`5312c4f`), deployadas el 2026-09-28 | Ídem |

El 2026-09-28 se endurecieron las rules (worklog `2026-09-28/02`): primero el hosting, después las
rules, en ese orden. ⏳ **Smoke en el celu pendiente** (ver §2).

## 2. 🔴 Requiere acción

0. **Smoke de la fase 1 de seguridad (deployada el 2026-09-28).** En el celu: la app carga el grupo,
   registrar + editar un entreno con foto, muro/ranking/calendario, aprobar a alguien en Aprobaciones
   (antes estaba rota) y que alguien se una con código. Si algo falla: rollback con
   `git show d82760f:firestore.rules > firestore.rules` + `firebase deploy --only firestore:rules`.

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
- ⬜ **PWA**: service worker/offline, ícono maskable real, y probar el login en la app instalada de iOS
  (`signInWithPopup` en standalone). Ver worklog `2026-09-28/04` → pendientes.
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
| 2026-09-28 | `ce634a2` | Firestore rules (manual): + `sexo` y `tipo` | ✅ *Deploy complete* |
| 2026-09-28 | `ce634a2` | Hosting (automático): registro con cuerpo + stats por músculo | ✅ Actions `36501859965` |
| 2026-09-28 | `5312c4f` | Firestore + Storage rules (manual, fase 1) | ✅ *Deploy complete* · smoke pendiente |
| 2026-09-28 | `5312c4f` | Hosting (automático) | ✅ Actions `36497621840` |
| 2026-09-28 | `0f91c30` | Hosting (automático, sin cambios de app) | ✅ Actions `36495826376` |
| 2026-07-06 | `d82760f` | Hosting (automático) | ✅ Actions `28817104172` |
| 2026-07-06 | `109f130` | Hosting (automático) | ✅ Actions `28814935694` |
| 2026-07-06 | `45c638b` | Hosting (automático) | ❌ Actions falló (buildeaba en la raíz; lo arregló `109f130`) |

> Los deploys manuales (functions, rules, índices) se registran acá a mano con `/deploy`. Los
> anteriores al 2026-09-28 no quedaron registrados.
