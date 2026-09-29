# Identidad "Silverback": nombre, paleta y geometría del logo

- **Fecha:** 2026-09-28
- **Tipo:** diseño
- **Estado:** ✅ hecho · deploy: push (hosting)

## Qué
- **Nombre: Silverback** (el gorila jefe de la manada; "espalda plateada"). En `config/marca.ts`
  + `public/index.html` y `manifest.json`. Descartados: Manada (no le gustó al dueño).
- **Paleta** (de la hoja de marca): claro "Hormigón" (papel gris `#EDEDEA`, tinta `#0E0E0E`) y
  oscuro "Fragua" (negro `#0B0B0B`, hueso `#F2F2EF`). El **rojo `#E30A26`** solo en lo que importa:
  Registrar, la racha y el 1° del podio. Magnitudes (barras, mapa de calor) en tinta.
- **Tipografía**: Poppins (la de la marca) en todo; Space Mono en etiquetas. Adiós Anton/Oswald/Inter.
- **Geometría del gorila** (utilidades en `index.css`): `.chanfle` (esquina cortada a 45° en paneles
  y chips), `.losa` (tarjeta "Hoy"), `.hex` (avatares), `.rombo` (semana, botón Registrar),
  `.punta` (barras), `.escalon` (podio). Radios de Tailwind a casi cero.
- **Logo en la app**: header, marca de agua en "Hoy", login y selector de grupo.
- **Ranking** como tabla (líneas gruesas) + podio facetado. Íconos regenerados (negro + hueso).

## Por qué
Pedido del dueño: "usar más el logo", "tablas y gráficos con la estética geométrica del logo",
"blanco y negro tirando a sobrio", "un buen nombre". Maqueta con 3 paletas aprobada ("el que
recomiendes, me encantaron los 3").

## Cómo se verificó
- `.\verify.ps1` completo en verde.
- **Login visto en el navegador** (build servido local, temas claro y oscuro). Encontrado y
  arreglado: el título se partía ("SILVERBA / CK") por `break-words` + tamaño grande → ahora
  `clamp(2rem,10vw,3.75rem)` en una línea (medido: entra de 320 a 414 px). Y un recorte a 45° le
  comía el borde a los botones con contorno → esos van con esquinas rectas.
- ⚠️ Las pantallas logueadas no se pudieron ver (login de Google). Revisión del dueño en el celu.

## Notas / pendientes
- Si se quiere un modo 100% blanco y negro (la variante "Mono" de la maqueta), es cambiar los
  tokens `--color-primary` a tinta.
