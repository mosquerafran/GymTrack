# Fix crítico: `initializeApp()` duplicado en el backend

- **Fecha:** 2026-07-06
- **Tipo:** bugfix
- **Estado:** ✅ hecho
- **Severidad:** 🔴 crítica

## Qué
Se eliminó la llamada duplicada a `initializeApp()` de
`backend/src/auth/onUserCreated.js`. Queda un único `initializeApp()`
centralizado en `backend/src/index.js`.

## Por qué
En el working tree se había agregado `initializeApp()` a `index.js`, pero
`onUserCreated.js` **también** lo llamaba. Como `index.js` requiere ese módulo al
cargar, se ejecutaban dos `initializeApp()` sin nombre → Firebase Admin lanza
*"The default Firebase app already exists"*, tumbando el **cold start de todas las
Cloud Functions**. Con esto, ninguna función (login, aprobaciones, reparaciones)
habría arrancado tras el deploy.

De paso se removieron imports `getAuth` sin usar en `onUserCreated.js` y
`verificarAcceso.js`.

## Archivos tocados
- `backend/src/auth/onUserCreated.js` — quitado `initializeApp()` e import `getAuth`; comentario explicando la regla.
- `backend/src/auth/verificarAcceso.js` — quitado import `getAuth` sin usar.

## Cómo se verificó
Búsqueda global de `initializeApp` para confirmar una sola llamada en el backend
(`index.js`). Revisión de que ningún módulo restante dependa del `getAuth`
removido.

## Notas / pendientes
Al desplegar functions, confirmar en logs que arrancan sin el error de app
duplicada.
