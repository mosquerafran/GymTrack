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
| **Firestore rules** | ⚠️ **sin registro** | Ídem |
| **Índice `asistencias(grupoId, timestamp desc)`** | ⚠️ **sin registro** | Ídem. El muro tiene fallback, así que **funciona igual aunque falte** |
| **Storage rules** | ⚠️ **sin registro** | Ídem |

Desde `d82760f` no hubo cambios de código de la app: lo posterior es el harness de Claude Code
(2026-09-28), que no se deploya.

## 2. 🔴 Requiere acción

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

- ⬜ `minInstances: 1` en `verificarAcceso` para eliminar el cold start (tiene costo mensual; hoy lo
  mitiga el login optimista). — worklog `10`
- ⬜ Índice `(grupoId, fecha)` para `cargarAsistenciasMes` si el detalle de día se pone lento. — worklog `10`
- ⬜ Fichas por módulo (`docs/specs/`): diferidas. El repo es chico y `context.md` cubre los flujos;
  conviene escribirlas cuando un módulo crezca lo suficiente para que haga falta.
- Backlog de producto e ideas: `context.md` §10.

## 4. Riesgos abiertos (decisiones del dueño)

Detalle en `context.md` §9. Resumen: auto-aprobación de usuarios nuevos · `grupos` editable por
cualquier autenticado · `userName` como clave del ranking · cruft legacy en la raíz del repo.

## 5. Registro de deploys

| Fecha | Commit | Qué | Resultado |
|---|---|---|---|
| 2026-07-06 | `d82760f` | Hosting (automático) | ✅ Actions `28817104172` |
| 2026-07-06 | `109f130` | Hosting (automático) | ✅ Actions `28814935694` |
| 2026-07-06 | `45c638b` | Hosting (automático) | ❌ Actions falló (buildeaba en la raíz; lo arregló `109f130`) |

> Los deploys manuales (functions, rules, índices) se registran acá a mano con `/deploy`. Los
> anteriores al 2026-09-28 no quedaron registrados.
