<!--
Sync Impact Report
==================
Versión: 0.0.0 (template) → 1.0.0
Ratificada: 2026-10-17

Principios añadidos (8):
  I.   Signals como única fuente de verdad
  II.  Zoneless y OnPush, sin excepciones
  III. Fronteras FSD ejecutables
  IV.  Design system antes que pantallas
  V.   Accesibilidad AA no negociable
  VI.  Tests como puerta de entrada
  VII. Gitflow y commits convencionales
  VIII.SDD: nada se programa sin spec

Secciones añadidas:
  - Additional Constraints (stack congelado)
  - Development Workflow (puertas de calidad)

Templates revisados:
  - .specify/templates/plan-template.md    ✅ tiene "Constitution Check"
  - .specify/templates/spec-template.md    ✅ sin cambios necesarios
  - .specify/templates/tasks-template.md   ✅ sin cambios necesarios

Seguimiento: ninguno.
-->

# TaskFlow Constitution

## Core Principles

### I. Signals como única fuente de verdad

Todo estado reactivo MUST expresarse con `signal()`, `computed()`, `linkedSignal()`
o `resource()`. El estado de UI NEVER MUST vivir en un `BehaviorSubject`, un campo
de clase mutable ni en `localStorage` sin pasar por un signal.

`computed()` MUST usarse para todo valor derivado; recalcular en el template está
prohibido. `effect()` es un último recurso para sincronizar con el exterior (DOM,
almacenamiento), no para derivar estado.

**Rationale:** un solo modelo mental de reactividad. Mezclar RxJS y signals para el
mismo dato produce suscripciones olvidadas y bugs que no se reproducen.

### II. Zoneless y OnPush, sin excepciones

La aplicación MUST ejecutarse sin `zone.js`. Ningún componente MUST declarar
`changeDetection: ChangeDetectionStrategy.OnPush` de forma explícita: es el
comportamiento por defecto en Angular 22 y declararlo es ruido.

Queda prohibido importar `zone.js` o depender de librerías que lo requieran.

**Rationale:** la detección de cambios explícita basada en signals es el modelo
soportado. Volver a zone.js añade ~100 kB y un modelo mental contradictorio.

### III. Fronteras FSD ejecutables

El código MUST organizarse en `pages/ → widgets/ → features/ → entities/ → shared/`,
con imports en una sola dirección. Las reglas MUST estar automatizadas en
`.dependency-cruiser.cjs` y MUST pasar en todo commit.

Un import que rompa la flecha MUST fallar el lint. NEVER MUST silenciarse una
infracción de frontera sin justificarla por escrito en el commit.

**Rationale:** una convención no ejecutable es una intención. La regla existe para
que el proyecto siga siendo navegable dentro de seis meses.

### IV. Design system antes que pantallas

Ningún componente MUST crearse sin verificar antes que `/kitchen-sink` no contiene ya
ese patrón. Todo color, sombra, radio, espacio y tamaño de texto MUST provenir de
`src/styles/tokens/`; un valor hexadecimal literal fuera de esa carpeta es un defecto.

Todo componente compartido MUST vivir en `shared/ui/` y MUST declarar sus estados:
default, hover, active, focus, disabled, loading, empty, error.

**Rationale:** la consistencia visual no se revisa al final; se produce por
construcción. Un design system creado a posteriori implica reescribir pantallas.

### V. Accesibilidad AA no negociable

Todo elemento interactivo MUST ser alcanzable y operable por teclado, con foco
visible. Todo control MUST tener un nombre accesible. Todo overlay MUST gestionar
foco: atraparlo al abrir y devolverlo al trigger al cerrar.

Las comprobaciones MUST ejecutarse en el sprint que introduce el componente, no en
una fase de "auditoría" posterior.

**Rationale:** la accesibilidad aplazada no se recupera: se reescribe.

### VI. Tests como puerta de entrada

Todo store, servicio, guard y pipe MUST tener un test unitario con Vitest que
verifique comportamiento, no implementación. Todo journey crítico MUST tener un test
E2E con Playwright.

