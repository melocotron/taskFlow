# Feature Specification: Cuentas y tableros compartidos

**Feature Branch**: `002-shared-backend`

**Created**: 2026-10-23

**Status**: Approved

**Input**: "Queremos que TaskFlow deje de depender de `localStorage` y tenga cuentas
reales, datos compartidos entre dispositivos y permisos por tablero, con un backend
en Go y PostgreSQL."

## Clarifications

### Session 2026-10-23

- **Q: ¿Qué alcance tiene el backend?** → Multiusuario con cuentas reales. No es una
  demo anónima ni una aplicación de un solo usuario.
- **Q: ¿Cómo se autentican las personas?** → Email y contraseña. OAuth, verificación
  de email y recuperación de contraseña quedan fuera de esta versión.
- **Q: ¿Dónde se ejecuta la aplicación?** → El backend servirá también el frontend en
  producción, para que todo comparta un único origen. Vercel deja de ser producción.
- **Q: ¿Hay colaboración en vivo?** → No. Las personas ven los cambios de las demás al
  recargar o al volver a entrar al tablero. La sincronización en tiempo real queda
  fuera de alcance.
- **Q: ¿Cómo se invita?** → Un administrador añade por email a una cuenta ya
  registrada. Las invitaciones pendientes por correo quedan fuera de esta versión.
- **Q: ¿Qué pasa con los datos locales actuales?** → Se podrán importar una sola vez
  después de crear la cuenta. La importación no debe duplicar tableros.

## User Scenarios & Testing (mandatory)

### User Story 1 - Crear una cuenta y mantener la sesión (Priority: P1)

Una persona se registra con su nombre, email y contraseña, entra en TaskFlow y puede
cerrar sesión. Al recargar la página sigue dentro hasta que la sesión caduque o la
cierre.

**Why this priority**: sin una identidad real no se pueden compartir tableros ni aplicar
permisos. Es la puerta de entrada de todo lo demás.

**Independent Test**: se puede probar registrando una cuenta nueva, recargando la
página y comprobando que la sesión sigue activa; después, cerrando sesión y
comprobando que las rutas privadas vuelven a pedir credenciales.

**Acceptance Scenarios**:

1. **Given** una persona sin cuenta, **When** se registra con datos válidos, **Then**
   entra en la aplicación y ve su lista de tableros vacía.
2. **Given** una cuenta existente, **When** introduce el email y la contraseña
   correctos, **Then** entra y su sesión sobrevive a una recarga.
3. **Given** una persona con sesión iniciada, **When** pulsa “Salir”, **Then** la
   sesión se invalida y no puede volver a entrar sin autenticarse.
4. **Given** un email ya registrado, **When** alguien intenta crear otra cuenta con
   él, **Then** se le explica que ya existe y no se crea una cuenta duplicada.
5. **Given** una contraseña incorrecta, **When** alguien intenta entrar, **Then** no
   se revela si el email existe y se le pide que lo intente de nuevo.

---

### User Story 2 - Ver y conservar el trabajo desde cualquier dispositivo (Priority: P1)

Una persona crea un tablero, columnas y tarjetas desde un dispositivo. Al abrir
TaskFlow desde otro dispositivo y entrar con la misma cuenta, ve exactamente el mismo
trabajo, con las tarjetas en su columna y orden.

**Why this priority**: es el valor central del backend: el trabajo deja de estar atado
a un navegador y pasa a ser un dato compartido y duradero.

**Independent Test**: se puede probar creando un tablero con tarjetas desde un cliente,
cerrando la sesión, abriendo otro cliente con la misma cuenta y verificando que el
tablero y sus tarjetas aparecen igual.

**Acceptance Scenarios**:

1. **Given** una cuenta sin tableros, **When** crea uno, **Then** el tablero aparece en
   su lista y recibe las columnas iniciales “Por hacer”, “En curso” y “Hecho”.
2. **Given** un tablero con tarjetas, **When** la persona lo abre desde otro
   dispositivo, **Then** ve las mismas columnas, tarjetas y orden.
3. **Given** una tarjeta movida de columna, **When** se recarga la página, **Then** la
   tarjeta sigue en la columna y posición de destino.
4. **Given** una operación de guardado que falla, **When** la persona la intenta,
   **Then** la interfaz revierte el cambio y explica que no se guardó.

