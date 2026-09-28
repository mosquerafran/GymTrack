---
name: deploy
description: "Prepara y guía un deploy de Gym Tracker a Firebase (hosting, functions, rules, índices). El agente arma el plan y los comandos; el dueño ejecuta el deploy."
argument-hint: [hosting | functions | rules | indexes | todo]
disable-model-invocation: true
---

# Deploy de Gym Tracker

Alcance pedido: **$ARGUMENTS** (si viene vacío, deducilo del paso 1 y confirmalo).

> 🔒 **El agente NO ejecuta `firebase deploy`**: está denegado en `.claude/settings.json`. Tu trabajo
> es dejar todo listo y darle al dueño los comandos exactos para que los corra con
> `! firebase deploy ...` desde el prompt.

## 1. Qué hay que deployar

Compará lo que cambió desde el último deploy registrado en `ESTADO.md`:

```bash
git log --oneline <último-deploy>..HEAD -- backend/ firestore.rules storage.rules firestore.indexes.json frontend/
```

| Cambió… | Se deploya con | Cómo |
|---|---|---|
| `frontend/` | hosting | **Automático al pushear a `main`** (`firebase-hosting-merge.yml`). No hace falta CLI |
| `backend/` | `--only functions` | Manual |
| `firestore.rules` | `--only firestore:rules` | Manual — **sensible** |
| `firestore.indexes.json` | `--only firestore:indexes` | Manual |
| `storage.rules` | `--only storage` | Manual — **sensible** |

## 2. Antes

- [ ] `.\verify.ps1` en verde (exit 0).
- [ ] **Rules**: ¿los usuarios actuales siguen pudiendo hacer lo que ya hacen? Probalo con el
      emulador (`firebase emulators:start`). Nunca contra producción.
- [ ] **Orden**: índices y rules **antes** que el código que los necesita. Si un cambio de frontend
      depende de un índice nuevo, primero se deploya el índice y recién después se pushea a `main`.
- [ ] **Functions**: van con el runtime de `backend/package.json` (Node 22). Un deploy de functions
      es lo que las saca de Node 20 (decomisionado el 30/10/2026).

## 3. Los comandos (los corre el dueño)

Dale uno por línea, en orden, con el `!` adelante:

```
! firebase deploy --only firestore:indexes
! firebase deploy --only firestore:rules
! firebase deploy --only functions
```

Para hosting: el push a `main` lo hace solo. Si el dueño quiere forzarlo sin push:
`! cd frontend; npm run build; cd ..; firebase deploy --only hosting`.

## 4. Después (smoke)

Pedile al dueño que pruebe **desde el teléfono**:
- [ ] Entrar con Google (la app carga; si hubo cambio de functions, que no quede en "verificando").
- [ ] Registrar un entreno con foto (y borrarlo, si fue de prueba).
- [ ] Muro, ranking y calendario cargan.

Si se deployaron functions: `! firebase functions:log` para ver errores de cold start.

## 5. Registrar

Actualizá **`ESTADO.md`** → "Producción": fecha, commit, qué se deployó y el resultado del smoke.
Si algo quedó sin deployar, que quede escrito ahí: el repo es la única memoria de qué hay en prod.
