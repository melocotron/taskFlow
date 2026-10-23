# Arquitectura

> Una sola flecha en el frontend. Si un import la rompe, el lint falla y el commit no
> pasa. En el backend, la dirección es `cmd → httpapi → store → PostgreSQL`.

## 1. Vista general

TaskFlow es un monorepo con dos aplicaciones y un contrato compartido:

```
taskFlow/
├── src/                         # Angular 22 (FSD)
├── backend/                     # Go 1.27 + chi + pgx
│   ├── cmd/api/                 # arranque HTTP
│   ├── cmd/migrate/             # migraciones goose embebidas
│   ├── internal/                # auth, config, httpapi, store, model
│   └── migrations/              # SQL versionado
├── specs/002-shared-backend/    # spec, plan, tareas y contrato OpenAPI
├── docs/                        # arquitectura, progreso, despliegue
├── scripts/                     # inicialización de PostgreSQL local
├── compose.yaml                 # PostgreSQL 17 de desarrollo
└── backend/Dockerfile           # imagen multi-stage Angular + Go
```

En desarrollo hay dos procesos:

```
Navegador :4200
   │  /api, /healthz, /readyz  (Vite proxy)
   ▼
Angular dev server ──────────────► Go :8080 ──► PostgreSQL :5432
```

En producción hay un solo origen:

```
Navegador
   │  HTTPS
   ▼
Go :8080
   ├── /api/v1/*        API JSON
   ├── /healthz         salud
   ├── /readyz          salud + base de datos
   └── /*               build de Angular (STATIC_DIR)
                          │
                          ▼
                     PostgreSQL (Neon)
```

La cookie de sesión es `HttpOnly` y viaja en el mismo origen. No hay JWT en
`localStorage` ni CORS en el camino principal.

## 2. Frontend: FSD adaptado a Angular

```
pages  →  widgets  →  features  →  entities  →  shared
```

| Capa        | Qué contiene                                   | Ejemplo                                    |
| ----------- | ---------------------------------------------- | ------------------------------------------ |
| `pages/`    | Una ruta. Solo compone.                        | `board-list`, `board-detail`               |
| `widgets/`  | Bloque de UI con sentido propio.               | `board-canvas`                             |
| `features/` | Una acción del usuario (verbo).                | `board-form`, `task-form`, `board-members` |
| `entities/` | Modelo, store, repositorio y UI de lectura.    | `board`, `task`, `member`                  |
| `shared/`   | Sin negocio: design system, utilidades y HTTP. | `ui/button`, `api/api-client`              |

### Límites entre capas

| Desde ↓ / hacia → | pages | widgets | features | entities | shared |
| ----------------- | :---: | :-----: | :------: | :------: | :----: |
| pages             |   —   |   Sí    |    Sí    |    Sí    |   Sí   |
| widgets           |  No   |    —    |    Sí    |    Sí    |   Sí   |
| features          |  No   |   No    |    —     |    Sí    |   Sí   |
| entities          |  No   |   No    |    No    |    Sí    |   Sí   |
| shared            |  No   |   No    |    No    |    No    |   Sí   |

`entities → entities` es la única excepción entre slices: `task` necesita `BoardId` de
`board`. Siempre se importa por el `index.ts` del slice.

### Repositorios y stores

- `shared/api` contiene el cliente HTTP (`ApiClient`), el sobre de error tipado y la
  URL base `/api/v1`. No conoce tableros, tarjetas ni personas.
- Cada entidad expone su repositorio en `entities/*/api/` y lo adapta a su modelo.
  Ninguna página llama a `HttpClient` directamente.
- Los stores conservan el estado con signals. La carga inicial es asíncrona y las
  mutaciones se confirman contra el servidor; la fase 9 define mutaciones optimistas
  con reversión si la API falla.
- El servidor sigue siendo la autoridad de permisos. Ocultar un botón en Angular no
  sustituye la comprobación de rol en Go.

### Estado actual de la integración

| Pieza                              | Estado           |
| ---------------------------------- | ---------------- |
| `shared/api` + proxy de desarrollo | Terminado (T069) |
| Repositorios de entidades por HTTP | Pendiente (T070) |
| `AuthService`, login y registro    | Pendiente (T071) |
| Stores, filtros y tests adaptados  | Pendiente (T072) |
| E2E con Go + PostgreSQL            | Pendiente (T073) |
| Retirada de `localStorage`         | Pendiente (T074) |

Mientras T070–T074 no terminen, la interfaz sigue leyendo `localStorage` y `/entrar`
sigue siendo el selector de personas de la demo. El backend ya está operativo.

## 3. Backend: capas y responsabilidades

```
cmd/api ──► httpapi ──► store ──► PostgreSQL
                │
                ├── auth      (Argon2id, tokens, cookies)
                ├── config    (entorno y valores seguros)
                └── model     (tipos de dominio)
```

| Paquete            | Responsabilidad                                                         |
| ------------------ | ----------------------------------------------------------------------- |
| `cmd/api`          | Arranque, configuración, conexión a PostgreSQL y servidor HTTP.         |
| `cmd/migrate`      | Aplica las migraciones goose embebidas. No se ejecuta en cada arranque. |
| `internal/httpapi` | Router, middlewares, handlers, DTOs, validación y errores JSON.         |
| `internal/store`   | SQL explícito con pgx, transacciones y autorización por tablero.        |
| `internal/auth`    | Hash Argon2id, tokens opacos, cookies y matriz de permisos.             |
| `internal/model`   | Tipos de dominio sin dependencias de HTTP ni de SQL.                    |
| `internal/config`  | Variables de entorno y valores por defecto seguros.                     |
| `migrations/`      | Esquema versionado; la API no crea tablas al arrancar.                  |