---

### User Story 3 - Compartir un tablero con roles (Priority: P2)

Quien administra un tablero añade a otra persona por email y decide si puede
administrar, editar o solo mirar. La otra persona ve el tablero al entrar y no puede
realizar acciones que su rol no permita.

**Why this priority**: convierte TaskFlow en una herramienta de equipo. Necesita que
existan cuentas y tableros persistentes, pero aporta valor sin cambiar el trabajo
básico.

**Independent Test**: se puede probar añadiendo una segunda cuenta como observadora,
entrando con ella y comprobando que ve el tablero pero no puede crear ni mover
tarjetas.

**Acceptance Scenarios**:

1. **Given** un tablero propio, **When** su administrador añade por email a una cuenta
   registrada como editora, **Then** esa persona ve el tablero y puede modificar sus
   tarjetas.
2. **Given** una persona observadora, **When** intenta crear, editar o mover una
   tarjeta, **Then** la acción se rechaza y se le explica que necesita permiso de
   edición.
3. **Given** una persona que no pertenece a un tablero, **When** intenta abrirlo por
   una URL directa, **Then** no puede ver ni modificar sus datos.
4. **Given** un tablero con un solo administrador, **When** intenta quitarse o
   degradarse a sí mismo, **Then** el sistema lo impide para que el tablero no quede
   sin administración.

---

### User Story 4 - Importar el trabajo local una sola vez (Priority: P3)

Una persona que ya usaba TaskFlow en su navegador crea una cuenta y decide importar
sus tableros y tarjetas locales. El trabajo aparece en su cuenta sin duplicarse si
repite la operación.

**Why this priority**: evita perder el trabajo de la versión 1.0, pero no bloquea el
uso nuevo del producto.

**Independent Test**: se puede probar con datos locales existentes, importándolos y
comprobando que aparecen una sola vez y que una segunda importación no crea copias.

**Acceptance Scenarios**:

1. **Given** datos locales en el navegador, **When** la persona inicia sesión y elige
   importarlos, **Then** sus tableros y tarjetas aparecen en su cuenta.
2. **Given** una importación ya realizada, **When** la persona vuelve a intentarlo,
   **Then** no se crean tableros duplicados y se le informa del resultado.
3. **Given** datos locales incompletos o corruptos, **When** se importan, **Then** se
   importa lo que sea válido y se explica qué no se pudo recuperar.

### Edge Cases

- **Email duplicado con distinta capitalización**: se trata como la misma cuenta.
- **Sesión caducada o revocada**: la siguiente petición pide autenticación sin perder
  los datos no guardados de forma silenciosa.
- **Dos personas editan la misma tarjeta**: la segunda operación recibe un aviso de
  conflicto y puede recargar; no se sobrescribe sin avisar.
- **Movimiento a una columna eliminada o de otro tablero**: se rechaza y no se altera
  el orden.
- **Tablero con muchas tarjetas**: la carga y el movimiento siguen siendo utilizables.
- **Servidor no disponible**: la interfaz muestra un error comprensible y permite
  reintentar.
- **Intento de acceso directo a datos ajenos**: se deniega sin revelar si el tablero
  existe.
- **Importación repetida o parcial**: no se duplican tableros ya importados.
- **Persona eliminada de un tablero**: deja de verlo y sus tarjetas asignadas quedan
  sin responsable visible, sin romper el tablero.

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: El sistema MUST permitir crear una cuenta con nombre, email y contraseña.
- **FR-002**: El sistema MUST tratar los emails sin distinguir mayúsculas y MUST
  impedir cuentas duplicadas.
- **FR-003**: El sistema MUST permitir iniciar y cerrar sesión.
- **FR-004**: La sesión MUST sobrevivir a una recarga y MUST dejar de ser válida al
  cerrar sesión o al caducar.
- **FR-005**: Las rutas y operaciones privadas MUST exigir una sesión válida.
- **FR-006**: Cada persona MUST ver únicamente los tableros a los que pertenece.
- **FR-007**: Una persona autenticada MUST poder crear un tablero con las columnas
  iniciales.
