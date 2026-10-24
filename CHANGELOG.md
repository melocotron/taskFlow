# Changelog

Todas las versiones relevantes de TaskFlow. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
versionado semántico.

## [Unreleased]

### Añadido

- Backend compartido en Go 1.27 con chi, pgx y PostgreSQL 17.
- Registro, login, logout y sesiones revocables con cookie `HttpOnly` y Argon2id.
- Tableros persistentes con columnas iniciales, miembros y roles por tablero.
- Tarjetas con creación, edición, borrado, responsable y movimiento transaccional.
- Detección de conflictos mediante `version` en las tarjetas.
- Importación única de tableros y tarjetas de `localStorage` mediante `legacy_id`.
- Docker Compose para PostgreSQL local y base `taskflow_test`.
- Dockerfile multi-stage que sirve Angular y la API desde Go.
- Cliente HTTP `shared/api` con errores tipados y proxy de desarrollo hacia Go.
- Acceso real con email y contraseña: `AuthService`, guards de sesión e invitado y
  pantalla de login/registro conectada a la API.
- Repositorios HTTP para tableros y tarjetas; stores asíncronos, lienzo, formularios,
  filtros y panel de personas adaptados a los datos del servidor.
- Aviso **Importar mis datos** en la lista de tableros para traer una sola vez el
  trabajo de la 1.0; las claves locales se borran tras la confirmación del servidor.
- Job de backend en GitHub Actions con PostgreSQL real y job E2E con PostgreSQL 17,
  migraciones y Go.
- Dependencia fijada de Vite 8.3.5 mediante `overrides`; `npm audit` queda sin
  vulnerabilidades conocidas.
- Despliegue staging en Fly.io (`taskflow-stg-melocotron.fly.dev`) con Neon PostgreSQL
  17, migraciones de release y health checks.
- Despliegue producción en Fly.io (`taskflow-prod-melocotron.fly.dev`) con una rama de
  Neon separada.
- Redirección de Vercel a producción para no servir una SPA sin API.

### Cambiado

- `MemberStore` recupera la identidad de `GET /me` y ya no la persiste en
  `localStorage`.
- Los E2E usan cuentas reales, cookie `HttpOnly` y PostgreSQL en lugar de sembrar el
  navegador; la suite pasa a **33 tests**.
- El límite de autenticación por IP se amplía solo en los entornos `test` y `e2e` para
  no interferir con la suite; desarrollo y producción conservan el límite estricto.
- El feedback de presión de los botones respeta `prefers-reduced-motion`.
- La imagen Go usa `CMD` en lugar de `ENTRYPOINT` para que `taskflow-migrate` funcione
  como release command de Fly.io.

### Documentación

- Especificación 002, plan, investigación, modelo de datos, contrato OpenAPI, quickstart
  y lista de tareas.
- `docs/ARQUITECTURA.md` con capas del frontend, backend Go, datos, seguridad y
  despliegue.
- README, plan maestro, progreso y guía de despliegue actualizados para el estado
  HTTP + PostgreSQL.

### Pendiente

- Eliminar manualmente el proyecto de Vercel cuando ya no se necesite. Hasta entonces,
  `vercel.json` redirige a producción; en el plan trial de Fly la máquina se apaga por
  inactividad y despierta con la primera petición.

## [1.0.0] - 2026-10-21

Primera versión completa de TaskFlow: tableros kanban con equipos, roles e
invitaciones, construida con Angular 22 zoneless y persistencia local.

### Añadido

- Entrada sin contraseña con tres personas de ejemplo y sesión persistente.
- Lista de tableros con creación, estados de carga, vacío y error.
- Tablero con columnas, tarjetas, arrastre y movimiento por menú con teclado.
- Creación y edición de tarjetas con Signal Forms, incluido responsable.
- Renombrado de tableros y filtros por texto o persona guardados en la URL.
- Invitaciones y roles por tablero: administrador, editor y observador.
- Design system propio con tokens, temas de turno, kitchen-sink y modo de
  movimiento reducido.
- Avisos accesibles sobre los overlays y hundido global de superficies pulsables.
- Laboratorio de desarrollo para `@Service`, `injectAsync` y `httpResource`.

### Accesibilidad

- Auditoría axe sin violaciones en las pantallas principales.
- Recorrido completo con teclado, foco visible y gestión de foco en diálogos.
- Contraste revisado, nombres accesibles y estados anunciados.

### Rendimiento

- Aplicación zoneless sin `zone.js`.
- Carga diferida de rutas y del contenedor de avisos.
- Bundle inicial dentro del presupuesto de 350 kB.

### Calidad

- 180 tests unitarios con Vitest y jsdom.
- 32 tests E2E con Playwright, incluidos los cuatro journeys del producto.
- Formato, lint, fronteras de arquitectura y build en un solo `npm run verify`.
- CI de GitHub Actions para calidad y E2E.

### Limitaciones conocidas

- Los datos son locales a cada navegador; no hay backend ni colaboración en vivo.
- Archivar tableros existe en el dominio, pero todavía no tiene interfaz.
- No hay despliegue web: la entrega inicial es el repositorio y el tag de GitHub.
