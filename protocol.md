# protocol.md — Protocolo de trabajo

Reglas de proceso para trabajar en Gym Tracker. `CLAUDE.md` explica la
arquitectura, `context.md` el producto; **este archivo manda sobre CÓMO se
trabaja**. Si algo acá choca con la comodidad de una tarea, gana este archivo.

---

## 0. Regla de oro — LOS DATOS NO SE TOCAN

🚫 **Nunca** se modifican, migran, borran ni sobrescriben datos de producción
(Firestore / Storage del proyecto `gym-tracker-1aaba`) sin autorización explícita
y por escrito del dueño para esa acción puntual.

- Prohibido: scripts que hagan `set/update/delete` masivos sobre colecciones,
  cambiar nombres de campos existentes, backfills, "limpiezas" de datos.
- Los cambios de **código** que alteren cómo se leen/escriben datos deben ser
  **retrocompatibles** con los documentos ya existentes (ver la compatibilidad
  `catId`/`categoriaId` como ejemplo del estándar esperado).
- Para probar contra datos, usar el **emulador de Firebase**, nunca producción.
- Cambiar `firestore.rules` o `storage.rules` cuenta como algo sensible: revisar
  que no rompa el acceso de los usuarios actuales antes de desplegar.

Si una tarea parece requerir tocar datos, **frená y preguntá** antes de hacerlo.

---

## 1. Stack tecnológico (con el que trabajamos)

| Capa | Tecnología | Versión / nota |
|------|------------|----------------|
| UI | **React** | 19 (function components + hooks) |
| Lenguaje | **TypeScript** | strict; `@types/react` 18 (desfasaje tolerado por `skipLibCheck`) |
| Build/tooling | **Create React App** (`react-scripts`) | 5.0.1 (Webpack + Babel + Jest bajo el capó) |
| Estilos | **Tailwind CSS** | config propia con tokens semánticos (`primary`, `accent`, `surface`, `surfaceHighlight`, `textMain`, `textMuted`, `borderBase`, `background`) + `darkMode: 'class'` |
| Íconos | **lucide-react** | — |
| Modales/alertas | **sweetalert2** | estilizado con variables CSS del tema |
| Calendario | **react-calendar** | 6 |
| Imágenes | **browser-image-compression** | compresión en cliente (máx 1MB / 1024px) |
| Datos | **Firebase Web SDK** | v12 — Firestore (persistencia offline multi-tab), Auth (Google), Storage |
| Backend | **Cloud Functions** | Node 20, `firebase-functions` v2, `firebase-admin` |
| Infra | **Firebase** | Hosting + Firestore + Storage + Functions; CI de deploy con GitHub Actions |
| Ruteo | **react-router-dom** 7 | `BrowserRouter` (la navegación interna hoy es por estado `view`, no por rutas) |

**No** hay: Redux u otro state manager global (se usan hooks + props), CSS-in-JS
como sistema principal (Tailwind manda), ni SSR (es SPA/PWA client-side).

---

## 2. Mobile-first — requisito de primera clase

La mayoría de los usuarios entra desde el **teléfono, en el gimnasio**. Toda UI
nueva o modificada debe estar pensada **primero para mobile**:

- **Diseñá en el breakpoint chico primero**, después escalá con `sm: md: lg:`.
  El default (sin prefijo) es la vista mobile.
- **Áreas táctiles** mínimo ~44×44px. Nada de botones o íconos clickeables de 16px
  sueltos. Espaciado generoso entre targets.
- **Una sola columna** en mobile; grids solo desde `md:`/`lg:`.
- **Respetá el safe-area** (notch / barra de gestos): la barra inferior ya usa
  padding; mantenelo. La meta `viewport-fit=cover` está en `index.html`.