- **FR-008**: El sistema MUST persistir tableros, columnas, tarjetas y su orden.
- **FR-009**: Los usuarios con permiso MUST poder crear, editar y eliminar tarjetas.
- **FR-010**: Los usuarios con permiso MUST poder mover tarjetas entre columnas y
  dentro de una columna, conservando el orden.
- **FR-011**: El sistema MUST permitir asignar como responsable a una persona que
  pertenezca al tablero.
- **FR-012**: Un administrador MUST poder añadir, cambiar el rol o eliminar a una
  persona del tablero.
- **FR-013**: El sistema MUST aplicar los roles administrador, editor y observador en
  el servidor, no solo en la interfaz.
- **FR-014**: El sistema MUST impedir que un tablero se quede sin administrador.
- **FR-015**: El sistema MUST detectar ediciones concurrentes y comunicar el conflicto
  en lugar de sobrescribir silenciosamente.
- **FR-016**: El sistema MUST ofrecer estados de error comprensibles y una forma de
  reintentar las operaciones fallidas.
- **FR-017**: El sistema MUST permitir importar una sola vez los datos locales válidos.
- **FR-018**: El sistema MUST almacenar las contraseñas de forma que no puedan
  recuperarse en texto plano.
- **FR-019**: El sistema MUST invalidar las sesiones al cerrar sesión y MUST limitar su
  duración.
- **FR-020**: El sistema MUST registrar los fallos de autenticación y las operaciones
  denegadas sin exponer datos sensibles.

### Key Entities

- **Cuenta**: persona con nombre, email único y credenciales. Es la identidad que
  permite acceder al producto.
- **Sesión**: periodo de acceso asociado a una cuenta, con caducidad y posibilidad de
  revocación.
- **Tablero**: espacio de trabajo con título, columnas, tarjetas y personas con acceso.
- **Membresía**: relación entre una cuenta y un tablero, con un rol concreto.
- **Columna**: fase ordenada dentro de un tablero; contiene tarjetas en orden.
- **Tarjeta**: unidad de trabajo con título, descripción, responsable, columna y
  posición.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: Una persona nueva puede crear una cuenta y entrar en menos de 2 minutos.
- **SC-002**: El 100 % de los tableros y movimientos confirmados siguen igual después
  de recargar y de entrar desde otro dispositivo.
- **SC-003**: Una persona con rol de observador no puede completar ninguna acción de
  edición, ni desde la interfaz ni mediante una petición directa.
- **SC-004**: El 100 % de los accesos a tableros ajenos se rechazan sin revelar sus
  datos.
- **SC-005**: Un conflicto de edición se comunica al usuario en el 100 % de los casos;
  no se produce una sobrescritura silenciosa.
- **SC-006**: Los datos locales válidos se importan una sola vez; una segunda
  importación no crea duplicados.
- **SC-007**: Un tablero con 200 tarjetas se abre y se mueve sin que la interacción
  deje de ser utilizable.
- **SC-008**: Ninguna contraseña puede recuperarse en texto plano desde el sistema.

## Assumptions

- **Cuentas con email y contraseña.** No hay OAuth ni inicio de sesión con terceros en
  esta versión.
- **Sin verificación de email ni recuperación de contraseña.** Se añadirán en una
  especificación posterior; por ahora se asume que la persona recuerda sus
  credenciales.
- **Invitación a cuentas existentes.** El administrador añade por email a alguien que
  ya se registró; no hay invitaciones pendientes ni envío de correos.
- **Sin colaboración en vivo.** Los cambios de otras personas se ven al recargar o al
  volver a abrir el tablero; no hay WebSockets ni notificaciones en tiempo real.
- **Un tablero pertenece a personas, no a organizaciones.** No hay equipos globales ni
  espacios de trabajo anidados.
- **Sin adjuntos, comentarios ni historial de actividad.** Quedan fuera de alcance.
- **Los datos locales de la versión 1.0 se pueden importar**, pero no se sincronizan
  de forma continua con la cuenta.

## Out of Scope

- OAuth, SSO, verificación de email y recuperación de contraseña.
- Invitaciones pendientes y envío de correos.
- Sincronización en tiempo real, WebSockets, notificaciones y presencia.
- Organizaciones, equipos globales, facturación y planes.
- Adjuntos, comentarios, menciones e historial de actividad.
- Edición colaborativa de columnas más allá del flujo inicial.
- Aplicaciones móviles nativas.
