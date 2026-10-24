# TaskFlow — Plan Maestro

> Un solo objetivo: aprender Angular 22 completo construyendo **una** app real,
> sin perder el hilo entre sesiones.

---

## 0. Cómo leer esto (30 segundos)

| Si quieres…                                  | Ve a                          |
| -------------------------------------------- | ----------------------------- |
| Saber qué instalar y con qué comando         | **§2 Skills**                 |
| Entender las carpetas del proyecto           | **§3 Arquitectura**           |
| Empezar a trabajar ya                        | **§8 Sprints**                |
| Saber cómo trabajamos (las reglas del juego) | **§9 Protocolo anti-TDAH**    |
| Ver qué novedad de Angular 22 toco y cuándo  | **§10 Mapa de cobertura v22** |

---

## 1. Stack verificado

Verificado contra el registro de npm y angular.dev hoy.

| Pieza                 | Versión / elección                                      | Por qué                                                                                                                                    |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Angular               | **22.2.3** (`@angular/cli` 22.2.3)                      | Última estable. Signals-first, `OnPush` por defecto, zoneless.                                                                             |
| Node                  | 24.22.1 ✓ (Angular 22 pide ≥24.15)                      | Actualizado tras las alertas de seguridad de octubre.                                                                                      |
| Gestor de paquetes    | **npm**                                                 | Caché local en `.npm-cache/`; pnpm se descartó por el sandbox.                                                                             |
| Change detection      | **Zoneless**                                            | Es el futuro; en v22 es estable. Aprenderlo ahora evita des-aprender después.                                                              |
| Estilos               | **CSS nativo + custom properties**                      | Sin Tailwind ni SCSS: los tokens son el design system.                                                                                     |
| Primitivas accesibles | **`@angular/cdk` + `@angular/aria`** (22.2.3)           | CDK da overlay/portal/drag&drop; Aria da tabs, menu, listbox, combobox, grid, tree **ya accesibles**. No reimplementamos teclado ni focus. |
| Formularios           | **Signal Forms** (`@angular/forms/signals`)             | Estables en v22.                                                                                                                           |
| Datos                 | **`resource()` + repositorios HTTP**                    | La API Go es la fuente de verdad; `localStorage` solo se lee para importar la 1.0.                                                         |
| Backend               | **Go 1.27.3 + chi + pgx + goose**                       | API compartida, sesiones opacas y SQL explícito.                                                                                           |
| Base de datos         | **PostgreSQL 17**                                       | Docker en local; Neon en staging y producción.                                                                                             |
| Unit tests            | **Vitest + jsdom** (builder `@angular/build:unit-test`) | Es le default del CLI. `ng test`.                                                                                                          |
| E2E                   | **Playwright**                                          | Separado del unit test: es el estándar real.                                                                                               |
| Metodología           | **GitHub Spec Kit** (spec-driven development)           | `uv tool install specify-cli`.                                                                                                             |
| Git                   | **Gitflow + Husky v9 + commitlint + lint-staged**       | `main` / `develop` / `feature/*` / `release/*` / `hotfix/*`.                                                                               |
| Arquitectura          | **FSD adaptado a Angular**                              | Capas con dirección de import única, ver §3.                                                                                               |

### 1.1 Nota sobre el nombre de la carpeta

La carpeta se renombró a `taskFlow`. El repositorio remoto se llama `taskFlow` y la
app vive en la raíz del workspace, no en `apps/taskflow/`.

### 1.2 Backend compartido (Spec 002)

La versión 1.0 guardaba todo en `localStorage`. La Spec 002 añade un servicio compartido:

- **Go** sirve la API y, en producción, también la build de Angular.
- **PostgreSQL** es la fuente de verdad; Neon para staging y producción.
- **Sesiones opacas** en cookie `HttpOnly`, no JWT en `localStorage`.
- **Roles por tablero**: `admin`, `editor`, `viewer`; permisos en el servidor.
- **Optimistic locking** con `version` en tarjetas para no sobrescribir cambios.
- **Importación única** de los datos de 1.0 mediante `legacy_id`.

