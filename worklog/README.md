# Worklog

Registro de trabajo del proyecto, **ordenado por fecha y tarea**.

## Estructura

```
worklog/
├── README.md                    # este archivo (índice + formato)
└── YYYY-MM-DD/                   # una carpeta por día de trabajo
    ├── 01-nombre-de-tarea.md
    ├── 02-otra-tarea.md
    └── ...
```

- Una **carpeta por fecha** (`YYYY-MM-DD`).
- Un **archivo por tarea**, numerado por orden de ejecución (`01-`, `02-`…).
- El nombre del archivo describe la tarea en kebab-case.

## Formato de cada entrada

```markdown
# <Título de la tarea>

- **Fecha:** YYYY-MM-DD
- **Tipo:** bugfix | feature | docs | refactor | chore | diseño
- **Estado:** ✅ hecho | 🚧 en progreso | ⏸️ pausado

## Qué
Descripción de qué se hizo.

## Por qué
Motivo / problema que resuelve.

## Archivos tocados
- ruta/al/archivo — qué cambió

## Cómo se verificó
Comandos corridos y resultado (tsc, tests, build, prueba manual).

## Notas / pendientes
Lo que quedó abierto o a tener en cuenta.
```

## Índice por fecha

### 2026-07-06
- [01 — Documentación del proyecto](2026-07-06/01-documentacion-proyecto.md) — CLAUDE.md, context.md, protocol.md, worklog.
- [02 — Fix crítico: initializeApp duplicado](2026-07-06/02-fix-initializeapp-duplicado.md) — el backend se caía en cold start.
- [03 — Fix zona horaria (UTC-3)](2026-07-06/03-fix-zona-horaria.md) — rangos de mes/año corridos un día.
- [04 — Fix refresco del calendario en Home](2026-07-06/04-fix-refresco-home.md) — no se veía el entreno recién cargado.
- [05 — Limpieza: test por defecto y recharts](2026-07-06/05-limpieza-tests-y-deps.md) — test de CRA que fallaba + dependencia sin usar.
- [06 — Rediseño mobile-first del frontend](2026-07-06/06-rediseno-frontend-mobile.md) — identidad scoreboard + fixes táctiles.
- [07 — Métricas: constancia %, rachas, heatmap, meta semanal](2026-07-06/07-metricas-constancia-rachas-heatmap.md) — nuevas stats centradas en días.
- [08 — Podio top-3, nudge de récord y comparativa semanal](2026-07-06/08-podio-nudge-record-comparativa-semanal.md) — gamificación del ranking.
- [09 — Reskin "Hierro Forjado" + Node 22 + Actions](2026-07-06/09-reskin-rustico-node22-actions.md) — identidad rústica-moderna e infra.
- [10 — Optimización de performance](2026-07-06/10-optimizacion-performance.md) — cache de categorías, login optimista, índice del Muro.
