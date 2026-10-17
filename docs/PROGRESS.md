# Estado del proyecto

> Lo primero que lees al empezar una sesión. Lo último que actualizas antes de parar.
> Formato: corto, concreto, sin prosa.

---

## Sprint actual

**S0.1 — Repo + Gitflow + husky + commitlint + prettier + eslint**

| Tarea                                           | Estado |
| ----------------------------------------------- | ------ |
| `git init` en `main`                            | ✅     |
| Angular 22 scaffoldeado (zoneless, Vitest)      | ✅     |
| Dependencias instaladas                         | ✅     |
| Husky activo (`core.hooksPath = .husky/_`)      | ✅     |
| `pre-commit` → lint-staged                      | ✅     |
| `commit-msg` → commitlint                       | ✅     |
| `pre-push` → tests                              | ✅     |
| ESLint (angular-eslint v22, flat config)        | ✅     |
| Prettier + prettierignore                       | ✅     |
| Rama `develop` creada                           | ⬜     |
| Commit de prueba rechazado por mensaje inválido | ⬜     |
| Commit válido aceptado                          | ⬜     |

**Criterio de verde:** un commit con mensaje inválido es rechazado; uno válido pasa.

---

## Dónde me quedé

Scaffolding y configuración listos. Falta **verificar los hooks** (probar un mensaje
inválido y uno válido) y crear la rama `develop`.

## Siguiente paso concreto

1. Crear `develop` desde `main`.
2. `git add -A && git commit -m "asdf"` → debe fallar.
3. `git commit -m "chore(setup): inicializa workspace Angular 22 con Gitflow y hooks"` → debe pasar.

---

## Bitácora

| Fecha      | Sprint | Nota                                                                                              |
| ---------- | ------ | ------------------------------------------------------------------------------------------------- |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado: el sandbox bloquea su caché global. |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + tooling de git. `ng build` verificado en acceso total.               |
