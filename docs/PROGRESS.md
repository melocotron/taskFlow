# Estado del proyecto

> Lo primero que lees al empezar una sesión. Lo último que actualizas antes de parar.
> Formato: corto, concreto, sin prosa.

---

## ✅ S0.1 — Repo + Gitflow + husky + commitlint + prettier + eslint

`git init` · Angular 22 zoneless · husky (`pre-commit`/`commit-msg`/`pre-push`) ·
commitlint · eslint flat config · ramas `main`/`develop`.
**Verificado:** mensaje inválido rechazado, válido aceptado. Commit `402623e`.

## ✅ S0.2 — Esqueleto FSD + alias + boundaries

Carpetas por capa · aliases `@pages`/`@entities`/`@shared`/… · fronteras ejecutables
con dependency-cruiser · `strict: true` · página `home` lazy (chunk 764 B).
**Verificado:** un import `shared → entities` fue bloqueado por el lint.

## ✅ S0.3 — Spec Kit + constitución + primer spec

| Tarea                                                   | Estado      |
| ------------------------------------------------------- | ----------- |
| `specify-cli` 0.14.3 instalado con `uv`                 | ✅          |
| `specify init` (integración `claude`, skills)           | ✅          |
| 10 skills `speckit-*` visibles para DSH                 | ✅          |
| `.specify/memory/constitution.md` v1.0.0 (8 principios) | ✅          |
| `specs/001-boards-and-tasks/spec.md`                    | ✅ borrador |
| Spec sin mencionar el stack                             | ✅          |
| Spec **aprobada por ti**                                | ⬜          |

**Criterio de verde:** constitución escrita y spec aprobada. Falta tu lectura del
spec — está en `specs/001-boards-and-tasks/spec.md`.

---

## Sprint actual

**S0.4 — Playwright + CI**

| Tarea                                       | Estado |
| ------------------------------------------- | ------ |
| Playwright instalado y configurado          | ⬜     |
| Un primer E2E de humo (home carga)          | ⬜     |
| GitHub Action: format + lint + test + build | ⬜     |
| Badge en README                             | ⬜     |

**Criterio de verde:** `npm run e2e` pasa en local y el workflow existe con los pasos
correctos (aunque el repo aún no esté en GitHub).

---

## Dónde me quedé

S0.3 cerrado salvo tu aprobación del spec. Nada a medias: `verify` verde.

## Siguiente paso concreto

Leer `specs/001-boards-and-tasks/spec.md` y responder a las 3 dudas de `clarify`
(autenticación simulada, tiempo real y orden de tarjetas).

---

## ⚠️ Nota de entorno

El proyecto **no puede compilar, testear ni commitear en modo confinado**: esbuild
lanza un proceso hijo con tuberías y el sandbox lo corta (`spawn EPERM`). Los git
hooks tienen el mismo problema. **Trabaja en acceso total.**

Descartado: **pnpm** (su caché global no se puede redirigir; se usa npm con caché
local en `.npm-cache/`).

---

## Bitácora

| Fecha      | Sprint | Nota                                                                                       |
| ---------- | ------ | ------------------------------------------------------------------------------------------ |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado.                              |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + husky/commitlint/eslint. Hooks verificados en ambos sentidos. |
| 2026-10-17 | S0.2   | Esqueleto FSD, alias, boundaries ejecutables. `verify` verde (2 tests, 212 kB).            |
| 2026-10-17 | S0.3   | Spec Kit + constitución v1.0.0 + spec 001 en borrador.                                     |