- **Nada de hover como única vía de acción.** Hoy varias acciones (editar/borrar en
  `DiaDetalle`, `CategoriaCreator`) aparecen solo con `group-hover` → en mobile no
  hay hover y quedan **inaccesibles**. Al tocar UI, asegurate de que las acciones
  sean visibles/accesibles con tap.
- **Texto legible**: cuidado con los `text-[9px]/[10px]` decorativos; que la
  información importante no baje de ~12px.
- **Sin scroll horizontal** del `body`. Contenido ancho (tablas, filas de PRs) va
  en un contenedor con `overflow-x-auto` propio.
- **Probá el teclado virtual**: inputs numéricos con `inputMode`/`type` correctos.
- Mantené `dark` y `light` funcionando en ambos (el toggle usa la clase en `<html>`).

---

## 3. Estándar de código

1. Datos → siempre por `services/` (tipado, sin JSX). No importar
   `firebase/firestore` desde páginas/componentes salvo casos legacy ya existentes.
2. Fechas → helpers de `src/utils/date.ts`. **Nunca** `toISOString()` para la clave
   de un día (bug de UTC-3 ya corregido; no reintroducirlo).
3. Tipos → reutilizar/extender `src/types/index.ts`. Evitar `any`; si se usa, dejar
   comentado por qué.
4. Constantes admin/VIP → actualizar **ambos** `constants.js` (front y back).
5. `initializeApp()` del backend → solo en `index.js`, una vez.
6. Escrituras retrocompatibles; nombres de campos existentes **no se renombran**.
7. Textos de UI en **español rioplatense**, en la voz del producto (ver §7 del skill
   de diseño). Botones en voz activa: "Guardar entrenamiento", no "Enviar".

---

## 4. Diseño / UI

Al crear o reformar UI, seguir el skill **`.claude/skills/frontend-design.md`**:
elecciones deliberadas de paleta, tipografía y layout; un "elemento firma"; nada
que se sienta un template genérico. Mantener el sistema de tokens de Tailwind ya
existente (no hardcodear hex sueltos salvo que se actualice el token).

Piso de calidad no negociable: responsive hasta mobile, foco de teclado visible,
`prefers-reduced-motion` respetado, contraste suficiente en dark y light.

---

## 5. Verificación antes de dar algo por hecho

Correr desde `frontend/`:
```bash
npx tsc --noEmit        # typecheck limpio
CI=true npm test        # tests en verde
npm run build           # el build de producción compila
```
Para cambios de UI, además revisar en viewport mobile (DevTools ~375px de ancho).
No reportar "listo" sin haber verificado. Si un test/typecheck falla, se dice con
el error, no se maquilla.

---

## 6. Git y despliegue

- Trabajar en `main` está permitido en este repo chico, pero **commitear/pushear
  solo cuando el dueño lo pida**.
- Mensajes de commit en español, descriptivos (el repo usa emojis; opcional).
- Deploy: `firebase deploy` (o `--only hosting|functions|firestore:rules|storage`).
  El hosting sirve `frontend/build`, así que buildear antes.
- Nunca desplegar reglas o functions sin haber verificado que no rompen el acceso
  actual.

---

## 7. Worklog — dejá rastro

Cada bloque de trabajo se documenta en `worklog/` (una carpeta por fecha,
`YYYY-MM-DD/`, con un `.md` por tarea). Ver `worklog/README.md` para el formato.
Registrar: qué se hizo, por qué, archivos tocados y cómo se verificó.

---

## 8. Checklist rápido (antes de cerrar una tarea)

- [ ] No se tocaron datos de producción.
- [ ] Escrituras/lecturas retrocompatibles; sin renombrar campos.
- [ ] Fechas con `utils/date`, no `toISOString()`.
- [ ] Constantes sincronizadas front/back (si aplica).
- [ ] Mobile-first: targets táctiles, sin acciones solo-hover, sin scroll-x del body.
- [ ] `tsc --noEmit`, `npm test` y `npm run build` en verde.
- [ ] Worklog actualizado.
