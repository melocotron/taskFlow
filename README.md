# TaskFlow

**Versión 1.0.0 publicada.** Tableros kanban con equipos. Proyecto de aprendizaje
**Angular 22** construido con Spec-Driven Development, Gitflow y design system propio.
La rama actual incorpora la primera entrega del **backend compartido en Go**.

## Empezar

### Frontend 1.0 (localStorage)

```bash
npm install
npm start        # http://localhost:4200
npm test         # Vitest (watch)
npm run e2e      # Playwright
npm run verify   # format + lint + tests + build
```

### Backend (Go + PostgreSQL)

Requiere Docker Desktop y Go 1.27.3 o superior.

```powershell
Copy-Item .env.example .env
docker compose up -d db

cd backend
go run ./cmd/migrate
go run ./cmd/api      # http://localhost:8080
```

Comprobación rápida:

```powershell
curl.exe http://localhost:8080/healthz
curl.exe http://localhost:8080/readyz
```

`npm start` arranca Angular en `:4200`; `proxy.conf.json` reenvía `/api`, `/healthz` y
`/readyz` a Go, así que el navegador ve un solo origen también en desarrollo.

El recorrido completo —registro, tablero, tarjeta, movimiento, roles e importación—
está en [specs/002-shared-backend/quickstart.md](specs/002-shared-backend/quickstart.md).
El contrato HTTP vive en
[specs/002-shared-backend/contracts/openapi.yaml](specs/002-shared-backend/contracts/openapi.yaml).

Los tests de integración necesitan PostgreSQL:

```powershell
cd backend
$env:TEST_DATABASE_URL="postgres://taskflow:taskflow@localhost:5432/taskflow_test?sslmode=disable"
go test ./...
```

## Estado actual

| Parte                   | Estado                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Frontend Angular 22     | 1.0.0, usa `localStorage`; integración con la API pendiente                                       |
| API Go `/api/v1`        | Implementada y probada: cuentas, sesiones, tableros, miembros, tarjetas, movimiento e importación |
| PostgreSQL              | Local en Docker; Neon para staging/producción                                                     |
| Servir Angular desde Go | Implementado con `STATIC_DIR`; se activa en la imagen Docker                                      |
| Despliegue              | Vercel publica la 1.0; el destino es Go + Neon en un solo origen                                  |

El cliente HTTP, el proxy de desarrollo y el acceso real con email y contraseña ya
están listos. La interfaz todavía guarda tableros y tarjetas en `localStorage`: falta
migrar los repositorios a la API y adaptar stores y tests. Queda registrado en
[tasks.md](specs/002-shared-backend/tasks.md), fase 9 (T070 y T072–T074).

## Documentos

| Documento                                                              | Qué es                                                |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| [PLAN.md](PLAN.md)                                                     | El plan maestro: stack, skills, arquitectura, sprints |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)                           | Diseño de capas, backend, datos y despliegue          |
| [docs/PROGRESS.md](docs/PROGRESS.md)                                   | Dónde vamos y dónde me quedé                          |
| [docs/IDEAS.md](docs/IDEAS.md)                                         | Ideas aparcadas (no se tocan a mitad de sprint)       |
| [CHANGELOG.md](CHANGELOG.md)                                           | Qué entró en cada versión                             |
| [docs/DEPLOY.md](docs/DEPLOY.md)                                       | Despliegue actual y destino Go + Neon                 |
| [CLAUDE.md](CLAUDE.md)                                                 | Reglas de código para el agente                       |
| [specs/002-shared-backend/spec.md](specs/002-shared-backend/spec.md)   | Qué debe hacer el backend compartido                  |
| [specs/002-shared-backend/plan.md](specs/002-shared-backend/plan.md)   | Cómo se implementa                                    |
| [specs/002-shared-backend/tasks.md](specs/002-shared-backend/tasks.md) | Tareas y estado                                       |

## Stack

Angular 22.2.3 · zoneless · signals · Signal Forms · Vitest · Playwright ·
ESLint (angular-eslint 22) · Prettier · Husky + commitlint · GitHub Spec Kit ·
Go 1.27.3 · chi · pgx · goose · PostgreSQL 17.

## Flujo de trabajo

```
main      ← solo merges de release/* y hotfix/*
develop   ← integración, los PRs entran aquí
feature/* ← una rama por sprint
```

Commits: `tipo(alcance): resumen` — `feat(api): añade el movimiento de tarjetas`.

Sprint actual y siguiente paso: **[docs/PROGRESS.md](docs/PROGRESS.md)**.
