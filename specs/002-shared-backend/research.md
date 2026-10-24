# Research: Cuentas y tableros compartidos

**Feature**: `002-shared-backend`  
**Date**: 2026-10-23

Este documento resuelve las decisiones técnicas que no pertenecen a `spec.md`.
La especificación describe el qué; aquí se decide el cómo.

## D-001 — Servidor HTTP en Go

**Decisión**: Go 1.27.3 con `net/http` y `github.com/go-chi/chi/v5` para el router y los
middlewares.

**Rationale**: Go ya está instalado y actualizado. `chi` es pequeño, idiomático y
compatible con `http.Handler`; evita un framework pesado y deja visibles las rutas, los
middlewares y los códigos de estado. La alternativa de usar solo `net/http` es válida,
pero repetiría la composición de middlewares y el enrutado anidado.

**Alternativas consideradas**:

- `net/http` puro: menos dependencias, pero más código repetido para rutas con parámetros.
- Gin/Echo: más funciones, pero acoplan la aplicación a un framework que no se necesita.
- Fiber: incompatible con `http.Handler` y con el resto del ecosistema estándar.

## D-002 — PostgreSQL y acceso a datos

**Decisión**: PostgreSQL 17 en Docker para desarrollo y Neon para staging/producción.
Acceso con `github.com/jackc/pgx/v5/pgxpool` y SQL explícito en repositorios.

**Rationale**: el dominio es relacional (tableros, membresías, columnas, tarjetas,
roles). PostgreSQL permite claves foráneas, restricciones y transacciones para el
reordenamiento. `pgx` es el driver nativo y `pgxpool` gestiona el pool.

**Alternativas consideradas**:

- `database/sql` + `lib/pq`: `lib/pq` está en mantenimiento; `pgx` es la opción activa.
- GORM: oculta el SQL y complica el control de transacciones y bloqueos.
- `sqlc`: buena opción cuando crezcan las consultas, pero añade generación de código y
  un paso de build extra para este primer corte. Se puede adoptar después sin cambiar
  el contrato HTTP.
- SQLite: suficiente para un solo proceso, pero no para multiusuario y despliegue
  horizontal.

## D-003 — Migraciones

**Decisión**: `github.com/pressly/goose/v3` con migraciones SQL embebidas y un comando
`cmd/migrate`.

**Rationale**: las migraciones se versionan con el código, se pueden ejecutar en local,
en CI y en el despliegue, y no dependen de una herramienta externa instalada en la
máquina. No se ejecutan automáticamente al arrancar la API para evitar carreras entre
instancias.

**Alternativas consideradas**:

- Atlas: potente, pero más configuración de la necesaria.
- Migraciones a mano: no dejan historial reproducible.
- `goose` CLI: útil, pero el comando embebido simplifica CI y despliegue.

## D-004 — Autenticación y sesiones

**Decisión**: email + contraseña con Argon2id y sesiones opacas en cookie `HttpOnly`.

- Contraseña: Argon2id con sal aleatoria de 16 bytes, memoria 64 MiB, 3 iteraciones y
  paralelismo 2.
- Token de sesión: 32 bytes aleatorios en base64url; se guarda solo su SHA-256 en la
  base de datos.
- Cookie: `HttpOnly`, `Secure` en producción, `SameSite=Lax`, `Path=/`; nombre
  `taskflow_session` en desarrollo y `__Host-taskflow_session` en producción.
- Caducidad inicial: 7 días. El logout elimina la sesión del servidor y borra la cookie.

**Rationale**: una cookie de sesión opaca permite revocar el acceso desde el servidor y
evita guardar tokens en `localStorage`. JWT no aporta una ventaja clara para una SPA con
un solo origen y complica la revocación.

**Alternativas consideradas**:

- JWT en `localStorage`: expuesto a XSS y sin revocación sencilla.
- JWT en cookie: requiere rotación y una lista de revocación para cerrar sesión.
- OAuth: menos código de contraseñas, pero añade proveedores y flujos que quedaron fuera
  de alcance.

## D-005 — Autorización por tablero