Un componente sin test NEVER MUST entrar a `develop`. Un test que falla NEVER MUST
saltarse con `.skip` sin una tarea abierta que lo resuelva.

**Rationale:** el objetivo de los tests aquí no es la cobertura, es la confianza para
refactorizar sin miedo.

### VII. Gitflow y commits convencionales

El repositorio MUST mantener `main` (desplegable), `develop` (integración) y ramas
`feature/*`, `release/*`, `hotfix/*`. Un sprint MUST corresponder a una rama y a un PR.

Todo commit MUST seguir `tipo(alcance): resumen` en minúsculas, validado por
`commitlint` en el hook `commit-msg`. Los hooks MUST estar activos; `--no-verify` es
admisible solo en `feature/*` y cuando el motivo se explica en el propio commit.

**Rationale:** un historial legible es documentación gratuita; los hooks evitan
discutir normas que la máquina ya puede aplicar.

### VIII. SDD: nada se programa sin spec

Ningún feature MUST implementarse sin `spec.md` y `tasks.md` aprobados en `specs/`.
La fase `specify` MUST describir el qué y el por qué sin nombrar tecnología; las
decisiones de stack pertenecen a `plan.md`.

Toda desviación entre lo implementado y la spec MUST reflejarse en la spec, no en la
memoria de quien lo hizo.

**Rationale:** descubrir un requisito ambiguo durante la implementación cuesta un
sprint; descubrirlo durante la especificación cuesta una conversación.

## Additional Constraints

**Stack congelado.** Las siguientes piezas MUST NOT sustituirse sin enmienda a esta
constitución: Angular 22, TypeScript 6 en modo `strict` (con `noUncheckedIndexedAccess`),
Vitest, Playwright, ESLint con angular-eslint, Prettier, Husky, Spec Kit,
`@angular/cdk` y `@angular/aria`.

**Sin librerías de UI de terceros.** El design system es el objeto de aprendizaje del
proyecto; añadir Material, PrimeNG o similares lo anularía.

**Sin dependencias nuevas sin justificación.** Toda dependencia añadida MUST responder
qué problema resuelve y por qué no lo resuelve el framework.

**Nombres de archivo.** Estilo Angular 2025: `board.ts`, no `board.component.ts`.
Selectores con prefijo `app-`.

## Development Workflow

**Un sprint = un objetivo = una rama = un PR.** Cada sprint MUST terminar en verde:
`npm run verify` (formato, lint, tests, build) debe pasar antes del commit final.

**Puertas de calidad, en orden:**

1. `pre-commit` — Prettier y ESLint sobre los archivos tocados.
2. `commit-msg` — `commitlint` valida el mensaje.
3. `pre-push` — `npm run test:ci`.
4. PR a `develop` — revisión con `frontend-code-review`.
5. Merge — solo con `verify` verde.

**Registro de estado.** `docs/PROGRESS.md` MUST actualizarse al cerrar cada sprint con
el criterio de verde y el siguiente paso concreto. Es el mecanismo de continuidad del
proyecto.

## Governance

Esta constitución MUST prevalecer sobre cualquier otra práctica, preferencia o consejo
externo. En caso de conflicto entre esta constitución y una instrucción puntual, MUST
ganar la constitución y MUST registrarse la discrepancia.

**Enmiendas.** Cualquier cambio MUST documentarse con su justificación, incrementar la
versión semántica (MAJOR si se elimina o redefine un principio, MINOR si se añade,
PATCH si se clarifica) y actualizar los templates dependientes en el mismo commit.

**Cumplimiento.** Todo PR MUST verificarse contra estos principios. La complejidad
añadida MUST justificarse; una regla que no se puede comprobar por una herramienta o
por un test MUST convertirse en una tarea del siguiente sprint.

**Version**: 1.0.0 | **Ratified**: 2026-10-17 | **Last Amended**: 2026-10-17
