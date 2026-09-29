# Foto opcional, botón de guardar pegado abajo y cuerpo visible al tildar músculos

- **Fecha:** 2026-09-28
- **Tipo:** producto + bug de UI
- **Estado:** hecho · deploy: push (hosting). Sin rules: `imagenUrl` ya aceptaba `null`.

## Qué
- **Foto opcional** (pedido del dueño; antes "sin foto no hay gains"). El formulario ya no la
  exige ("opcional" en vez de "obligatoria"); el muro no muestra el cartel "Registro sin foto de
  evidencia". Sigue haciendo falta **señal** para guardar (el guardado espera al servidor).
- **Botón "Guardar entreno" pegado abajo** (bug reportado desde el celu). Dos causas sumadas:
  1. `sticky bottom-0` dentro del panel se pega **16 px arriba del borde** (el padding del
     contenedor que scrollea) y por ese hueco se veía el contenido. → `-bottom-4`.
  2. `Hoja` agregaba su propio margen inferior (safe-area + 8 px) debajo de la barra, que ya
     tenía el suyo. → prop `barraPropia` en `Hoja` (registro y editor de categorías).
- **Cuerpo visible al tildar la lista de músculos**: con la lista abierta el cuerpo se achica y
  queda fijo arriba del panel (`sticky`), así cada tilde se ve en la figura sin volver a subir.
  Aplica también al editor de categorías.

## Docs
`CLAUDE.md` §4.5 y `context.md` (flujo de registro y reglas de producto): foto opcional.

## Cómo se verificó
- `.\verify.ps1` completo en verde.
- Producción con la sesión del dueño, ventana angosta: panel de registro abierto, sin guardar nada.
