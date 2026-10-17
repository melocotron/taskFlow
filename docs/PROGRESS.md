# Estado del proyecto

> Lo primero que lees al empezar una sesión. Lo último que actualizas antes de parar.
> Formato: corto, concreto, sin prosa.

---

## ✅ Fase 0 — Cimientos (4/4)

### S0.1 — Repo + Gitflow + husky + commitlint + prettier + eslint

`git init` · Angular 22 zoneless · husky (`pre-commit`/`commit-msg`/`pre-push`) ·
commitlint · eslint flat config · ramas `main`/`develop`.
**Verificado:** mensaje inválido rechazado, válido aceptado.

### S0.2 — Esqueleto FSD + alias + boundaries

Carpetas por capa · aliases `@pages`/`@entities`/`@shared`/… · fronteras ejecutables
con dependency-cruiser · `strict: true` · página `home` lazy (chunk 764 B).
**Verificado:** un import `shared → entities` fue bloqueado por el lint.

### S0.3 — Spec Kit + constitución + spec 001

`specify` 0.14.3 · 10 skills `speckit-*` activas · constitución v1.0.0 con 8 principios
· **spec 001 aprobada** con 4 historias, 13 requisitos y 4 aclaraciones resueltas
(sin servidor, sin login, sin tiempo real, orden manual).

### S0.4 — Playwright + CI

Playwright con `webServer` (un solo comando levanta `ng serve`) · smoke test por rol ·
GitHub Action con dos jobs: `quality` (formato, lint, tests, build) y `e2e`
(Chromium + artefacto del reporte si falla).
**Verificado:** `npm run e2e` pasa en local (1 test, 17.6 s).

---

## Sprint actual

**Fase 1 · S1.1 — Dirección visual**

| Tarea                                                  | Estado |
| ------------------------------------------------------ | ------ |
| Explorar dominio (5+ conceptos), mundo de color, firma | ⬜     |
| Nombrar 3 defaults a rechazar                          | ⬜     |
| Proponer 3 direcciones y elegir una                    | ⬜     |
| Guardar la decisión en `.interface-design/system.md`   | ⬜     |

**Criterio de verde:** una dirección elegida y escrita, con paleta, tipografía,
densidad y elemento firma justificados. **Sin CSS todavía.**

---

## Dónde me quedé

Fase 0 completa. Nada a medias: `verify` verde, `e2e` verde, CI escrito.

## Siguiente paso concreto

Cargar la skill `interface-design`, hacer la exploración de dominio de TaskFlow y
presentarte 3 direcciones visuales para que elijas.

---

## ⚠️ Nota de entorno

El proyecto **no puede compilar, testear ni commitear en modo confinado**: esbuild
lanza un proceso hijo con tuberías y el sandbox lo corta (`spawn EPERM`). Los git
hooks tienen el mismo problema. **Trabaja en acceso total.**

Descartado: **pnpm** (su caché global no se puede redirigir; se usa npm con caché
local en `.npm-cache/`).

`npm run verify` no incluye E2E a propósito: es el chequeo rápido de cada commit.
Los E2E corren en CI y antes de un merge a `main`.

---

## Bitácora

| Fecha      | Sprint | Nota                                                                     |
| ---------- | ------ | ------------------------------------------------------------------------ |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado.            |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + husky/commitlint/eslint. Hooks verificados. |
| 2026-10-17 | S0.2   | Esqueleto FSD, alias, boundaries ejecutables. `verify` verde.            |
| 2026-10-17 | S0.3   | Spec Kit + constitución v1.0.0 + spec 001 aprobada.                      |
| 2026-10-17 | S0.4   | Playwright + smoke test + GitHub Action. Fase 0 cerrada.                 |
