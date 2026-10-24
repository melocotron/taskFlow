# Implementation Plan: Cuentas y tableros compartidos

**Branch**: `002-shared-backend` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-shared-backend/spec.md`

## Summary

TaskFlow deja de depender de `localStorage` para pasar a un servicio compartido. La
entrega añade cuentas con email y contraseña, sesiones revocables, tableros persistentes,
miembros con roles, tarjetas con orden y movimiento transaccional, e importación única
de los datos locales de 1.0.

El backend se implementa en Go con PostgreSQL. En desarrollo, Angular sigue en `:4200`
con un proxy hacia Go en `:8080`; en producción, Go sirve la build de Angular y la API
desde el mismo origen. La integración de la interfaz con la API se completó en la fase
9 sobre el mismo contrato.

## Technical Context

**Language/Version**: Go 1.27.3; TypeScript 6 / Angular 22.2.3 para el cliente existente.

**Primary Dependencies**: `github.com/go-chi/chi/v5`, `github.com/jackc/pgx/v5`,
`github.com/pressly/goose/v3`, `github.com/google/uuid`,
`golang.org/x/crypto/argon2`, `github.com/joho/godotenv`.

**Storage**: PostgreSQL 17. Docker Compose en local; Neon en staging y producción.
Migraciones SQL con `goose`.

**Testing**: `go test ./...` con `httptest` y PostgreSQL real para integración;
Vitest y Playwright existentes para el frontend. CI añade un job de backend con un
servicio PostgreSQL.

**Target Platform**: Linux en contenedor; desarrollo en Windows con Docker Desktop.

**Project Type**: Web application con backend Go y frontend Angular en el mismo
repositorio.

**Performance Goals**: respuestas de API por debajo de 300 ms en local para operaciones
normales; tablero de 200 tarjetas utilizable; movimiento transaccional sin pérdida de
orden.

**Constraints**: un solo origen en producción, cookies `HttpOnly`, sin CORS en el camino
principal, sesiones revocables, sin colaboración en tiempo real, sin envío de correos.

**Scale/Scope**: equipos pequeños; hasta 100 tableros por cuenta y 200 tarjetas por
tablero en el objetivo de prueba. Un solo servicio y una sola base de datos.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                              | Cumplimiento                                                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Signals como única fuente de verdad | No se modifica el estado del frontend en esta rebanada. La futura integración mantendrá stores con signals; la API no introduce estado reactivo.        |
| II. Zoneless y OnPush                  | Sin cambios en Angular en esta rebanada.                                                                                                                |
| III. Fronteras FSD ejecutables         | El backend vive en `backend/`; no introduce imports entre capas de Angular. La futura integración usará `shared/api` y los repositorios de cada entity. |
| IV. Design system antes que pantallas  | No hay pantallas nuevas en esta rebanada. La pantalla de acceso se diseñará con el sistema existente.                                                   |
| V. Accesibilidad AA no negociable      | No hay UI nueva. Los mensajes de error de la API son textos estables que la UI podrá anunciar.                                                          |
| VI. Tests como puerta de entrada       | Tests unitarios e integración de Go; CI con PostgreSQL. Los tests de frontend se mantienen.                                                             |
| VII. Gitflow y commits convencionales  | Rama `feature/002-shared-backend`; commits `feat(api)`, `feat(auth)`, `test(api)`, `docs(...)`.                                                         |
| VIII. SDD                              | `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/` y `tasks.md` antes del código.                                                       |

**Resultado**: pasa. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/002-shared-backend/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── cmd/
│   ├── api/main.go              # arranque HTTP
│   └── migrate/main.go          # migraciones embebidas
├── internal/
│   ├── auth/                    # hash, tokens, sesión, contexto
│   ├── config/                  # variables y valores por defecto
│   ├── httpapi/                 # router, middlewares, handlers, DTOs
│   ├── store/                   # PostgreSQL y consultas
│   ├── testutil/                # base de datos y servidor de pruebas
│   └── migrate/                 # FS embebido de migraciones
├── migrations/
│   └── 00001_init.sql
├── Dockerfile
├── go.mod
└── go.sum

compose.yaml                     # PostgreSQL local
.env.example
```

El frontend existente se mantiene en `src/` y `e2e/`. La integración HTTP de Angular no
forma parte de la primera implementación del servidor; se planifica como una rebanada
siguiente sobre el contrato ya congelado.

## Diseño técnico

### 1. Configuración

`internal/config` carga `.env` si existe (solo desarrollo) y lee:

