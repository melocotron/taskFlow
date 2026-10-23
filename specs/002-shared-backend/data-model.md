# Data Model: Cuentas y tableros compartidos

**Feature**: `002-shared-backend`  
**Date**: 2026-10-23

## Convenciones

- Todos los identificadores son UUID generados en la aplicación.
- Las fechas son `timestamptz` y se exponen en RFC 3339.
- Los nombres de tablas y columnas están en inglés; el contrato HTTP usa español.
- Los roles son texto con `CHECK` para mantener las migraciones simples y portables.
- Las posiciones son enteras, empezando en 0, dentro de cada columna.

## Entidades

### User

Representa una cuenta.

| Campo           | Tipo        | Reglas                          |
| --------------- | ----------- | ------------------------------- |
| `id`            | UUID        | PK                              |
| `email`         | CITEXT      | único, obligatorio, normalizado |
| `name`          | TEXT        | obligatorio, 1–120 caracteres   |
| `password_hash` | TEXT        | Argon2id, nunca se expone       |
| `created_at`    | TIMESTAMPTZ | por defecto `now()`             |

### Session

Representa una sesión activa.

| Campo        | Tipo        | Reglas                            |
| ------------ | ----------- | --------------------------------- |
| `id`         | UUID        | PK                                |
| `user_id`    | UUID        | FK a `users`, `ON DELETE CASCADE` |
| `token_hash` | BYTEA       | SHA-256 del token, único          |
| `expires_at` | TIMESTAMPTZ | obligatorio                       |
| `created_at` | TIMESTAMPTZ | por defecto `now()`               |

### Board

Representa un tablero.

| Campo        | Tipo        | Reglas                                     |
| ------------ | ----------- | ------------------------------------------ |
| `id`         | UUID        | PK                                         |
| `title`      | TEXT        | obligatorio, 1–160 caracteres              |
| `archived`   | BOOLEAN     | por defecto `false`                        |
| `created_by` | UUID        | FK a `users`                               |
| `legacy_id`  | TEXT        | nullable; id del tablero en `localStorage` |
| `created_at` | TIMESTAMPTZ | por defecto `now()`                        |
| `updated_at` | TIMESTAMPTZ | por defecto `now()`                        |

Restricción: `UNIQUE (created_by, legacy_id)` cuando `legacy_id` no es nulo.

### BoardMember

Relaciona una cuenta con un tablero y su rol.

| Campo        | Tipo        | Reglas                             |
| ------------ | ----------- | ---------------------------------- |
| `board_id`   | UUID        | FK a `boards`, `ON DELETE CASCADE` |
| `user_id`    | UUID        | FK a `users`, `ON DELETE CASCADE`  |
| `role`       | TEXT        | `admin`, `editor`, `viewer`        |
| `created_at` | TIMESTAMPTZ | por defecto `now()`                |

PK compuesta `(board_id, user_id)`. Debe existir al menos un `admin` por tablero.

### BoardColumn

| Campo        | Tipo        | Reglas                             |
| ------------ | ----------- | ---------------------------------- |
| `id`         | UUID        | PK                                 |
| `board_id`   | UUID        | FK a `boards`, `ON DELETE CASCADE` |
| `title`      | TEXT        | obligatorio, 1–120 caracteres      |
| `position`   | INTEGER     | >= 0                               |
| `created_at` | TIMESTAMPTZ | por defecto `now()`                |

Índice `(board_id, position)`.

### Task

| Campo         | Tipo        | Reglas                                       |
| ------------- | ----------- | -------------------------------------------- |
| `id`          | UUID        | PK                                           |
| `board_id`    | UUID        | FK a `boards`, `ON DELETE CASCADE`           |
| `column_id`   | UUID        | FK a `board_columns`, `ON DELETE CASCADE`    |
| `title`       | TEXT        | obligatorio, 1–240 caracteres                |
| `description` | TEXT        | por defecto `''`, máximo 10 000              |
| `assignee_id` | UUID        | nullable, FK a `users`, `ON DELETE SET NULL` |
| `position`    | INTEGER     | >= 0                                         |
| `version`     | INTEGER     | por defecto 1                                |
| `created_at`  | TIMESTAMPTZ | por defecto `now()`                          |
| `updated_at`  | TIMESTAMPTZ | por defecto `now()`                          |

Índices `(board_id, column_id, position)` y `(assignee_id)`.

## Relaciones

```text
users 1 ─── N sessions
users 1 ─── N boards (created_by)
users N ─── N boards (board_members)
boards 1 ─── N board_columns
boards 1 ─── N tasks
board_columns 1 ─── N tasks
users 1 ─── N tasks (assignee)
```

## Invariantes

1. El email es único sin distinguir mayúsculas.
2. Un tablero siempre tiene al menos un miembro administrador.
3. Un miembro solo puede tener un rol por tablero.
4. Una tarjeta solo puede pertenecer a una columna del mismo tablero.
5. El responsable de una tarjeta debe pertenecer al tablero.
6. Las posiciones de una columna no necesitan ser contiguas en la base de datos, pero
   la API las devuelve ordenadas y las renumera tras un movimiento.
7. `version` aumenta en cada modificación de la tarjeta.
8. `legacy_id` es único por creador para que la importación sea idempotente.

## Borrado

- Un tablero archivado no aparece en la lista por defecto, pero conserva sus datos.
- Eliminar una cuenta elimina sus sesiones y membresías; las tarjetas asignadas quedan
  sin responsable.
- Eliminar una columna elimina sus tarjetas (`ON DELETE CASCADE`); la interfaz deberá
  pedir confirmación cuando exista esa acción.
- Las tarjetas se eliminan físicamente; el historial de actividad queda fuera de
  alcance.

## Estados

### Tablero

```text
activo ⇄ archivado
```

Solo un administrador puede cambiar el estado.

### Sesión

```text
activa → cerrada (logout)
activa → caducada (expires_at)
```

Una sesión cerrada o caducada no puede reutilizarse.