La interfaz ya consume la API: `BoardRepository` y `TaskRepository` hablan HTTP, la
identidad de sesión llega de `/me` y los E2E arrancan Go + PostgreSQL. La fase 9 de
`specs/002-shared-backend/tasks.md` está cerrada. `localStorage` solo se lee para
ofrecer la importación única del trabajo heredado.

---

## 2. Skills: cuáles, para qué, y cómo se instalan

### 2.1 Mapa por capa

| Capa                   | Skill                                    | Qué te da                                                                                                               | Estado            |
| ---------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **Framework**          | `angular-developer` (oficial de Angular) | Código idiomático v22: signals, `linkedSignal`, `resource`, `httpResource`, forms, DI, routing, SSR, ARIA, testing, CLI | Por instalar      |
| **Framework**          | `angular-new-app` (oficial de Angular)   | Estructura correcta al crear el proyecto                                                                                | Por instalar      |
| **Arquitectura**       | `architecture-and-design`                | Límites de capas, feature-first, repositorios, tiers de estado, estrategia de test                                      | Por instalar      |
| **TypeScript**         | `core-typescript`                        | Strict mode, tipos seguros, `satisfies`, uniones discriminadas                                                          | Por instalar      |
| **UI / design system** | **`interface-design`**                   | Dirección visual, jerarquía, tokens, profundidad, movimiento, `design-review` y `design-deslop`                         | **Ya instalada**  |
| **Tokens y CSS**       | `styling-and-design-tokens`              | Pipeline primitivo → semántico → componente, dark mode, cascade layers, container queries                               | Por instalar      |
| **Accesibilidad**      | `accessibility`                          | WCAG 2.2 AA, foco, teclado, ARIA, anuncios de ruta                                                                      | Por instalar      |
| **API de componentes** | `component-api-design`                   | Contrato de props, compound components, versionado de un componente compartido                                          | Por instalar      |
| **Tests unitarios**    | `test-quality`                           | Assert sobre comportamiento, builders, determinismo                                                                     | Por instalar      |
| **Tests E2E**          | `e2e-testing`                            | Selectores por rol, aislamiento de datos, sin `sleep`, triage de flaky                                                  | Por instalar      |
| **Rendimiento**        | `web-performance`                        | Presupuestos, LCP/INP/CLS, code splitting                                                                               | Por instalar      |
| **i18n**               | `i18n-and-localization`                  | ICU, `Intl`, RTL, catálogo de mensajes                                                                                  | Opcional (Fase 5) |
| **Revisión**           | `frontend-code-review`                   | Orquesta todas las anteriores sobre un diff                                                                             | Por instalar      |
| **SDD**                | `/speckit-*` (Spec Kit)                  | constitution, specify, clarify, plan, checklist, tasks, analyze, implement, converge                                    | Por instalar      |

### 2.2 Instalación (3 comandos)

```powershell
# 1) Skills oficiales de Angular (2 skills)
npx skills add https://github.com/angular/skills -g

# 2) Paquete de ingeniería frontend (13 skills, instalamos el subconjunto útil)
npx skills add danielteles/awesome-agent-skills -g `
  --skill angular --skill core-typescript --skill architecture-and-design `
  --skill accessibility --skill styling-and-design-tokens `
  --skill component-api-design --skill test-quality --skill e2e-testing `
  --skill web-performance --skill frontend-code-review

# 3) Spec Kit (CLI + los /speckit-* dentro del proyecto)
uv tool install specify-cli
```

**Verificación:** tras instalar, las carpetas deben aparecer en `C:\Users\uriar\.agents\skills`
(y quedan registradas en `~/.agents/.skill-lock.json`). El catálogo de skills de la
sesión se recarga al reiniciar la sesión de DSH.

> **No instalamos** `vercel-react-best-practices` para este proyecto: es de React y aquí
> no aplica. Se queda instalada por si la usas en otro lado.

### 2.3 Regla de uso (cuándo invoco cada una)

