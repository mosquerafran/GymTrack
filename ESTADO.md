# ESTADO.md — dónde estamos hoy

> **Última actualización: 2026-09-28.**
> Este es el único archivo con **estado que caduca**: qué hay en producción, qué falta, qué riesgo
> está abierto. Las reglas durables van en `CLAUDE.md`; el producto, en `context.md`. Al cerrar una
> tarea se actualiza **acá** (`/cerrar-tarea`).

---

## 1. Producción

| Pieza | Estado | Cómo se sabe |
|---|---|---|
| **Hosting** | ✅ `06eb430` (PWA + sin emojis), deployado el 2026-09-28 | GitHub Actions, *success* |
| **Sitios** | `gym-tracker-1aaba.web.app` (el de siempre) y **`silverback-gym.web.app`** (creado el 2026-09-28; `silverback` estaba tomado). Mismo build: `firebase.json` tiene los dos | `firebase hosting:sites:create silverback-gym` |
| **Functions** | ✅ las 6 en **Node.js 22** (2nd Gen), deployadas el 2026-09-28 (`4bc4c46`), incluye `crearGrupo` y `unirseAGrupo` | `firebase deploy --only functions` → *Deploy complete* |
| **Firestore rules** | ✅ `90b5c3b` (fase 2 + validación de tipo/músculos de categorías), deployadas el 2026-09-28 | `firebase deploy --only firestore:rules,storage` → *Deploy complete* |
| **Índice `asistencias(grupoId, timestamp desc)`** | ⚠️ **sin registro** | Ídem. El muro tiene fallback, así que **funciona igual aunque falte** |
| **Storage rules** | ✅ fase 1 (`5312c4f`), deployadas el 2026-09-28 | Ídem |

El 2026-09-28 se endurecieron las rules (worklog `2026-09-28/02`): primero el hosting, después las
rules, en ese orden. ⏳ **Smoke en el celu pendiente** (ver §2).

## 2. 🔴 Requiere acción

000. ✅ **`silverback-gym.web.app` autorizado en Firebase Auth** (2026-09-28, confirmado con la config
    pública del proyecto). Falta: que cada uno entre por la nueva, se loguee e instale la app desde ahí.

00. **Smoke de la seguridad fase 2** (deployada completa el 2026-09-28): en el celu, muro, calendario,
    detalle del día y Stats cargan; Ajustes → Administrar grupo muestra los miembros; alguien se une
    con código. Si algo falla, volver con
    `git show ce634a2:firestore.rules > firestore.rules` + `firebase deploy --only firestore:rules`.

0. **Smoke de la fase 1 de seguridad (deployada el 2026-09-28).** En el celu: la app carga el grupo,
   registrar + editar un entreno con foto, muro/ranking/calendario, aprobar a alguien en Aprobaciones
   (antes estaba rota) y que alguien se una con código. Si algo falla: rollback con
   `git show d82760f:firestore.rules > firestore.rules` + `firebase deploy --only firestore:rules`.

1. ✅ **Functions en Node 22**: confirmado en el deploy del 2026-09-28 ("creating Node.js 22 (2nd Gen)").
2. **Confirmar que el índice del muro está construido.** Consola de Firebase → Firestore → Índices,
   o `! firebase firestore:indexes` (solo lectura). Si falta, el muro sigue leyendo **todo** el grupo
   (el problema que la optimización del 2026-07-06 venía a resolver) y **nadie lo nota**.

## 3. Pendientes (sin fecha)


- ⬜ **App Check**: descartado por ahora (bajo beneficio con la fase 2; si se activa mal deja a todos
  afuera). Retomar si la app sale del grupo de amigos.
- ⬜ **PWA, lo que falta**: registrar sin señal (guardar y subir después) y probar el login en la app
  instalada de iPhone. Offline, actualizaciones e instalar: hechos (worklog `2026-09-28/08`).
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
| 2026-09-28 | `06eb430` | Hosting (automático): PWA, revisión visual, sin emojis (el primer intento `d9dab0b` falló en `npm ci`: lock de npm 11) | ✅ Actions |
| 2026-09-28 | `90b5c3b` | Firestore rules: categorías con tipo/músculos | ✅ *Deploy complete* |
| 2026-09-28 | `a3fe920` | Hosting (automático): identidad Silverback | ✅ Actions `36507607167` |
| 2026-09-28 | `90b5c3b` | Hosting (automático): categorías plantilla, qué suma, varios por día | ✅ Actions `36506165018` |
| 2026-09-28 | `0e5d0d2` | Hosting (automático): logo e íconos | ✅ Actions `36505255410` |
| 2026-09-28 | `4bc4c46` | Firestore rules fase 2 (manual, en orden) | ✅ *Deploy complete* |
| 2026-09-28 | `ac7799b` | Hosting (automático): frontend fase 2 | ✅ Actions `36504460641` |
| 2026-09-28 | `4bc4c46` | Functions (manual): + crearGrupo, unirseAGrupo; todas a Node 22 | ✅ *Deploy complete* |
| 2026-09-28 | `ce634a2` | Firestore rules: **vuelta atrás** tras el incidente | ✅ prod = reglas de `ce634a2` |
| 2026-09-28 | `4bc4c46` | Índices + **reglas fase 2 por error** (typo `firestore:indexe`) | ⚠️ revertido minutos después |
| 2026-09-28 | `b174d8a` | Hosting (automático): tanda 2, pulido mobile | ✅ Actions `36502998148` |
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
