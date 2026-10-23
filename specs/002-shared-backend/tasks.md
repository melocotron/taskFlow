# Tasks: Cuentas y tableros compartidos

**Input**: Design documents from `/specs/002-shared-backend/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`

**Tests**: obligatorios para autenticación, permisos, persistencia y movimiento. La
primera rebanada incluye tests unitarios e integración de la API.

**Organización**: las tareas se agrupan por historia y por dependencia. La integración
de Angular se mantiene como una fase posterior sobre el contrato de esta especificación.

## Formato

- `[P]`: se puede hacer en paralelo con otras tareas del mismo bloque.
- `[US1]`…`[US4]`: historia de usuario a la que pertenece.
- Las rutas son relativas a la raíz del repositorio.

---

## Phase 1: Setup (infraestructura compartida)

**Purpose**: preparar el repositorio para el nuevo runtime sin tocar el frontend 1.0.

- [x] T001 Crear la estructura `backend/` y el módulo Go en `backend/go.mod`
- [x] T002 [P] Añadir `compose.yaml` con PostgreSQL 17 y base `taskflow_test`
- [x] T003 [P] Añadir `.env.example`, actualizar `.gitignore` y `.dockerignore`
- [x] T004 [P] Añadir el job de backend a `.github/workflows/ci.yml` con PostgreSQL
- [x] T005 [P] Documentar el arranque local en `specs/002-shared-backend/quickstart.md`
- [x] T006 Implementar la carga de configuración en `backend/internal/config/config.go`
- [x] T007 Implementar el pool de conexión en `backend/internal/store/store.go`
- [x] T008 Implementar health y readiness en `backend/internal/httpapi/health.go`
- [x] T009 Implementar el logger de peticiones y la recuperación de pánico en
      `backend/internal/httpapi/middleware.go`
- [x] T010 Implementar el comando de migraciones en `backend/cmd/migrate/main.go`

**Checkpoint**: `docker compose up -d db`, migraciones y `/healthz` funcionan.

---

## Phase 2: Foundational (bloquea las historias)

**Purpose**: piezas comunes de autenticación, errores, validación y test.

- [x] T011 Definir errores de dominio y forma de error HTTP en
      `backend/internal/httpapi/errors.go`
- [x] T012 [P] Implementar Argon2id en `backend/internal/auth/password.go`
- [x] T013 [P] Implementar generación y hash de tokens en
      `backend/internal/auth/tokens.go`
- [x] T014 Implementar sesiones y cookie en `backend/internal/auth/session.go`
- [x] T015 Implementar el middleware de autenticación en
      `backend/internal/httpapi/auth_middleware.go`
- [x] T016 Implementar validación de entrada y límites de tamaño en
      `backend/internal/httpapi/validation.go`
- [x] T017 Implementar la tabla de permisos de tablero en
      `backend/internal/auth/permissions.go`
- [x] T018 Implementar el router y el montaje de rutas en
      `backend/internal/httpapi/router.go`
- [x] T019 Implementar utilidades de test de PostgreSQL y servidor HTTP en
      `backend/internal/testutil/`

**Checkpoint**: el router arranca, `/healthz` responde y las utilidades de test
compilan. Ninguna historia funciona todavía.

---

## Phase 3: User Story 1 — Cuenta y sesión (P1) 🎯 MVP

**Goal**: registro, login, logout y `/me` con sesión persistente y revocable.

**Independent Test**: registrar una cuenta, recargar `/me`, cerrar sesión y comprobar
`401`; repetir con email duplicado y contraseña incorrecta.

### Tests

- [x] T020 [P] [US1] Tests de Argon2id y tokens en `backend/internal/auth/*_test.go`
- [x] T021 [P] [US1] Test de registro/login/logout con PostgreSQL en
      `backend/internal/httpapi/auth_test.go`
- [x] T022 [P] [US1] Test de sesión caducada y cookie inválida en
      `backend/internal/httpapi/auth_test.go`

### Implementación

- [x] T023 [US1] Crear migración `backend/migrations/00001_users_sessions.sql`
- [x] T024 [US1] Implementar `UserStore` en `backend/internal/store/users.go`
- [x] T025 [US1] Implementar `SessionStore` en `backend/internal/store/sessions.go`
- [x] T026 [US1] Implementar handlers de registro, login, logout y me en
      `backend/internal/httpapi/auth_handlers.go`
