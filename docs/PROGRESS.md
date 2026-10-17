# Estado del proyecto

> Lo primero que lees al empezar una sesión. Lo último que actualizas antes de parar.
> Formato: corto, concreto, sin prosa.

---

## ✅ S0.1 — Repo + Gitflow + husky + commitlint + prettier + eslint (completado)

| Tarea                                          | Estado |
| ---------------------------------------------- | ------ |
| `git init` en `main`                           | ✅     |
| Angular 22 scaffoldeado (zoneless, Vitest)     | ✅     |
| Dependencias instaladas                        | ✅     |
| Husky activo (`core.hooksPath = .husky/_`)     | ✅     |
| `pre-commit` → lint-staged (eslint + prettier) | ✅     |
| `commit-msg` → commitlint                      | ✅     |
| `pre-push` → `npm run test:ci`                 | ✅     |
| ESLint (angular-eslint 22, flat config)        | ✅     |
| Prettier + prettierignore                      | ✅     |
| Rama `develop` creada                          | ✅     |
| Commit inválido rechazado (verificado)         | ✅     |
| Commit válido aceptado (verificado)            | ✅     |

**Criterio de verde cumplido.** `git commit -m "asdf"` → rechazado con 3 errores.
`chore(setup): inicializa workspace Angular 22…` → aceptado. Commit `402623e`.

---

## Sprint actual

**S0.2 — Esqueleto FSD + alias + boundaries en eslint**

| Tarea                                                        | Estado |
| ------------------------------------------------------------ | ------ |
| Crear carpetas `pages/ widgets/ features/ entities/ shared/` | ⬜     |
| Path aliases en `tsconfig.json` (`@pages/*`, `@shared/*`…)   | ⬜     |
| Regla de boundaries (lint falla si rompe la flecha)          | ⬜     |
| `app.config.ts` revisado (zoneless, errores, http)           | ⬜     |
| `ng test` verde                                              | ⬜     |
| `ng build` verde                                             | ⬜     |

**Criterio de verde:** `npm run build` y `npm run test:ci` pasan; un import ilegal
(`shared` importando `entities`) hace fallar el lint.

---

## Dónde me quedé

S0.1 cerrado y commiteado en `main` y `develop`. Nada a medias.

## Siguiente paso concreto

Abrir `feature/S0.2-fsd-skeleton` desde `develop` y crear el esqueleto de carpetas.

---

## ⚠️ Nota de entorno (importante para futuras sesiones)

Este proyecto **no puede compilar, testear ni commitear en modo confinado**:
Angular usa esbuild, que lanza un proceso hijo con tuberías, y el sandbox del
harness lo bloquea con `spawn EPERM`. Los `git hooks` tienen el mismo problema
(lint-staged lanza eslint).

**Consecuencia:** trabaja esta sesión en **acceso total**. Si vuelve a modo
`workspace-write`, `ng build`, `ng test`, `ng serve` y `git commit` fallarán.

---

## Bitácora

| Fecha      | Sprint | Nota                                                                                       |
| ---------- | ------ | ------------------------------------------------------------------------------------------ |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado: el sandbox bloquea su caché. |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + husky/commitlint/eslint. Hooks verificados en ambos sentidos. |
