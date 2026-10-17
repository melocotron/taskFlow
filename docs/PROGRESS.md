# Estado del proyecto

> Lo primero que lees al empezar una sesión. Lo último que actualizas antes de parar.
> Formato: corto, concreto, sin prosa.

---

## ✅ S0.1 — Repo + Gitflow + husky + commitlint + prettier + eslint

`git init` · Angular 22 zoneless · husky (`pre-commit`/`commit-msg`/`pre-push`) ·
commitlint · eslint flat config · ramas `main`/`develop`.
**Verificado:** mensaje inválido rechazado, válido aceptado. Commit `402623e`.

## ✅ S0.2 — Esqueleto FSD + alias + boundaries

| Tarea                                                     | Estado |
| --------------------------------------------------------- | ------ |
| Carpetas `pages/ widgets/ features/ entities/ shared/`    | ✅     |
| Path aliases (`@pages/*`, `@entities/*`, `@shared/*`…)    | ✅     |
| Regla de boundaries ejecutable (dependency-cruiser)       | ✅     |
| `app.config.ts` revisado (zoneless, router, http)         | ✅     |
| `strict: true` + `noUncheckedIndexedAccess` en TypeScript | ✅     |
| Página `home` con lazy loading (chunk de 764 B)           | ✅     |
| `npm run verify` verde                                    | ✅     |

**Verificado de verdad:** se creó un import ilegal (`shared/lib` → `@entities/board`)
y el lint lo bloqueó con `shared-is-business-agnostic`. El alias se resolvió bien.
Después se borró el archivo.

---

## Sprint actual

**S0.3 — Spec Kit + constitución + primer spec**

| Tarea                                         | Estado |
| --------------------------------------------- | ------ |
| `uv tool install specify-cli`                 | ⬜     |
| `specify init` en el proyecto                 | ⬜     |
| `/speckit-constitution` con la §5.1 del plan  | ⬜     |
| Primer `/speckit-specify` (tableros y tareas) | ⬜     |
| `/speckit-clarify` + `/speckit-plan`          | ⬜     |

**Criterio de verde:** `.specify/memory/constitution.md` existe y el primer
`specs/001-*/spec.md` está aprobado, sin mencionar el stack.

---

## Dónde me quedé

S0.2 cerrado, `verify` en verde, nada a medias.

## Siguiente paso concreto

Instalar Spec Kit (ya está `uv`) e inicializarlo en el proyecto.

---

## ⚠️ Nota de entorno

El proyecto **no puede compilar, testear ni commitear en modo confinado**: esbuild
lanza un proceso hijo con tuberías y el sandbox lo corta (`spawn EPERM`). Los git
hooks tienen el mismo problema. **Trabaja en acceso total.**

Descartado también: **pnpm** (su caché global no se puede redirigir; se usa npm con
caché local en `.npm-cache/`).

---

## Bitácora

| Fecha      | Sprint | Nota                                                                                       |
| ---------- | ------ | ------------------------------------------------------------------------------------------ |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado.                              |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + husky/commitlint/eslint. Hooks verificados en ambos sentidos. |
| 2026-10-17 | S0.2   | Esqueleto FSD, alias, boundaries ejecutables. `verify` verde (2 tests, build 212 kB).      |