- [x] T027 [US1] Añadir comprobación de `Origin` para métodos mutables en
      `backend/internal/httpapi/csrf.go`
- [x] T028 [US1] Añadir rate limiting básico a login/registro en
      `backend/internal/httpapi/rate_limit.go`

**Checkpoint**: US1 se prueba de punta a punta con cookies y tests.

---

## Phase 4: User Story 2 — Tableros persistentes (P1)

**Goal**: crear, listar y abrir tableros con columnas iniciales; persistencia real.

**Independent Test**: crear un tablero con una cuenta, abrirlo con otra sesión de la
misma cuenta y comprobar columnas y datos.

### Tests

- [x] T029 [P] [US2] Test de creación y listado de tableros en
      `backend/internal/httpapi/boards_test.go`
- [x] T030 [P] [US2] Test de snapshot de tablero y aislamiento entre cuentas en
      `backend/internal/httpapi/boards_test.go`
- [x] T031 [P] [US2] Test de actualización de título y archivo en
      `backend/internal/httpapi/boards_test.go`

### Implementación

- [x] T032 [US2] Crear migración `backend/migrations/00002_boards.sql`
- [x] T033 [US2] Implementar `BoardStore` en `backend/internal/store/boards.go`
- [x] T034 [US2] Implementar handlers `GET/POST /boards` y `GET/PATCH /boards/{id}` en
      `backend/internal/httpapi/board_handlers.go`
- [x] T035 [US2] Crear las tres columnas iniciales en la misma transacción del tablero
- [x] T036 [US2] Implementar el snapshot de tablero con columnas, miembros y tarjetas

**Checkpoint**: US2 funciona sin depender de miembros adicionales ni de la UI.

---

## Phase 5: User Story 3 — Roles y miembros (P2)

**Goal**: añadir cuentas registradas a un tablero y aplicar roles en el servidor.

**Independent Test**: añadir una segunda cuenta como `viewer`, comprobar lectura y
rechazo de escritura; intentar degradar al último admin.

### Tests

- [x] T037 [P] [US3] Test de añadir, cambiar rol y eliminar miembro en
      `backend/internal/httpapi/members_test.go`
- [x] T038 [P] [US3] Test de `viewer` rechazado y acceso ajeno como `404` en
      `backend/internal/httpapi/permissions_test.go`
- [x] T039 [P] [US3] Test de protección del último administrador en
      `backend/internal/httpapi/members_test.go`

### Implementación

- [x] T040 [US3] Añadir la tabla de miembros en `backend/migrations/00002_boards.sql`
- [x] T041 [US3] Implementar `MemberStore` en `backend/internal/store/members.go`
- [x] T042 [US3] Implementar handlers de miembros en
      `backend/internal/httpapi/member_handlers.go`
- [x] T043 [US3] Implementar `requireRole` y la consulta de membresía en
      `backend/internal/store/boards.go`
- [x] T044 [US3] Impedir eliminar o degradar al último administrador en una transacción

**Checkpoint**: US3 funciona con dos cuentas y permisos verificados en API.

---

## Phase 6: User Story 2 — Tarjetas y movimiento (P1)

**Goal**: crear, editar, eliminar y mover tarjetas con orden persistente.

**Independent Test**: crear tres tarjetas, mover la tercera al inicio de otra columna,
recargar y comprobar orden y columna; probar un `version` obsoleto y recibir `409`.

### Tests

- [x] T045 [P] [US2] Test de crear/editar/eliminar tarjeta en
      `backend/internal/httpapi/tasks_test.go`
- [x] T046 [P] [US2] Test de movimiento entre columnas y dentro de una columna en
      `backend/internal/httpapi/tasks_test.go`
- [x] T047 [P] [US2] Test de conflicto de versión y columna de otro tablero en
      `backend/internal/httpapi/tasks_test.go`

### Implementación

- [x] T048 [US2] Crear migración `backend/migrations/00003_tasks.sql`
- [x] T049 [US2] Implementar `TaskStore` con creación, edición y eliminación en
      `backend/internal/store/tasks.go`
- [x] T050 [US2] Implementar movimiento transaccional y renumeración en
      `backend/internal/store/tasks.go`
- [x] T051 [US2] Implementar handlers de tarjetas y movimiento en
      `backend/internal/httpapi/task_handlers.go`