- Antes de escribir **cualquier componente de UI** → `interface-design` + `angular-developer`.
- Antes de **definir un token o CSS** → `styling-and-design-tokens`.
- Antes de **cerrar un componente compartido** → `accessibility` + `component-api-design` + `test-quality`.
- Antes de **un `merge` a `develop`** → `frontend-code-review`.
- Antes de **escribir un E2E** → `e2e-testing`.
- Antes de **un feature nuevo** → `/speckit-specify` (nunca código directo).

---

## 3. Arquitectura: FSD adaptado a Angular

### 3.1 Capas y dirección de importación

```
src/
├── app/
│   ├── app.ts                  # shell: providers globales, <router-outlet>
│   ├── app.routes.ts           # rutas raíz, todas lazy
│   ├── app.config.ts           # zoneless, http, errores
│   │
│   ├── pages/                  # 1 página = 1 ruta. Solo compone widgets y features.
│   │   ├── board-list/
│   │   ├── board-detail/
│   │   └── settings/
│   │
│   ├── widgets/                # bloques de UI con sentido propio (usan features + entities)
│   │   ├── board-canvas/       # el tablero con sus columnas
│   │   ├── app-sidebar/
│   │   └── command-palette/
│   │
│   ├── features/               # una acción del usuario = un feature
│   │   ├── create-task/
│   │   ├── move-task/          # drag & drop
│   │   ├── filter-tasks/
│   │   └── invite-member/
│   │
│   ├── entities/               # el negocio: modelo + store + API + UI de presentación
│   │   ├── board/
│   │   ├── task/
│   │   └── member/
│   │
│   └── shared/                 # sin conocimiento del negocio
│       ├── ui/                 # ← EL DESIGN SYSTEM (ver §4)
│       ├── lib/                # utilidades puras
│       └── api/                # cliente HTTP, interceptores
│
├── styles/
│   ├── tokens/                 # primitivos.css, semanticos.css, componentes.css
│   ├── base.css                # reset, tipografía base, focus ring
│   └── themes/                 # light.css, dark.css
│
└── e2e/                        # Playwright (fuera de src)
```

### 3.2 La regla absoluta

```
pages → widgets → features → entities → shared        ✅ permitido
shared → cualquier cosa                               ❌ prohibido (shared no importa negocio)
entities → features                                   ❌ prohibido
```

Se aplica automáticamente con `eslint-plugin-boundaries` (o `dependency-cruiser`).
Un import que rompa la flecha **falla el build**. Esto es lo que hace que FSD no
degenere en carpetas bonitas con espagueti dentro.

### 3.3 Anatomía de un slice

Cada slice (`entities/board/`, `features/create-task/`) se exporta solo por su `index.ts`:

```
entities/board/
├── index.ts              # API pública del slice (lo único importable desde fuera)
├── model/
│   ├── board.model.ts     # tipos + branded ids
│   ├── board.store.ts     # signals + computed + métodos
│   └── board.store.spec.ts
├── api/
│   ├── board.repository.ts # repositorio HTTP
│   └── importador-local.ts # lectura única del trabajo de la 1.0
└── ui/
    ├── board-card.ts      # componente presentacional
    └── board-card.spec.ts
```

**Regla:** si algo se usa dos veces, sube una capa. Si algo no se usa fuera, no lo exports.

---

## 4. Design system primero

### 4.1 Por qué primero

Todo lo demás lo va a consumir. Si lo haces después, reescribes todo. Va en Fase 1,
antes de cualquier feature.

### 4.2 Arquitectura de tokens (3 capas, sin excepciones)

```
primitivos.css   --color-ink-50 … --color-ink-950, --space-1…12, --text-…
      ↓ mapeo semántico
semanticos.css   --surface-canvas, --surface-raised, --text-primary, --text-muted,
                 --border-subtle, --accent, --danger, --success, --focus-ring
      ↓ uso
componentes.css  --button-bg, --button-fg, --card-padding, --input-border
```

