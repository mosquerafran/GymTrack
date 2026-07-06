# Documentación del proyecto

- **Fecha:** 2026-07-06
- **Tipo:** docs
- **Estado:** ✅ hecho

## Qué
Se creó la documentación base del repositorio:
- `CLAUDE.md` — guía técnica (arquitectura, comandos, convenciones, deuda técnica).
- `context.md` — producto, usuarios, dominio, modelo de datos, riesgos, backlog.
- `protocol.md` — protocolo de trabajo, stack tecnológico, regla "los datos no se
  tocan", requisito mobile-first, checklist de cierre.
- `worklog/` — estructura de registro por fecha y tarea + este índice.

## Por qué
El repo no tenía documentación propia (solo el README por defecto de CRA). Hacía
falta un punto de entrada claro para entender la arquitectura, el dominio y las
reglas de trabajo, y un lugar donde dejar rastro de los cambios.

## Archivos tocados
- `CLAUDE.md` — nuevo
- `context.md` — nuevo
- `protocol.md` — nuevo
- `worklog/README.md` — nuevo
- `worklog/2026-07-06/*.md` — nuevos

## Cómo se verificó
Revisión de coherencia con el código real (servicios, hooks, reglas, functions).

## Notas / pendientes
El README de la raíz sigue siendo el de Create React App; se puede reemplazar más
adelante por uno propio que apunte a estos documentos.