- [x] T052 [US2] Validar responsable miembro del tablero y columna del mismo tablero

**Checkpoint**: US2 completo; el tablero se puede usar desde la API.

---

## Phase 7: User Story 4 — Importación local (P3)

**Goal**: importar una sola vez tableros y tarjetas de `localStorage`.

**Independent Test**: enviar dos veces el mismo payload y comprobar que la segunda no
crea duplicados y devuelve contadores coherentes.

### Tests

- [x] T053 [P] [US4] Test de importación válida e idempotente en
      `backend/internal/httpapi/import_test.go`
- [x] T054 [P] [US4] Test de datos locales inválidos y tableros parciales en
      `backend/internal/httpapi/import_test.go`

### Implementación

- [x] T055 [US4] Añadir `legacy_id` y su índice único en `backend/migrations/00002_boards.sql`
- [x] T056 [US4] Implementar `ImportStore` en `backend/internal/store/import.go`
- [x] T057 [US4] Implementar `POST /import/local` en
      `backend/internal/httpapi/import_handlers.go`
- [x] T058 [US4] Asignar el usuario actual como admin y omitir responsables demo

**Checkpoint**: US4 funciona sin duplicar y sin romper tableros existentes.

---

## Phase 8: Polish y cierre

- [x] T059 [P] Añadir `backend/Dockerfile` multi-stage y `.dockerignore`
- [x] T060 [P] Servir la build de Angular desde Go en producción
      (`backend/internal/httpapi/static.go`)
- [x] T061 [P] Añadir `go vet`, `gofmt -l` y tests al job de CI
- [x] T062 Actualizar `README.md` con backend, comandos y estado
- [x] T063 Actualizar `docs/PROGRESS.md` con el sprint y el siguiente paso
- [x] T064 Actualizar `PLAN.md` con stack, arquitectura y fases de backend
- [x] T065 Actualizar `docs/DEPLOY.md` para Go + Neon y aclarar Vercel
- [x] T066 Actualizar `CHANGELOG.md` con la sección `Unreleased`
- [x] T067 Ejecutar `go test ./...`, `npm run verify` y revisar el diff
- [x] T068 Commit convencional y push de la rama

## Phase 9: Integración Angular (siguiente rebanada, no bloquea la API)

> Orden práctico: T071 antes de T070. Sin `AuthService` y sesión real, los
> repositorios HTTP reciben `401` al cargar. Los identificadores se mantienen para no
> romper referencias.

- [x] T069 Añadir `shared/api` y el proxy de desarrollo
- [ ] T071 Sustituir `/entrar` por login/registro y añadir `AuthService`
- [ ] T070 Migrar repositorios de `board`, `task` y `member` a HTTP
- [ ] T072 Adaptar stores, filtros, formularios y tests de UI
- [ ] T073 Añadir E2E con Go + PostgreSQL
- [ ] T074 Retirar la persistencia `localStorage` del camino de producción

---

## Dependencies & Execution Order

- **Setup** (T001–T010) bloquea la fundación.
- **Foundational** (T011–T019) bloquea todas las historias.
- **US1** (T020–T028) es el MVP y bloquea US2, US3 y US4.
- **US2 tableros** (T029–T036) bloquea tarjetas y membresías.
- **US3** (T037–T044) puede empezar cuando US2 tenga tableros.
- **US2 tarjetas** (T045–T052) depende de US2 y US3 para validar responsables.
- **US4** (T053–T058) depende de US2 y US3.
- **Polish** (T059–T068) depende de las historias implementadas.
- **Phase 9** es posterior y no forma parte de la primera entrega del backend.

## Parallel Opportunities

- T002–T005 son independientes.
- T012 y T013 son independientes.
- T020–T022 pueden escribirse en paralelo.
- T029–T031, T037–T039 y T045–T047 pueden escribirse en paralelo dentro de su
  historia.
- La documentación final (T062–T066) puede prepararse en paralelo con el último test.

## Implementation Strategy

1. Fundación y salud.
2. US1 autenticación.
3. US2 tableros.
4. US3 roles.
5. US2 tarjetas y movimiento.
6. US4 importación.
7. Documentación, Docker y CI.
8. Integración Angular en una rama posterior.

Cada checkpoint debe terminar con `go test ./...` verde. No se avanza a la siguiente
historia con tests rojos.