Nadie escribe un hex en un componente. Si aparece un `#` fuera de `tokens/`, es un bug
de proceso y `styling-and-design-tokens` lo va a marcar.

### 4.3 Lo que se decide en S1.1 (y no antes)

Usando `interface-design`, en ese sprint se producen **cuatro artefactos** antes de
tocar una línea de CSS:

1. **Dominio** — 5+ conceptos del mundo del producto (tablero, columna, tarjeta, turno, taller, traspaso…).
2. **Mundo del color** — 5+ colores que existen físicamente ahí.
3. **Firma** — un elemento que solo podría existir en TaskFlow.
4. **Defaults a rechazar** — 3 elecciones obvias de "app kanban genérica" y su alternativa.

Sin esos cuatro, no hay dirección. Después: elegir, y recién ahí escribir tokens.
El resultado se guarda en `.interface-design/system.md` para que nunca haya que
re-decidir.

### 4.4 Inventario del design system (lo que construimos)

| Sprint | Componentes                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------- |
| S1.2   | Tokens, scale tipográfica, spacing, radios, elevación, dark mode                                      |
| S1.3   | `Button` (4 variantes × 4 estados), `IconButton`, `Input`, `Textarea`, `Field` (label + error + hint) |
| S1.4   | `Card`, `Panel`, `Badge`, `Avatar`, `Divider`, `Skeleton`, `EmptyState`                               |
| S1.5   | `Dialog` (CDK), `Menu` (Aria), `Tooltip`, `Toast`, `CommandPalette`                                   |
| S1.6   | Ruta `/kitchen-sink` que muestra **todos** los componentes y todos sus estados                        |

`/kitchen-sink` es tu banco de pruebas visual. Siempre está vivo en `ng serve`.

---

## 5. SDD con Spec Kit

### 5.1 El flujo (y cuándo se usa la versión corta)

**Corta** (features pequeños): `specify → plan → tasks → implement → converge`
**Completa** (producción): `constitution → specify → clarify → plan → checklist → tasks → analyze → implement → converge`

Empezamos con **`constitution`** una sola vez, con este contenido propuesto:

```text
TaskFlow es una app de gestión de tableros. Principios:

1. SIGNALS PRIMERO. Estado con signals/computed/linkedSignal. Nada de Subjects
   para estado de UI. rxjsResource solo cuando el origen es un observable.
2. ZONELESS Y ONPUSH. Sin zone.js. Todo componente OnPush (default v22).
3. LIMITES FSD. pages → widgets → features → entities → shared. Prohibido al revés.
   Verificado por lint en CI.
4. DESIGN SYSTEM OBLIGATORIO. Ningun componente nuevo sin antes verificar que
   /kitchen-sink no tiene ya ese patron. Prohibido hex fuera de src/styles/tokens/.
5. ACCESIBILIDAD AA NO NEGOCIABLE. Navegable por teclado, foco visible,
   roles correctos. Se verifica en el sprint, no al final.
6. TESTS. Todo store y todo servicio tiene spec. Todo journey critico tiene E2E.
   Un componente sin test no entra a develop.
7. COMMITS CONVENCIONALES. feat/fix/chore/docs/test/refactor + alcance.
   Falla commit-msg si no cumple.
8. SDD. Ningun feature se implementa sin spec.md y tasks.md aprobados.
```

### 5.2 Estructura que crea Spec Kit

```
.specify/
├── memory/constitution.md
└── templates/
specs/
└── 001-board-list/
    ├── spec.md        # el QUÉ y el POR QUÉ (sin stack)
    ├── plan.md        # el CÓMO (stack + diseño)
    ├── tasks.md       # tareas ordenadas por dependencia
    └── checklists/
```

**Regla de oro:** en `specify` no se nombra tecnología. Si escribes "usa signals",
estás en `plan`.

---

## 6. Gitflow + Husky

### 6.1 Ramas

```
main ──────────●────────────────●──────────  (siempre desplegable, solo merges de release/hotfix)
               ╲              ╱
develop ────●───●──●──●──●───●──────────────  (integración)
             ╲    ╱ ╲  ╱
feature/x     ●──●   ●●                       (una por sprint, sale de develop)
```

