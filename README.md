# TaskFlow

**Versión 1.0.0 publicada.** Tableros kanban con equipos. Proyecto de aprendizaje
**Angular 22** construido con Spec-Driven Development, Gitflow y design system propio.
La rama actual integra el **backend compartido en Go** con PostgreSQL.

## Empezar

Requiere Node 24.15+, Go 1.27.3+ y Docker Desktop.

```powershell
npm install
Copy-Item .env.example .env
docker compose up -d db

cd backend
go run ./cmd/migrate
go run ./cmd/api      # http://localhost:8080
```

En otra terminal:

```powershell
npm start             # http://localhost:4200
```

`proxy.conf.json` reenvía `/api`, `/healthz` y `/readyz` a Go, así que el navegador ve
un solo origen también en desarrollo. En producción la imagen Docker sirve la build de
Angular desde Go con `STATIC_DIR`.

Comprobación rápida de la API:

```powershell
curl.exe http://localhost:8080/healthz
curl.exe http://localhost:8080/readyz
```

El recorrido completo —registro, tablero, tarjeta, movimiento, roles e importación—
está en [specs/002-shared-backend/quickstart.md](specs/002-shared-backend/quickstart.md).
El contrato HTTP vive en
[specs/002-shared-backend/contracts/openapi.yaml](specs/002-shared-backend/contracts/openapi.yaml).

### Tests

```powershell
npm run verify        # formato, tokens, lint, 189 tests y build
npm run e2e           # Playwright: arranca Go + Angular y usa PostgreSQL real
```

Los E2E necesitan la base `taskflow` migrada y disponible; `playwright.config.ts` aplica
las migraciones antes de arrancar la API. En local reutiliza servidores ya levantados.

Tests de integración de Go:

```powershell
cd backend
$env:TEST_DATABASE_URL="postgres://taskflow:taskflow@localhost:5432/taskflow_test?sslmode=disable"
go test ./...
```

## Estado actual

| Parte                   | Estado                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| Frontend Angular 22     | Usa la API: cuentas, tableros, tarjetas, filtros, miembros y roles                                |
| API Go `/api/v1`        | Implementada y probada: cuentas, sesiones, tableros, miembros, tarjetas, movimiento e importación |
| PostgreSQL              | Local en Docker; Neon para staging/producción                                                     |
| Servir Angular desde Go | Implementado con `STATIC_DIR`; se activa en la imagen Docker                                      |
| Pruebas                 | 189 unitarios, 33 E2E con Go + PostgreSQL, `go test` y `npm run verify` verdes                    |
| Despliegue              | Vercel publica la 1.0; el destino es Go + Neon en un solo origen (S6.5)                           |

La sesión es una cookie `HttpOnly`; `MemberStore` ya no persiste identidad en
`localStorage`. Si este navegador conserva tableros o tarjetas de la 1.0, la lista de
tableros ofrece **Importar mis datos**: se envían una sola vez a `POST /import/local`,
el backend usa `legacy_id` para no duplicar y solo entonces se borran las claves locales.

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

```text
main      ← solo merges de release/* y hotfix/*
develop   ← integración, los PRs entran aquí
feature/* ← una rama por sprint
```

Commits: `tipo(alcance): resumen` — `feat(api): añade el movimiento de tarjetas`.

Sprint actual y siguiente paso: **[docs/PROGRESS.md](docs/PROGRESS.md)**.