**Decisión**: roles `admin`, `editor` y `viewer` en `board_members`. Toda operación
consulta la membresía y aplica una tabla de permisos en el servidor.

| Acción                               | admin | editor | viewer |
| ------------------------------------ | ----- | ------ | ------ |
| Ver tablero                          | sí    | sí     | sí     |
| Editar título del tablero            | sí    | sí     | no     |
| Crear/editar/mover/eliminar tarjetas | sí    | sí     | no     |
| Añadir/cambiar/eliminar miembros     | sí    | no     | no     |
| Archivar tablero                     | sí    | no     | no     |

El cliente puede ocultar acciones, pero el servidor siempre vuelve a comprobar. No se
revela la existencia de un tablero a quien no pertenece: se responde `404`, no `403`.

## D-006 — Identificadores y orden

**Decisión**: UUID v4 generados en Go para todas las entidades. Posiciones enteras por
columna, renumeradas dentro de una transacción al mover.

**Rationale**: los UUID no filtran secuencia ni permiten adivinar recursos. Las
posiciones enteras son suficientes para tableros pequeños y facilitan la comprensión y
los tests. El reordenamiento bloquea las filas afectadas y renumera origen y destino.

**Alternativas consideradas**:

- ULID/UUIDv7: mejor localidad, pero añade una dependencia o complejidad innecesaria.
- Posiciones fraccionarias/LexoRank: evita renumerar, pero complica el modelo y la
  depuración en esta escala.

## D-007 — Concurrencia

**Decisión**: campo `version` en tarjetas. Las actualizaciones envían la versión leída y
el servidor responde `409 Conflict` si no coincide. El movimiento también incrementa la
versión.

**Rationale**: evita la pérdida silenciosa de cambios cuando dos personas editan a la
vez, sin introducir sincronización en tiempo real ni bloqueos largos.

## D-008 — Contrato HTTP

**Decisión**: API JSON bajo `/api/v1`, nombres de campos en español para alinearse con
el modelo actual de Angular. Fechas en RFC 3339. Errores con forma estable:

```json
{
  "error": {
    "codigo": "conflicto",
    "mensaje": "La tarjeta cambió en otra sesión."
  }
}
```

**Rationale**: el frontend ya usa `titulo`, `columnaId`, `creadoEn`, etc. Mantener esos
nombres reduce el mapeo y el riesgo de errores. Internamente Go y SQL usan inglés.

## D-009 — Un solo origen y despliegue

**Decisión**: en local, Angular en `:4200` con proxy `/api` a Go en `:8080`. En
producción, Go sirve la build de Angular y la API desde el mismo origen. PostgreSQL en
Neon y el contenedor en Fly.io (Render como alternativa).

**Rationale**: evita CORS, permite cookies `SameSite=Lax` y simplifica la seguridad.
Vercel deja de ser producción y queda como redirección; el proyecto puede retirarse
cuando ya no se necesite.

## D-010 — Pruebas

**Decisión**:

- Unitarias: contraseñas, tokens, permisos, validaciones y middlewares.
- Integración: PostgreSQL real con `TEST_DATABASE_URL`, migraciones aplicadas y
  limpieza entre pruebas.
- API: `httptest` con un servidor real y un cliente con cookie jar.
- E2E de frontend: se añadirán cuando Angular consuma la API; no se fuerzan ahora.

**Rationale**: una base de datos real detecta errores de SQL, restricciones y
transacciones que un mock no ve. Las pruebas de API cubren el recorrido registro →
tablero → tarjeta → movimiento.

## D-011 — Importación local

**Decisión**: un endpoint `POST /api/v1/import/local` recibe los tableros y tarjetas del
formato actual. Cada tablero importado guarda `legacy_id` y una restricción única por
`(created_by, legacy_id)` impide duplicados. El usuario actual entra como administrador;
las personas de demo no se convierten en cuentas.

**Rationale**: permite conservar el trabajo de 1.0 sin inventar cuentas para “Marta”,
“Iván” y “Alba”. La importación es explícita y repetible sin duplicar.