- `feature/S1.2-tokens` → PR a `develop`
- `release/0.1.0` → desde `develop`, merge a `main` + tag
- `hotfix/…` → desde `main`, merge a `main` y `develop`

Un sprint = una rama = un PR. Así el PR es tu "resumen de sesión".

### 6.2 Husky v9 + hooks

```powershell
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npx husky init
```

| Hook         | Contenido                  | Qué evita                                 |
| ------------ | -------------------------- | ----------------------------------------- |
| `pre-commit` | `npx lint-staged`          | Formato y lint sucios en el commit        |
| `commit-msg` | `npx commitlint --edit $1` | Commits "asdf" y sin conventional commits |
| `pre-push`   | `npm run test:ci`          | Subir a remoto con tests rojos            |

`lint-staged`: `*.ts → eslint --fix + prettier`, `*.html/*.css/*.md → prettier`.

**Nota:** `pre-push` corre tests → si tarda, usa `git push --no-verify` SOLO en ramas
`feature/*`, nunca en `develop`/`main`.

---

## 7. Estrategia de testing

| Nivel                     | Herramienta            | Qué se prueba                                                   | Dónde vive                  | Cuándo corre  |
| ------------------------- | ---------------------- | --------------------------------------------------------------- | --------------------------- | ------------- |
| Unit                      | **Vitest** (`ng test`) | Modelos, stores, pipes, guards, mappers, componentes con lógica | junto al archivo `.spec.ts` | pre-push + CI |
| Integración de componente | **Vitest** + `TestBed` | Que el componente reacciona a su input y emite output           | `.spec.ts`                  | pre-push + CI |
| E2E                       | **Playwright**         | Journeys críticos de usuario                                    | `e2e/*.spec.ts`             | CI + manual   |

### 7.1 Los 4 journeys que SÍ o SÍ van a E2E

1. Crear tablero → entra → crea tarea → aparece en la columna.
2. Mover una tarea entre columnas con drag & drop **y** con teclado.
3. Filtrar tareas y que el filtro sobreviva a un reload (URL).
4. Invitar a un miembro y que aparezca en el tablero.

Nada más. Un E2E que no representa un journey es un unit test lento.

### 7.2 Reglas duras

- Selectores por **rol y nombre accesible** (`getByRole('button', { name: 'Crear' })`). Nunca `data-testid` salvo último recurso.
- **Cero** `waitForTimeout`. Solo `expect(...).toBeVisible()` (auto-retry).
- Cada test crea sus propios datos (`board-${uuid}`) y los limpia.
- Un test = un escenario = un nombre que se lee como frase.

---

## 8. El plan de sprints

> Cada sprint: **un objetivo**, 45–60 min, y termina **en verde con un commit**.
> Si algo no cabe, se corta el sprint, no se estira.

### Fase 0 — Cimientos (4 sprints)

| #        | Objetivo                                                                                         | Verde cuando                                                                   |
| -------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **S0.1** | Repo + Gitflow + husky + commitlint + prettier + eslint                                          | Un commit con mensaje inválido es rechazado; uno válido pasa                   |
| **S0.2** | `ng new` Angular 22 zoneless + esqueleto FSD + alias `@pages`, `@shared`… + boundaries en eslint | `npm run build` y `npm test` pasan; un import ilegal falla                     |
| **S0.3** | Spec Kit instalado + `constitution` + primer `spec` (primer feature real)                        | `.specify/memory/constitution.md` existe y `specs/001-…/spec.md` está aprobado |
| **S0.4** | Playwright + GitHub Action (lint + test + e2e)                                                   | Un push a `develop` corre todo en CI y sale verde                              |

### Fase 1 — Design system (6 sprints)

