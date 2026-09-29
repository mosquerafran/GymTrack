# PWA (offline, actualizaciones, instalar) + revisión visual logueada + sin emojis

- **Fecha:** 2026-09-28
- **Tipo:** feature + diseño
- **Estado:** ✅ hecho · deploy: push (hosting; `firebase.json` con headers nuevos va con el hosting)

## Qué
**PWA**
- **Service worker** (`src/service-worker.ts`, Workbox vía CRA): guarda la app (abre al instante y
  sin señal), fotos de Storage y fuentes con tope. **No toca** Firestore/Auth/Functions (los datos
  offline los maneja `persistentLocalCache` de Firestore, que ya estaba). No se actualiza solo.
- **Aviso "Hay una versión nueva · Actualizar"** (`AvisosPwa`, en la raíz: se ve también en el
  login). Busca versión nueva al volver a la app (`visibilitychange`) y detecta una que quedó
  esperando de antes.
- **"Sin conexión"**: aviso fijo; el registro no deja guardar sin señal ("Falta señal").
- **Instalar la app** (Ajustes): botón en Android/Chrome (`beforeinstallprompt`), pasos en iPhone.
- **Headers del hosting**: todo `no-cache` salvo `/static/**` (hash en el nombre) → un año, immutable.

**Revisión visual con sesión** (primera vez: el dueño abrió el Browser 2 logueado)
- El rojo solo en acciones, racha, 1° del podio, "vos" y el aviso de "no suma". Seleccionado =
  invertido en tinta (tipos, sexo, meta, categorías, períodos). Íconos de títulos en grafito.
- Calendario: días entrenados rellenos en tinta (antes, punto rojo) y semana desde el **lunes**
  (antes domingo, distinto de la tira de la semana).
- Mapa de calor: "0" y "1–2" eran casi el mismo gris → base más clara y primer nivel más marcado.
- Nombres largos cortados en podio y reyes → `nombreCorto` ("Francisco M.").
- Muro: el cuerpito también en entrenos viejos (músculos deducidos de la categoría).

**Sin emojis** (pedido del dueño: "se ven infantiles, con este estilo no va")
- Tipos de entreno con íconos de línea (`components/IconoTipo`): mancuerna, pelota de fútbol
  propia (lucide no trae; pentágono central, va con la geometría del logo), huellas y hexágono.
  `TIPOS` ya no tiene `emoji`.
- Racha del navbar con `Flame`, error de conexión con `TriangleAlert`, grupos con íconos; fuera
  los emojis de textos (racha récord, meta cumplida, "¡Épico!", calendario anual, dos chistes).
- Quedan a propósito: nombres de categorías que eligió cada usuario ("Running 🏳️‍🌈") — son sus
  datos — y `gamificationService` (medallas), que no se muestra en ninguna pantalla.

## Cómo se verificó
- `.\verify.ps1` completo en verde (rules 72/72, Jest 56/56, build).
- **Offline real**: build servido local, service worker activo con 18 archivos guardados;
  **apagado el servidor y recargado → la app abrió igual** (con Poppins cacheada).
- **Actualización real**: dos builds distintos → apareció el aviso, "Actualizar" tomó la versión
  nueva y recargó. Hallazgo: el aviso no se montaba en el login → movido a la raíz.
- **App logueada en el celu (420 px, Browser 2 del dueño)**: Inicio, Ranking, Muro, Ajustes. Solo
  lectura, sin guardar nada. De ahí salieron los ajustes de arriba.

## Notas / pendientes
- Registrar sin señal (guardar el entreno con la foto y subirlo después) no está: hoy avisa.
- Login en la app instalada de iPhone (`signInWithPopup` en standalone): probar en un iPhone.
- App Check: descartado por ahora (bajo beneficio con la fase 2, riesgo de dejar a todos afuera).
