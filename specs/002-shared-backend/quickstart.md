# Quickstart: Cuentas y tableros compartidos

**Feature**: `002-shared-backend`  
**Date**: 2026-10-23

Esta guía valida la API y el frontend Angular contra PostgreSQL en local.

## Requisitos

- Go 1.27.3 o superior.
- Docker Desktop con Docker Compose.
- Node.js 24.22.1 y npm 11.19.1 para el frontend existente.
- Git.

## 1. Preparar el entorno

Desde la raíz del repositorio:

```powershell
Copy-Item .env.example .env
docker compose up -d db
```

El contenedor crea la base `taskflow` y una base `taskflow_test` para las pruebas de
integración.

## 2. Aplicar migraciones

```powershell
cd backend
go run ./cmd/migrate
```

## 3. Arrancar la API

```powershell
cd backend
go run ./cmd/api
```

La API escucha en `http://localhost:8080`. Comprobación:

```powershell
curl.exe http://localhost:8080/healthz
curl.exe http://localhost:8080/readyz
```

## 4. Registrar una cuenta y guardar la cookie

`curl.exe` en PowerShell 5.1 puede perder las comillas del JSON. Usar
`Invoke-RestMethod`, que conserva la sesión en `$session`:

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$registro = @{
  nombre   = 'Marta Ruiz'
  email    = 'marta@example.com'
  password = 'secreto-largo'
} | ConvertTo-Json

$usuario = Invoke-RestMethod `
  -Uri http://localhost:8080/api/v1/auth/register `
  -Method Post `
  -WebSession $session `
  -ContentType 'application/json' `
  -Body $registro

$usuario
```

La respuesta debe ser `201` y establecer la cookie de sesión.

## 5. Crear un tablero

```powershell
$tablero = Invoke-RestMethod `
  -Uri http://localhost:8080/api/v1/boards `
  -Method Post `
  -WebSession $session `
  -ContentType 'application/json' `
  -Body (@{ titulo = 'Lanzamiento' } | ConvertTo-Json)

$tablero.id
$tablero.columnas
```

El resultado incluye las columnas `Por hacer`, `En curso` y `Hecho`.

## 6. Crear y mover una tarjeta

```powershell
$tarea = Invoke-RestMethod `
  -Uri "http://localhost:8080/api/v1/boards/$($tablero.id)/tasks" `
  -Method Post `
  -WebSession $session `
  -ContentType 'application/json' `
  -Body (@{
    columnaId  = $tablero.columnas[0].id
    titulo     = 'Revisar copy'
    descripcion = 'Primera tarea'
  } | ConvertTo-Json)

$tarea
```

```powershell
$movida = Invoke-RestMethod `
  -Uri "http://localhost:8080/api/v1/tasks/$($tarea.id)/move" `
  -Method Post `
  -WebSession $session `
  -ContentType 'application/json' `
  -Body (@{
    columnaId = $tablero.columnas[1].id
    posicion  = 0
    version   = $tarea.version
  } | ConvertTo-Json)

$movida
```

Recargar el tablero:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8080/api/v1/boards/$($tablero.id)" `
  -WebSession $session
```

La tarjeta debe aparecer en la columna de destino, en la posición indicada.

## 7. Probar permisos

1. Registrar una segunda cuenta con otra `WebRequestSession`.
2. Con la primera cuenta, añadir a la segunda por email como `viewer`.
3. Con la segunda, intentar crear una tarjeta: debe responder `403`.
4. Intentar abrir un tablero ajeno: debe responder `404`.

```powershell
$segunda = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$otro = @{
  nombre   = 'Otra Persona'
  email    = 'otra@example.com'
  password = 'secreto-largo'
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8080/api/v1/auth/register `
  -Method Post -WebSession $segunda -ContentType 'application/json' -Body $otro

Invoke-RestMethod `
  -Uri "http://localhost:8080/api/v1/boards/$($tablero.id)/members" `
  -Method Post -WebSession $session -ContentType 'application/json' `
  -Body (@{ email = 'otra@example.com'; rol = 'viewer' } | ConvertTo-Json)
```

## 8. Probar sesión y cierre

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/v1/me -WebSession $session
Invoke-WebRequest -Uri http://localhost:8080/api/v1/auth/logout `
  -Method Post -WebSession $session
```

- `GET /me` con la cookie devuelve la cuenta.
- `POST /auth/logout` debe devolver `204`.
- `GET /me` después del logout debe devolver `401`.

## 9. Tests

```powershell
cd backend
go test ./...
```

Los tests de integración necesitan `TEST_DATABASE_URL`:

```powershell
$env:TEST_DATABASE_URL="postgres://taskflow:taskflow@localhost:5432/taskflow_test?sslmode=disable"
go test ./...
```

Sin esa variable, los tests que necesitan PostgreSQL se omiten y los unitarios siguen
ejecutándose.

## 10. Frontend

Angular usa la API HTTP; no hay persistencia de negocio en `localStorage`:

```powershell
npm start
```

El proxy de desarrollo envía `/api`, `/healthz` y `/readyz` a `http://localhost:8080`,
así que el navegador ve un solo origen y no hace falta CORS. En producción, Go sirve la
build de Angular y la API desde el mismo puerto.

## Criterio de aceptación

- La API arranca contra PostgreSQL y responde a salud.
- Registro, login, logout y `/me` funcionan.
- Un tablero se crea con columnas y se recupera desde otra sesión.
- Una tarjeta se crea, se edita y se mueve; el orden se conserva.
- Un observador recibe `403` al intentar editar.
- Un tablero ajeno responde `404`.
- La importación local es idempotente.
- `go test ./...`, `npm run verify` y los E2E pasan.

**Estado:** cumplido en staging y producción.