| #        | Objetivo                                                                             | Verde cuando                                                                    |
| -------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **S1.1** | Dirección visual: dominio, mundo de color, firma, defaults rechazados → elegir       | 3 direcciones presentadas, 1 elegida, guardada en `.interface-design/system.md` |
| **S1.2** | Tokens: primitivos + semánticos + escala tipográfica + spacing + dark mode           | `/kitchen-sink` muestra solo la rampa y los tokens; sin hex fuera de `tokens/`  |
| **S1.3** | Controles: `Button`, `IconButton`, `Input`, `Textarea`, `Field`                      | 4 variantes × 4 estados visibles, tests de teclado y focus                      |
| **S1.4** | Superficies: `Card`, `Panel`, `Badge`, `Avatar`, `Divider`, `Skeleton`, `EmptyState` | Todos en `/kitchen-sink`, con test de accesibilidad                             |
| **S1.5** | Overlays: `Dialog`, `Menu`, `Tooltip`, `Toast` (CDK + Aria)                          | Esc cierra, foco vuelve al trigger, Tab atrapado                                |
| **S1.6** | Cierre: `/kitchen-sink` completo + `design-review` de `interface-design`             | Pasan swap / squint / signature / token test                                    |

### Fase 2 — Dominio (4 sprints)

| #        | Objetivo                                                                          | Verde cuando                                      |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| **S2.1** | Entity `board`: modelo + store con signals + spec                                 | Crear/renombrar/archivar tablero + tests          |
| **S2.2** | Entity `task`: modelo + store + estados                                           | Mover tarea de columna cambia el estado, con test |
| **S2.3** | Entity `member` + roles/permissions                                               | Un `viewer` no puede editar (test)                |
| **S2.4** | Repositorios async con latencia simulada, errores y estados `loading/error/empty` | Estados reales en el UI; sin backend              |

### Fase 3 — Features (8 sprints)

| #         | Objetivo                                            | Verde cuando                                     |
| --------- | --------------------------------------------------- | ------------------------------------------------ |
| **S3.1**  | Auth mock + guards funcionales + ruta protegida     | Sin sesión redirige; con sesión entra            |
| **S3.2**  | Página `board-list` + routing lazy                  | Lazy chunk verificado en el build                |
| **S3.3**  | Página `board-detail` + columnas                    | Se ve el tablero con sus columnas                |
| **S3.4**  | Drag & drop con `@angular/cdk/drag-drop`            | Mover reordena y persiste; accesible por teclado |
| **S3.5**  | Crear/editar tarea con **Signal Forms**             | Validación + errores + submit, con tests         |
| **S3.5b** | Renombrar el tablero; formulario en `features`      | Nombre nuevo persistido y validado               |
| **S3.6**  | Filtros/búsqueda con `linkedSignal` + estado en URL | Recargar mantiene el filtro                      |
| **S3.7**  | Invitaciones y rol **por tablero** (historia 4)     | Observador ve sin acciones; URL ajena se niega   |

### Fase 4 — Calidad (4 sprints + ajustes)

| #          | Objetivo                                                    | Verde cuando                                |
| ---------- | ----------------------------------------------------------- | ------------------------------------------- |
| **S4.1**   | E2E Playwright: los 4 journeys                              | `npm run e2e` verde en CI                   |
| **S4.2**   | Auditoría a11y completa (`accessibility`)                   | 0 violaciones axe + navegación por teclado  |
| **S4.3**   | Performance: budgets, `@defer`, revisión de OnPush/zoneless | Bundle dentro de presupuesto, sin `zone.js` |
| **S4.4**   | Pulido visual: `design-deslop` + `design-review`            | Revisión aprobada                           |
| **S4.4.1** | Hundido global de superficies pulsables                     | Revisión manual y E2E verde                 |

### Fase 4.5 — Reconciliación y cobertura v22 (2 sprints)

| #        | Objetivo                                                           | Verde cuando                                          |
| -------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **S4.5** | Alinear `PLAN.md`, `PROGRESS.md` y READMEs con lo construido       | Documentación sin contradicciones y `format:check`    |
| **S4.6** | Laboratorio dev-only de `@Service`, `injectAsync` y `httpResource` | E2E verde y producción sin HttpClient ni kitchen-sink |

