# TaskFlow

Tableros kanban con equipos. Proyecto de aprendizaje **Angular 22** construido con
Spec-Driven Development, Gitflow y design system propio.

## Empezar

```bash
npm install
npm start        # http://localhost:4200
npm test         # Vitest (watch)
npm run verify   # format + lint + tests + build
```

## Documentos

| Documento                            | Qué es                                                |
| ------------------------------------ | ----------------------------------------------------- |
| [PLAN.md](PLAN.md)                   | El plan maestro: stack, skills, arquitectura, sprints |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Dónde vamos y dónde me quedé                          |
| [docs/IDEAS.md](docs/IDEAS.md)       | Ideas aparcadas (no se tocan a mitad de sprint)       |
| [CLAUDE.md](CLAUDE.md)               | Reglas de código de Angular 22 para el agente         |

## Stack

Angular 22.2.3 · zoneless · signals · Signal Forms · Vitest · Playwright ·
ESLint (angular-eslint 22) · Prettier · Husky + commitlint · GitHub Spec Kit.

## Flujo de trabajo

```
main      ← solo merges de release/* y hotfix/*
develop   ← integración, los PRs entran aquí
feature/* ← una rama por sprint
```

Commits: `tipo(alcance): resumen` — `feat(board): añade drag and drop`.

Sprint actual y siguiente paso: **[docs/PROGRESS.md](docs/PROGRESS.md)**.
