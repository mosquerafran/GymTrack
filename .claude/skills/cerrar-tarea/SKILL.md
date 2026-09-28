---
name: cerrar-tarea
description: "Cierra una tarea de Gym Tracker: verificación en verde, worklog, ESTADO.md y docs al día, checklist del protocolo. Usala antes de dar algo por terminado o de commitear."
---

# Cerrar una tarea

No se reporta "listo" sin pasar por acá. El orden importa: primero lo que puede fallar.

## 1. Verificación

```powershell
.\verify.ps1
```

Tiene que terminar con **exit 0** (`VERIFICACIÓN EN VERDE`). Reportá el resultado real: si algo
falla, se dice con el error, no se maquilla. `-Rapido` saltea el build y sirve mientras iterás,
**no** para cerrar.

Si hubo UI: revisala en viewport mobile (~375 px). Si no la pudiste ver (el login con Google no
se automatiza), **decilo**: queda como verificación pendiente del dueño.

## 2. Worklog

Una entrada nueva en `worklog/AAAA-MM-DD/NN-slug.md` con el formato de `worklog/README.md` (qué,
por qué, archivos tocados, cómo se verificó, pendientes), y su línea en el índice del README.
Si encontraste algo en el camino (un bug, un doc que mentía), va en la entrada: **los hallazgos
valen más que la lista de cambios**.

## 3. Estado y docs

- **`ESTADO.md`**: qué quedó pendiente, y qué necesita el **próximo deploy** (sobre todo lo
  manual: functions, rules, índices).
- Si cambió el **modelo de datos** o un **flujo** → `context.md` §3-§5.
- Si cambió una **regla durable** o un comando → `CLAUDE.md` (respetando las 200 líneas que
  controla `verify.ps1`), o la rule de la zona en `.claude/rules/`.
- **Buscá drift**: si un doc afirma algo sobre lo que tocaste ("trae todo y recorta en el
  cliente", "Node 20"), verificalo con un `grep` y corregilo en el mismo cambio.

## 4. Checklist de `protocol.md` §8

Recorrelo y decí explícitamente cada punto que aplica: datos intactos, retrocompatibilidad, fechas
con `utils/date`, constantes sincronizadas, mobile-first.

## 5. Commit

**Solo si el dueño lo pide** (`protocol.md` §6). Proponé el mensaje en español, descriptivo.
⚠️ **Pushear a `main` deploya el hosting a producción** (GitHub Actions). El hook de
`.claude/settings.json` corre `verify.ps1` antes de cada push y lo bloquea si falla.