### Fase 5 — Entrega y extras v22 (3 sprints)

| #        | Objetivo                                              |
| -------- | ----------------------------------------------------- |
| **S5.1** | GitHub real, CI verde, changelog y release `1.0.0`    |
| **S5.2** | SSR + incremental hydration + event replay            |
| **S5.3** | WebMCP experimental (exponer los tableros como tools) |

### Fase 6 — Backend compartido (Spec 002)

| #         | Objetivo                                                                | Verde cuando                                            |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| **S6.1**  | Spec 002, PostgreSQL local, configuración, migraciones y salud          | Migraciones aplicadas y `/readyz` verde                 |
| **S6.2**  | Auth, tableros, miembros, tarjetas, movimiento e importación            | `go test ./...` con PostgreSQL real                     |
| **S6.3**  | Docker multi-stage, servir Angular desde Go y CI de backend             | Imagen única y job `backend` verde                      |
| **S6.4**  | Integrar Angular con la API (repositorios HTTP, login/registro, guards) | `npm run verify` y E2E con Go + PostgreSQL              |
| **S6.5a** | Desplegar staging en Fly.io + Neon                                      | URL `*.fly.dev`, cookies seguras y migración en release |
| **S6.5b** | Desplegar producción y retirar Vercel de producción                     | Producción verificada y una sola fuente de datos        |

S6.1–S6.5a están cerrados: 189 tests unitarios, 33 E2E con Go + PostgreSQL, `verify`
verde y staging en `https://taskflow-stg-melocotron.fly.dev`. Queda S6.5b (producción).

**Total: ~37 sprints.** La estimación inicial de 24–29 horas ya no aplica: el proyecto
incluye S4.4.1, la reconciliación, el laboratorio y el backend compartido. El calendario
depende de la sesión.

---

## 9. Protocolo anti-TDAH

Estas reglas existen para que no pierdas el hilo, no para limitarte.

### 9.1 Las 6 reglas

1. **Un objetivo por sprint.** Si aparece una idea buena a mitad: se anota en `docs/IDEAS.md` y se sigue. No se persigue.
2. **Siempre terminar en verde.** Nunca dejes la rama con el build roto. Un commit WIP en verde es infinitamente mejor que un feature a medias.
3. **WIP = 1.** Una rama, un sprint, una cosa.
4. **Tiempo visible.** Timer de 45 min. Al sonar: commit y parar, aunque estés "casi".
5. **El diff manda.** Antes de commitear, lee tu propio `git diff`. 2 minutos que evitan el 80% de la confusión de la próxima sesión.
6. **Si te atascas 15 min en algo, pregúntame.** No es fracaso, es el protocolo.

### 9.2 El archivo `docs/PROGRESS.md`

Se actualiza al final de cada sprint. Es lo primero que lees al empezar:

```markdown
## Sprint actual: S1.3 — Controles

- ✅ Button (4 variantes)
- ⬜ Input
- ⬜ Textarea

### Dónde me quedé

Estaba ajustando el focus-ring del Input. Los estados hover ya están.

### Siguiente paso concreto

Añadir al Button el estado `loading` y su test.

### Ideas aparcadas

- Sonido al completar tarea (post-MVP)
```

### 9.3 Cómo pedirme las cosas (copia y pega)

- `Ejecuta el sprint S1.3. Muéstrame el plan antes de tocar código.`
- `¿Dónde me quedé? Lee docs/PROGRESS.md y dime el siguiente paso.`
- `Revisa lo que hice hoy con frontend-code-review.`
- `Explícame <concepto> en 5 líneas y dame un ejercicio de 10 minutos.`
- `Guarda el estado y cierra la sesión.`

### 9.4 Reducción de ruido

- **Nada de Storybook** (otra app que mantener). Usamos la ruta `/kitchen-sink`.
- **Nada de Nx** todavía. Un proyecto Angular simple; si algún día crece, migramos.
- **Nada de librerías de UI**. Eso es justamente lo que queremos aprender a hacer.
- **Un solo comando de verificación**: `npm run verify` = formato + lint + test + build.