Reglas:

- Los handlers no contienen SQL.
- El store no escribe respuestas HTTP.
- `model` no importa `httpapi` ni `store`.
- Las migraciones se aplican con `go run ./cmd/migrate` antes de desplegar.
- Los tests de integración usan PostgreSQL real (`TEST_DATABASE_URL`).

## 4. Ciclo de una petición

1. El navegador llama a `/api/v1/...` en el mismo origen.
2. chi aplica request ID, logging, recuperación, cabeceras de seguridad y CSRF.
3. `requireAuth` valida la cookie `HttpOnly` contra el hash de la sesión.
4. El handler valida el cuerpo y traduce el error a JSON.
5. El store comprueba el rol del usuario en **ese** tablero y ejecuta la operación.
6. La respuesta vuelve como JSON; los errores mantienen la forma:

```json
{
  "error": {
    "codigo": "sin_permiso",
    "mensaje": "Tu rol no permite realizar esta acción."
  }
}
```

### Autorización

| Acción                         | `admin` | `editor` | `viewer` |
| ------------------------------ | :-----: | :------: | :------: |
| Ver tablero y tarjetas         |   Sí    |    Sí    |    Sí    |
| Crear, editar y mover tarjetas |   Sí    |    Sí    |    No    |
| Invitar, cambiar roles         |   Sí    |    No    |    No    |
| Renombrar o archivar tablero   |   Sí    |    No    |    No    |

La matriz se comprueba en Go. Angular puede esconder controles, pero no es la puerta
de seguridad.

## 5. Datos

```
users ──< sessions
  │
  └──< boards ──< board_members >── users
         │
         ├──< board_columns ──< tasks
         │                         │
         └─────────────────────────┘
```

- `users`: cuenta real con email único y hash Argon2id.
- `sessions`: token opaco; solo se guarda su hash SHA-256 y la expiración.
- `boards`: tablero y `legacy_id` para la importación única desde la versión 1.0.
- `board_members`: rol por tablero, no rol global.
- `board_columns`: columnas iniciales del tablero.
- `tasks`: `position` para el orden y `version` para detectar ediciones concurrentes.

## 6. Desarrollo y despliegue

Desarrollo:

```powershell
Copy-Item .env.example .env
docker compose up -d db
cd backend
go run ./cmd/migrate
go run ./cmd/api       # :8080
```

En otra terminal, desde la raíz:

```powershell
npm start              # :4200 con proxy /api → :8080
```

Producción:

- La imagen `backend/Dockerfile` compila Angular, compila Go y sirve ambos desde el
  mismo binario.
- `STATIC_DIR` apunta a la build de Angular dentro de la imagen.
- `DATABASE_URL` apunta a Neon; `COOKIE_SECURE=true` y
  `COOKIE_NAME=__Host-taskflow_session`.
- `ALLOWED_ORIGINS` limita los orígenes permitidos para peticiones mutables.
- Vercel publica la versión 1.0 estática; el destino de la versión compartida es
  Go + Neon. Los detalles están en [DEPLOY.md](DEPLOY.md).

## 7. Decisiones que no se cambian a mitad de una rebanada

- Sin OAuth, verificación por email, recuperación de contraseña ni colaboración en
  tiempo real.
- Sin JWT en el navegador: sesión opaca en cookie `HttpOnly`.
- Sin CORS en producción: un solo origen.
- SQL explícito con pgx; `sqlc` queda pospuesto.
- La importación de datos locales se hace una sola vez mediante `legacy_id`.
- El contrato HTTP vive en
  [contracts/openapi.yaml](../specs/002-shared-backend/contracts/openapi.yaml).

## 8. Dónde se sigue el trabajo

| Documento                                                                 | Para qué                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [specs/002-shared-backend/tasks.md](../specs/002-shared-backend/tasks.md) | **Autoridad de fases y tareas** (T001–T074, fase 9 incluida). |
| [specs/002-shared-backend/spec.md](../specs/002-shared-backend/spec.md)   | Qué debe hacer el alcance y sus criterios de aceptación.      |
| [specs/002-shared-backend/plan.md](../specs/002-shared-backend/plan.md)   | Diseño técnico y decisiones de implementación.                |
| [PROGRESS.md](PROGRESS.md)                                                | Bitácora narrativa por sprint (S6.1–S6.5) y siguiente paso.   |
| [PLAN.md](../PLAN.md)                                                     | Plan maestro del producto y roadmap general.                  |
| [CHANGELOG.md](../CHANGELOG.md)                                           | Qué entró en cada versión.                                    |

`ARQUITECTURA.md` describe el diseño; no duplica el estado de las tareas. Si hay
conflicto entre un diagrama y `tasks.md`, manda `tasks.md` para el estado y este
documento para la intención arquitectónica.

## Los comandos

```bash
npm run lint        # eslint + fronteras de arquitectura
npm run lint:arch   # solo fronteras (más rápido para comprobar un cambio)
npm run verify      # format + lint + tests + build (lo que corre CI)
```

## Cuando el lint te bloquea

El mensaje dice exactamente qué regla y qué import. Las reglas viven en
[.dependency-cruiser.cjs](../.dependency-cruiser.cjs), una por línea de la tabla.

Casi siempre la solución correcta es **mover el código**, no silenciar la regla:

- ¿`shared` importa `entities`? Ese componente no es compartido: súbelo a `entities`.
- ¿`features` importa `widgets`? Ese feature quiere ser un widget.
- ¿`entities` importa `features`? La lógica de negocio está en el sitio equivocado.
