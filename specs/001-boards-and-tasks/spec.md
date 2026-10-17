# Feature Specification: Tableros kanban con equipos

**Feature Branch**: `001-boards-and-tasks`

**Created**: 2026-10-17

**Status**: Draft

**Input**: "Tableros kanban con equipos: crear tableros con columnas, crear y mover
tareas entre columnas, invitar miembros con roles"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Ver el trabajo del equipo en un tablero (Priority: P1)

Una persona del equipo abre un tablero y ve, de un vistazo, en qué está trabajando
cada quien: las columnas del flujo y las tarjetas dentro de cada una.

**Why this priority**: es el valor mínimo del producto. Sin esta vista, nada más
tiene sentido; con solo esta vista, TaskFlow ya sustituye a una hoja de cálculo.

**Independent Test**: se puede probar abriendo un tablero de ejemplo con tarjetas
repartidas en columnas y verificando que cada tarjeta aparece en la columna que le
corresponde y que se distingue el número de tarjetas por columna.

**Acceptance Scenarios**:

1. **Given** un tablero con tres columnas y cinco tarjetas repartidas, **When** la
   persona lo abre, **Then** ve las tres columnas en orden y cada tarjeta en su columna.
2. **Given** un tablero sin tarjetas, **When** la persona lo abre, **Then** ve un mensaje
   que explica que aún no hay trabajo y cómo añadir el primero.
3. **Given** un tablero con más tarjetas de las que caben en pantalla, **When** la persona
   desplaza una columna, **Then** las demás columnas mantienen su posición.

---

### User Story 2 - Mover una tarea a otra columna (Priority: P1)

La persona arrastra una tarjeta de "En curso" a "Hecho" y el cambio se guarda. También
puede hacerlo sin ratón, con el teclado.

**Why this priority**: mover el trabajo es la acción que convierte al tablero en una
herramienta viva en lugar de una foto.

**Independent Test**: se puede probar moviendo una tarjeta entre dos columnas y
recargando la página: la tarjeta permanece en su nueva columna.

**Acceptance Scenarios**:

1. **Given** una tarjeta en "Por hacer", **When** la persona la mueve a "En curso",
   **Then** la tarjeta aparece en "En curso" y desaparece de "Por hacer".
2. **Given** una tarjeta movida, **When** la persona recarga la página, **Then** la
   tarjeta sigue en la columna de destino.
3. **Given** una tarjeta seleccionada con el teclado, **When** la persona pulsa las
   flechas y confirma, **Then** la tarjeta cambia de columna igual que con el ratón.
4. **Given** un movimiento que falla al guardarse, **When** la persona lo intenta,
   **Then** la tarjeta vuelve a su columna original y se le informa del fallo.

---

### User Story 3 - Añadir y describir una tarea (Priority: P2)

La persona añade una tarjeta nueva a una columna con un título y, si quiere, una
descripción y una persona responsable.

**Why this priority**: sin poder crear trabajo nuevo, el tablero se queda vacío en
cuanto se vacía. Es el segundo paso natural, no el primero.

**Independent Test**: se puede probar creando una tarjeta en una columna y comprobando
que aparece al final de esa columna con el título escrito.

**Acceptance Scenarios**:

1. **Given** una columna cualquiera, **When** la persona añade una tarjeta con título
   "Revisar copy", **Then** la tarjeta aparece en esa columna con ese título.
2. **Given** el formulario de creación abierto, **When** la persona intenta guardar sin
   título, **Then** se le impide y se le explica por qué.
3. **Given** una tarjeta existente, **When** la persona la edita, **Then** los cambios
   se conservan tras recargar.

---

### User Story 4 - Compartir el tablero con el equipo (Priority: P3)

Quien creó el tablero invita a otras personas y decide si pueden editar o solo mirar.

**Why this priority**: aporta valor real pero necesita que existan tableros y tareas
para tener sentido; se puede aplazar sin romper nada.

**Independent Test**: se puede probar invitando a una persona como observadora y
verificando que ve el tablero pero no las acciones de edición.

**Acceptance Scenarios**:

1. **Given** un tablero propio, **When** el autor invita a alguien como observador,
   **Then** esa persona ve el tablero sin acciones de edición disponibles.
2. **Given** una persona observadora, **When** intenta mover una tarjeta, **Then** la
   acción no está disponible y se le explica que necesita permiso de edición.

### Edge Cases

- **Tablero compartido entre dos personas editando a la vez**: la última acción gana y
  la otra persona ve el estado actualizado sin perder su trabajo en curso.
- **Pérdida de conexión durante un movimiento**: la tarjeta vuelve a su sitio y se
  avisa; no se pierde la tarjeta.