```text
DATABASE_URL=postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable
HTTP_ADDR=:8080
APP_ENV=development
COOKIE_SECURE=false
COOKIE_NAME=taskflow_session
SESSION_TTL=168h
ALLOWED_ORIGINS=http://localhost:4200
```

En producción `COOKIE_SECURE=true`, nombre `__Host-taskflow_session` y orígenes del
dominio real. La configuración falla al arrancar si falta `DATABASE_URL`.

### 2. Base de datos

- Pool `pgxpool` con límites razonables.
- Migraciones embebidas con `goose`, ejecutadas por `cmd/migrate`, no al arrancar la API.
- `users`, `sessions`, `boards`, `board_members`, `board_columns`, `tasks`.
- `citext` para emails; UUID generados en Go; `version` en tarjetas.

### 3. HTTP

- Router `chi` con middleware de request ID, logging, recuperación de pánico y
  autenticación.
- `GET /healthz` sin autenticación; `GET /readyz` comprueba la base de datos.
- API bajo `/api/v1`.
- Handler devuelve JSON y errores con `{"error":{"codigo","mensaje"}}`.
- Validación explícita de cuerpos y parámetros; límite de tamaño de petición.

### 4. Autenticación

- Registro: nombre, email, contraseña; email normalizado con `citext`.
- Hash Argon2id con sal aleatoria; comparación en tiempo constante.
- Login: verificación de hash; respuesta genérica ante credenciales inválidas.
- Sesión: token aleatorio, hash SHA-256 en base de datos, cookie `HttpOnly`.
- Logout: borra la sesión y la cookie.
- Middleware `requireAuth` para rutas privadas; contexto con `userID`.
- Comprobación de `Origin` en métodos mutables para mitigar CSRF.

### 5. Autorización

- `board_members` define el rol.
- Middleware/handler `requireBoardRole` consulta la membresía antes de operar.
- No se distingue entre “no existe” y “no perteneces”: `404`.
- Solo `admin` gestiona miembros y archiva; `editor` y `admin` modifican contenido.
- No se puede eliminar o degradar al último administrador.

### 6. Tableros y tarjetas

- Crear tablero en transacción: board + tres columnas + membresía admin.
- `GET /boards/{id}` devuelve el snapshot: tablero, columnas, miembros y tarjetas.
- Crear tarjeta al final de la columna; validar que la columna pertenece al tablero y
  que el responsable es miembro.
- Editar con `version`; si no coincide, `409`.
- Mover en transacción: bloquear filas afectadas, validar columna destino, reordenar
  origen y destino, incrementar versión.
- Eliminar tarjeta y renumerar la columna.

### 7. Importación local

- `POST /import/local` recibe tableros y tareas del formato 1.0.
- Cada tablero se inserta una sola vez usando `legacy_id` y el creador.
- El usuario actual entra como admin; los responsables con nombre de demo se ignoran.
- Devuelve contadores de importados/omitidos.

### 8. Frontend (fase 9, completada)

- `shared/api` con cliente HTTP y manejo de errores.
- Repositorios `board`, `task` y `member` pasan de `localStorage` a HTTP.
- `AuthService` + guard + pantalla de login/registro.
- Stores conservan signals; mutaciones optimistas con reversión.
- Playwright arranca Go + PostgreSQL y usa datos propios.

### 9. Despliegue (S6.5, completado)

- `compose.yaml` para PostgreSQL local.
- Dockerfile multi-stage: build de Angular, build de Go, imagen final mínima.
- Go sirve `dist/taskflow/browser` y `/api/v1` en el mismo puerto.
- Fly.io + Neon; migración como paso de release.
- Vercel queda como redirección a producción; el proyecto se puede retirar en una
  tarea de limpieza.

## Phase 0 — Research

Completado en [research.md](./research.md). Decisiones principales: chi, pgx, goose,
sesiones opacas, roles por tablero, UUID, posiciones enteras, versión optimista y
contrato en español.

## Phase 1 — Design & Contracts

- [data-model.md](./data-model.md): tablas, relaciones e invariantes.
- [contracts/openapi.yaml](./contracts/openapi.yaml): contrato HTTP.
- [quickstart.md](./quickstart.md): recorrido reproducible de validación.

## Phase 2 — Tasks

Se generan en [tasks.md](./tasks.md). El orden es: fundación, autenticación, tableros y
miembros, tarjetas, importación, documentación y CI. La integración de Angular queda
como una fase posterior claramente separada para no romper la aplicación 1.0.

## Complexity Tracking

No hay violaciones de la constitución. La separación `backend/` y `src/` es la estructura
natural para un proyecto web con dos runtimes; no se añade un tercer proyecto.