---

## 10. Mapa de cobertura: cada novedad de Angular 22, con su sprint

Para que "todas las nuevas funcionalidades" sea verificable, no aspiracional.

| Novedad v22                                                    | Sprint        |
| -------------------------------------------------------------- | ------------- |
| Zoneless + `OnPush` por defecto                                | S0.2          |
| Standalone components + control flow (`@if`/`@for`/`@switch`)  | S0.2          |
| `@Service()` (reemplazo de `@Injectable({providedIn:'root'})`) | S4.6          |
| `inject()` / `injectAsync()`                                   | S2.1 / S4.6   |
| Signals, `computed`, `effect`                                  | S2.1          |
| `linkedSignal`                                                 | S3.6          |
| `resource()` + estados async                                   | S2.4          |
| `httpResource` + interceptores                                 | S4.6          |
| Signal Forms (`@angular/forms/signals`)                        | S3.5          |
| `input()`, `output()`, `model()`, queries por signal           | S1.3          |
| Multi-case y exhaustive `@switch`                              | S1.4          |
| Spread/rest en templates + arrow functions en template         | S1.5          |
| Comentarios HTML en template                                   | S2.1          |
| `@angular/aria` (accessible primitives)                        | S1.5          |
| `@angular/cdk` drag & drop                                     | S3.4          |
| Lazy routing + route-level render modes                        | S3.2 / S5.2   |
| SSR + incremental hydration + event replay                     | S5.2          |
| `@boundary` / `@error` (dev preview)                           | S5.2          |
| WebMCP (experimental)                                          | S5.3          |
| TypeScript 6                                                   | S0.2          |
| Angular CLI MCP (`ng mcp`)                                     | Opcional, §11 |

---

## 11. Opcionales (no bloquean nada)

- **`ng mcp`**: el CLI de Angular expone un MCP server con `ai_tutor`, `devserver_start`,
  `run_target`, `search_documentation`. Es útil si trabajas en Cursor/VS Code, pero
  DSH ya tiene shell + build + tests, así que aquí es redundante.
- **Extensión `git` de Spec Kit**: crea ramas numeradas (`001-…`) automáticamente.
  Útil si te sirve atar cada spec a una rama; con Gitflow manual ya cubrimos esto.
- **`i18n-and-localization`**: solo si decides que la app sea multi-idioma (Fase 5).

---

## 12. Decisiones cerradas

1. La carpeta se renombró a `taskFlow` y la app vive en la raíz del workspace.
2. El remoto es GitHub: `https://github.com/melocotron/taskFlow.git`. CI quedó verde
   en `main` y `develop` al cerrar S5.1.
3. No se rellenan `plan.md`/`tasks.md` de 001 a posteriori. Spec Kit se usa desde la
   Fase 5; hasta ahora el seguimiento vive en `PLAN.md` y `PROGRESS.md`.
4. Archivar tableros queda para después del 1.0: el dominio ya lo soporta, falta la UI.
5. La 1.0 se publicó en Vercel. El destino de producción es una imagen Go que sirve
   Angular y la API desde el mismo origen, con PostgreSQL en Neon. Staging ya está
   desplegado en `https://taskflow-stg-melocotron.fly.dev`; hasta cerrar S6.5b, Vercel
   sigue publicando la SPA y sus previews.

## 13. Desviaciones conscientes

- **Importación heredada visible.** `localStorage` ya no es la fuente de datos. Solo se
  lee para ofrecer la importación única de la 1.0; el aviso desaparece al confirmar.
- **Archivar sin puerta.** `BoardStore.archivar()` y su test existen desde S2.1, pero no
  hay acción de UI ni vista de archivados.
- **Spec 001 sin artefactos posteriores.** Solo hay `spec.md`; no se generaron `plan.md`,
  `tasks.md` ni `checklists/`.
- **Renombrar se resolvió.** El repo local y el remoto usan `taskFlow`.