- **Título de tarea muy largo o vacío**: se limita la longitud visible y se impide
  guardar un título vacío.
- **Columna vacía al arrastrar**: la columna vacía debe seguir aceptando tarjetas.
- **Persona sin permiso en una URL directa a un tablero**: se le muestra un mensaje de
  acceso denegado, no un error técnico.
- **Muchas tarjetas en una columna**: la columna sigue siendo usable y el rendimiento
  no se degrada de forma perceptible.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema MUST permitir a una persona autenticada ver la lista de
  tableros a los que tiene acceso.
- **FR-002**: El sistema MUST mostrar un tablero como una secuencia ordenada de
  columnas, cada una con sus tarjetas en orden.
- **FR-003**: Los usuarios MUST poder crear un tablero con un título y columnas por
  defecto.
- **FR-004**: Los usuarios MUST poder crear una tarjeta dentro de una columna.
- **FR-005**: Los usuarios MUST poder editar el título y la descripción de una tarjeta.
- **FR-006**: Los usuarios MUST poder mover una tarjeta a otra columna, por ratón y por
  teclado, conservando el orden dentro de la columna de destino.
- **FR-007**: El sistema MUST persistir cada movimiento de forma que se mantenga tras
  recargar la página.
- **FR-008**: El sistema MUST revertir un movimiento fallido y comunicar el error.
- **FR-009**: El sistema MUST permitir al autor de un tablero invitar a otras personas.
- **FR-010**: El sistema MUST asignar a cada persona un rol — administrador, editor u
  observador — y MUST impedir las acciones no permitidas por el rol.
- **FR-011**: El sistema MUST permitir asignar una persona responsable a una tarjeta.
- **FR-012**: El sistema MUST mostrar un estado comprensible cuando no hay datos
  (sin tableros, tablero vacío, columna vacía).
- **FR-013**: El sistema MUST mostrar un estado de error comprensible cuando una
  operación falla, con opción de reintentar.

### Key Entities _(include if feature involves data)_

- **Tablero**: el espacio compartido de trabajo. Tiene título, un conjunto ordenado de
  columnas y una lista de personas con acceso. Pertenece a una organización o a una
  persona.
- **Columna**: una fase del flujo dentro de un tablero (por hacer, en curso, hecho).
  Tiene título y posición. Contiene tarjetas en orden.
- **Tarjeta**: una unidad de trabajo. Tiene título, descripción opcional, persona
  responsable opcional, columna actual y posición dentro de ella.
- **Persona**: alguien que puede acceder a un tablero. Tiene nombre visible y un rol
  dentro de cada tablero.
- **Rol**: el nivel de permiso de una persona sobre un tablero concreto:
  administrador (todo), editor (contenido), observador (solo lectura).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Una persona nueva puede abrir un tablero de ejemplo y entender el estado
  del trabajo en menos de 10 segundos, sin instrucciones.
- **SC-002**: Mover una tarjeta entre columnas se percibe como inmediato: la tarjeta
  aparece en su destino en menos de 200 ms desde la acción.
- **SC-003**: Una persona puede crear una tarjeta en una columna existente en menos de
  15 segundos desde que decide hacerlo.
- **SC-004**: Tras recargar la página, el 100 % de los movimientos confirmados conservan
  su columna y orden.
- **SC-005**: Todas las acciones de la historia P1 son realizables sin ratón, con
  teclado y foco visible.
- **SC-006**: Un tablero de 200 tarjetas sigue respondiendo: la interacción no supera
  200 ms y el desplazamiento no da tirones perceptibles.
- **SC-007**: Un fallo de red durante un movimiento no produce pérdida de datos: la
  tarjeta vuelve a su estado previo y la persona lo sabe.

## Assumptions

- **Autenticación simulada en esta fase.** No hay proveedor de identidad real todavía;
  se parte de una sesión de demostración con tres personas de ejemplo. La elección se
  revisará en la especificación de acceso.
- **Sin tiempo real en la primera versión.** Dos personas editando a la vez ven los
  cambios al recargar o al volver al tablero; la sincronización en vivo queda para una
  especificación posterior.
- **Un único flujo por tablero.** Las columnas son parte del tablero y editables, pero
  no hay plantillas de flujo reutilizables en esta primera versión.
- **Orden manual de tarjetas.** El orden lo decide quien arrastra, no una regla
  automática (fecha, prioridad). El orden automático es una especificación aparte.
- **Sin adjuntos ni comentarios.** Las tarjetas tienen título y descripción; archivos y
  conversaciones quedan fuera de alcance.
- **Uso desde un solo tipo de dispositivo por sesión.** No se exige colaboración
  simultánea entre móvil y escritorio; el diseño debe ser usable en ambos.
