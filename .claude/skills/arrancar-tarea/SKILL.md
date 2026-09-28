---
name: arrancar-tarea
description: "Arranca una tarea de Gym Tracker con el contexto cargado (estado, riesgos, reglas de la zona) y propone un plan antes de tocar código. Usala al empezar una feature, un bugfix o un rediseño."
argument-hint: [qué hay que hacer]
---

# Arrancar una tarea

Tarea: **$ARGUMENTS** (si viene vacía, preguntá qué hay que hacer y pará).

## 1. Cargar el estado (no asumas nada de memoria)

- Leé **`ESTADO.md`**: qué está en producción, qué quedó pendiente, riesgos abiertos. Si la tarea
  ya figura como pendiente, arrancá desde lo que dice ahí.
- `git status` y `git log --oneline -5`. Si hay cambios sin commitear que no son tuyos,
  **mencionalos y preguntá** antes de mezclarlos con esta tarea.

## 2. Ubicar la zona

Decí qué partes toca la tarea y leé lo que corresponde **antes** de abrir el código:

| Si toca… | Leé |
|---|---|
| lectura/escritura de datos, fechas, hooks | `.claude/rules/datos-y-fechas.md` + `context.md` §5 (modelo) |
| Cloud Functions | `.claude/rules/backend.md` + `context.md` §6 |
| rules, índices, `firebase.json`, CI | `.claude/rules/firebase-config.md` |
| UI | `protocol.md` §2 (mobile-first) y §4 + la skill `frontend-design` |
| reglas de negocio (ranking, rachas, medallas) | `context.md` §4 |

## 3. El chequeo que frena todo

**¿La tarea necesita modificar, migrar o borrar datos de producción?** (Firestore o Storage de
`gym-tracker-1aaba`). Si sí → **pará y preguntá** (`protocol.md` §0). Esto incluye backfills,
"limpiezas" y renombrar campos. El camino normal es código retrocompatible con los docs existentes.

## 4. Proponer el plan y PARAR

Para cualquier cosa que no sea trivial (más de un archivo, o toca datos/rules/functions):

1. **Qué** vas a cambiar, archivo por archivo.
2. **Retrocompatibilidad**: ¿cómo quedan los documentos viejos? (ej.: `catId`/`categoriaId`).
3. **Mobile-first** si hay UI: targets táctiles, nada solo-hover, sin scroll horizontal.
4. **Tests**: qué lógica nueva lleva test.
5. **Deploy**: ¿alcanza con hosting (push a `main`) o hacen falta functions, rules o índices?
   Si hay algo manual, anotalo: va a `/deploy`.

**Esperá la aprobación del dueño antes de tocar código.** Una tarea chica y acotada (un bugfix de
una línea, un texto) puede ir directo, pero decí qué vas a hacer.
