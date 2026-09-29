# Calendario con rombos (sin bloques negros)

- **Fecha:** 2026-09-28
- **Tipo:** diseño
- **Estado:** hecho · deploy: push (hosting)

## Qué
El dueño: "se ve muy feo tan blanco y negro el calendario". Maqueta con 3 opciones (rombo, esquina,
losa), claro y oscuro, con sus entrenos reales → eligió **rombo**.
- Día entrenado: número en negrita + un rombo en tinta debajo por entreno (hasta 3), el mismo
  rombo de "Esta semana". Lector de pantalla: "entrenaste" / "entrenaste N veces".
- Hoy: borde rojo y número rojo, sin relleno.
- Leyenda chica abajo: rombo = entrenaste, borde rojo = hoy (el dueño preguntó qué era cada color).

## Hallazgo
Varios colores del calendario **no eran nuestros**: venían del CSS por defecto de react-calendar y
le ganaban a los overrides por especificidad u orden. Días futuros en gris `#f0f0f0` (bloque claro
también en modo oscuro), `:hover`/`:focus` en `#e6e6e6` (el día tocado quedaba gris claro en oscuro),
"hoy" amarillo por debajo y el azul de "activo". Ahora `index.css` los pisa todos con tokens.

## Cómo se verificó
- `.\verify.ps1` completo en verde.
- Revisado en producción con la sesión del dueño (Browser 2) después del deploy.
