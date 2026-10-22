# Changelog

Todas las versiones relevantes de TaskFlow. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
versionado semántico.

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
