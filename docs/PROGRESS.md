# Estado del proyecto

> Lo primero que lees al empezar una sesión. Lo último que actualizas antes de parar.
> Formato: corto, concreto, sin prosa.

---

## ✅ Fase 0 — Cimientos (4/4)

**S0.1** Repo + Gitflow + husky + commitlint + prettier + eslint. Hooks verificados en
ambos sentidos (mensaje inválido rechazado, válido aceptado).

**S0.2** Esqueleto FSD, aliases `@pages`/`@entities`/`@shared`, fronteras ejecutables
con dependency-cruiser, `strict: true`, `home` lazy (chunk 764 B).
Verificado: un import `shared → entities` fue bloqueado por el lint.

**S0.3** Spec Kit 0.14.3, 10 skills `speckit-*` activas, constitución v1.0.0 (8
principios), **spec 001 aprobada** con 4 historias y 13 requisitos.

**S0.4** Playwright con `webServer` + smoke test por rol + GitHub Action (jobs
`quality` y `e2e`). `npm run e2e` verde en local.

---

## ✅ Fase 1 · S1.1 — Dirección visual

**Elegida: A · Taller**, con **la lengüeta de turno** como elemento firma.
Todo escrito en [.interface-design/system.md](../.interface-design/system.md):

- Paleta completa: 12 primitivos + 5 colores de turno + 14 semánticos.
- Tipografía: Fraunces (títulos) + IBM Plex Sans (UI) + IBM Plex Mono (datos), ratio 1.25.
- Espacio: base 4px, escala 4→64. Densidad media.
- Profundidad: **solo filetes y tono, cero sombras** (salvo overlays).
- Movimiento: 120–240 ms, solo transform y opacidad, sin animación en acciones repetidas.
- Fuera de alcance: modo oscuro en v1.

**Sin CSS todavía**, por diseño: los tokens se escriben en S1.2 y se ven vivos en
`/kitchen-sink` antes de crear el primer componente.

---

## ✅ Fase 1 · S1.2 — Tokens y kitchen-sink

Tres niveles de tokens (primitivos → semánticos → componentes) en `@layer`, base.css con
reset y foco global, Fraunces + IBM Plex Sans/Mono autohospedadas con `@fontsource`.
Ruta `/kitchen-sink` que **lee los valores en runtime** (`getComputedStyle`): si un token
desaparece, la página muestra `—` en lugar de mentir.
Guardián `npm run check:tokens` (falla con cualquier hex fuera de `src/styles/tokens/`),
integrado en `verify`. Presupuesto de CSS por componente subido a 6 kB.

**Verificado visualmente** con captura de Playwright. La primera captura delató dos
errores míos: la escala tipográfica entera salía en Fraunces (el texto de interfaz debe
ir en Plex) y seis secciones con el mismo hueco de 48 px (ritmo monótono). Ambos
corregidos y re-capturados.

---

## ✅ Fase 1 · S1.3 — Controles

Cuatro piezas en `shared/ui`, todas con test:

| Pieza                                    | Qué resuelve                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| `button[appButton]`                      | 4 variantes × 2 tamaños · `loading` que además deshabilita (evita doble envío) |
| `button[appIconButton]`                  | caja fija de 40×40 · `label` obligatorio para el nombre accesible              |
| `input[appInput]` / `textarea[appInput]` | directiva sobre el control nativo, no un componente que lo envuelve            |
| `app-field`                              | `label for` + `aria-describedby` + `role="alert"` resueltos solos              |

**Cómo se resolvió la accesibilidad:** `app-field` se provee a sí mismo como contexto
(`InjectionToken FIELD`) y el control inyecta ese contexto para recibir su `id`, su
`aria-describedby` y su `aria-invalid`. Quien escribe el formulario **no repite
identificadores**: no puede equivocarse.

**Verificado visualmente.** La captura delató dos defectos que el código no mostraba:
botones de 36px incumpliendo el mínimo de área táctil de 40px del propio sistema, y
**emojis usados como iconos** (el 🗑 salía a color y rompía la regla de que el color
significa algo). Ambos corregidos: `--control-height` a 40px e iconos SVG de trazo 1.5px
con `currentColor`.

16 tests en total. `verify` verde, árbol limpio.

---

## ✅ Fase 1 · S1.4 — Superficies

Seis piezas nuevas en `shared/ui`, todas con test: `app-card` (con la lengüeta de turno
**dentro** del componente), `app-badge` (5 tonos), `app-avatar` (iniciales, sin anillo
arcoíris), `app-divider`, `app-skeleton`, `app-empty-state`.

Dos decisiones que vale la pena recordar:

- **La lengüeta no se puede olvidar** porque es parte de `app-card`. Y el color siempre
  viaja con el nombre de la persona en `.visualmente-oculto`: ningún dato se transmite
  solo por color.
- **El esqueleto se oculta a los lectores de pantalla** (`aria-hidden`). Quien anuncia la
  carga es el contenedor con `aria-busy`, no el adorno gris.

32 tests en total. `verify` verde, árbol limpio.

---

## ✅ Fase 1 · S1.5 — Overlays

`@angular/cdk` 22.2.3 instalado. Cuatro piezas nuevas:

| Pieza                                  | Qué aporta                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `DialogService` + `app-dialog-content` | Overlay del CDK sobre un `ng-template`: trampa de foco, `Esc` y devolución del foco resueltas |
| `app-menu` + `app-menu-item`           | Panel y acciones con navegación por teclado del CDK                                           |
| `appTooltip`                           | Directiva que funciona con ratón **y con teclado**, vía `aria-describedby`                    |
| `ToastService` + `app-toast-container` | Avisos efímeros con `role="status"` y `aria-live="polite"`                                    |

**Tests que valen la pena:** el diálogo se abre con nombre accesible, se cierra desde su
botón y **el foco vuelve exactamente al botón que lo abrió**. El servicio de avisos cierra
solo, y al cerrar a mano no deja temporizadores huérfanos.

**No usamos `<dialog>` nativo.** jsdom no implementa `showModal()`, así que los tests no
podrían verificar nada. Con CDK, la trampa de foco es código que se puede probar.

44 tests en total. `verify` verde.

---

## ✅ Fase 1 · S1.6 — Revisión de craft (Fase 1 cerrada)

Los cuatro chequeos de `interface-design` pasados sobre capturas reales: escritorio,
móvil a 390 px y una captura con `blur(6px)` para el **squint test de verdad**, no de
palabra.

**Tres defectos encontrados y corregidos:**

1. **`viruta-50` era invisible en su propia ficha** (la ficha usaba `surface-raised`, que
   _es_ `viruta-50`). Añadido un rayado diagonal de 1px sobre la muestra.
2. **Contraste 2.74:1** en "sin asignar" y en los placeholders, por usar `text-disabled`,
   que es para controles deshabilitados. Pasaron a `text-muted` (6.48:1).
3. **Ritmo plano**: diez secciones idénticas. Añadidos dos cortes de grupo,
   _Fundamentos_ y _Componentes_.

Contrastes **medidos** con un script, no estimados: todos ≥ 4.5:1 salvo los deshabilitados
deliberados. 44 tests, `verify` verde.

---

## ✅ Fase 2 · S2.1 — Entidad `board`

Primer slice de negocio, con la anatomía completa del plan:

```
entities/board/
├── index.ts                 # API pública: solo se puede importar esto desde fuera
├── model/board.model.ts     # tipo, id marcado, columnas por defecto, crearBoard()
├── model/board.store.ts     # signals: estado, activos, cuantosActivos
├── model/board.store.spec.ts
└── api/board.repository.ts  # persistencia en localStorage
```

Decisiones que importan:

- **El id lleva marca de tipo** (`BoardId = string & { [marca]: true }`). El compilador no
  deja pasar el id de una tarjeta donde va el de un tablero.
- **La regla de negocio vive en el modelo**, no en el store: `crearBoard()` lanza si el
  título está vacío, así que ningún camino puede construir un tablero inválido.
- **Un solo punto de escritura** en el store: `actualizar()` persiste y publica. Es
  imposible guardar en un sitio y olvidar el otro.
- **La persistencia es tolerante**: JSON corrupto, entradas sin forma de tablero o un
  entorno sin `localStorage` no rompen la app; se arranca vacío.

**Verificado que la frontera muerde:** importar `@entities/board/model/board.model` desde
`features/` falla con `entities-through-public-api`. Solo se entra por `index.ts`.

9 tests nuevos (53 en total). `verify` verde.

---

## ✅ Fase 2 · S2.2 — Entidad `task`

Slice completo con la operación que define el producto: **mover**.

```
entities/task/
├── index.ts
├── model/task.model.ts      # Task, TaskId marcado, crearTask, porPosicion, renumerar
├── model/task.store.ts      # crear, mover, editar, eliminar, deColumna
├── model/task.store.spec.ts
└── api/task.repository.ts
```

**Cómo funciona el orden manual.** Cada tarjeta guarda `columnaId` + `posicion` entera.
Mover no es cambiar un campo: es sacar la tarjeta, insertarla en el índice pedido,
renumerar de 0 a n-1 **la columna de destino y la de origen**. Renumerar solo el destino
deja huecos en el origen y el siguiente movimiento se vuelve impredecible.

**Decisiones:**

- **Índice recortado, no rechazado.** Pedir la posición 99 en una columna de 3 la deja al
  final. Un arrastre nunca debe fallar por un índice fuera de rango.
- **Computeds cacheados por columna.** `deColumna()` devuelve un `computed` memoizado en un
  `Map`; crear uno nuevo en cada llamada multiplicaría las suscripciones sin avisar.
- **La persistencia se extrajo a `shared/lib/almacenamiento.ts`** (`leerLista`/`escribirLista`)
  para no duplicar el manejo de JSON corrupto entre los dos repositorios.

12 tests nuevos (65 en total). Cubren: crear al final, mover entre columnas, renumerar el
origen, recortar índices, reordenar dentro de la misma columna, subir a primera, editar
sin pisar otros campos, eliminar renumerando, e id inexistente.

---

## ✅ Fase 2 · S2.3 — Entidad `member`, sesión y permisos

```
entities/member/
├── index.ts
├── model/member.model.ts   # Member, Rol, Accion, MIEMBROS_DEMO, puede(), etiquetaRol()
├── model/member.store.ts   # miembros, sesión, rol, puedeEditar, puedeAdministrar
└── model/member.store.spec.ts
```

**La decisión que define el sprint:** los permisos viven en el dominio, en una función
pura `puede(rol, accion)`. El componente solo la consulta. Si mañana alguien esconde un
botón pero olvida comprobar la acción, **el dominio sigue negando** — la interfaz no es
la puerta, es el cartel.

**Tres detalles que importan:**

- **`switch` exhaustivo con `never`.** Si se añade un rol y no se actualiza la tabla, el
  compilador lo delata. La seguridad no depende de que alguien recuerde.
- **La sesión se guarda** y se recupera al recargar; si apunta a alguien que ya no existe,
  cae a la primera persona en lugar de romperse.
- **Un test comprueba la coherencia entre store y plantilla**: el mismo `puedeEditar()`
  pinta el botón y lo esconde al cambiar a una persona observadora.

**Desviación consciente del spec:** el rol es global a la persona, cuando el spec pide un
rol **por tablero**. Se migrará en S3.6, cuando existan las invitaciones. Está anotado en
el propio modelo.

11 tests nuevos (76 en total). `verify` verde.

---

## ✅ Fase 2 · S2.4 — Datos, estados de carga y primera pantalla (Fase 2 cerrada)

**Estados de carga reales**, no decorativos: los repositorios son `async` con latencia
simulada de 350 ms (token `LATENCIA_SIMULADA`, sobrescrito a 0 en los tests vía
`src/test-providers.ts`). Los stores exponen `carga`, `cargando`, `conFallo`, `error` y
una promesa `listo` que los tests esperan.

**Primera pantalla real** (`/`): lista de tableros con cuatro estados —

| Estado    | Qué se ve                                          |
| --------- | -------------------------------------------------- |
| Cargando  | Tres esqueletos con `aria-busy` y `aria-live`      |
| Vacío     | `app-empty-state` con la acción de crear           |
| Error     | Mensaje en `role="alert"` con botón de reintentar  |
| Con datos | Una tarjeta por tablero, con su número de columnas |

Crear un tablero desde la pantalla lo persiste y muestra un aviso. Es la primera
rebanada vertical completa: store → estados → design system.

**Lección cara:** dos capturas seguidas mostraron código viejo. La causa no era CSS ni
Angular: un `ng serve` zombi seguía escuchando en el puerto 4200 y `reuseExistingServer`
lo reutilizaba. Perdí una hora persiguiendo un bug de estilos que no existía. Arreglado
con `reuseExistingServer: false` en `playwright.config.ts`: siempre servidor nuevo.

83 tests en total. `verify` verde.

---

## Sprint actual — Fase 3

## ✅ Fase 3 · S3.1 — Entrada, guard de sesión y permisos en la interfaz

**Pantalla `/entrar`**: se elige persona de las tres del equipo, con su rol a la vista.
La sesión se guarda y no se vuelve a preguntar.

**`sesionGuard`** protege la raíz. Para que sirviera de algo hubo que añadir una
distinción que antes no existía: `MemberStore.haySesion`, que es `true` **solo** si
alguien eligió persona. Sin eso, el store siempre cae en la primera y el guard sería
decoración.

**Los permisos, en tres capas** (y las tres se prueban):

1. La interfaz esconde el botón (`@if (puedeEditar())`).
2. El método comprueba el permiso y avisa: si alguien lo invoca desde la consola, no pasa.
3. El dominio (`puede(rol, accion)`) sigue negando por debajo.

**Verificado en navegador, no solo en tests:** `goto('/')` redirige a `/entrar`; entrar
como Alba (solo lectura) y contar botones de crear en la página da **0**.

90 tests en total. `verify` verde.

---

## ✅ Fase 3 · S3.2 — Lista de tableros

La home pasa a llamarse `board-list` (página, ruta y archivos) y el tablero deja de
inventarse el nombre: se pide en un diálogo.

- **Crear con nombre real.** `DialogService` + `app-field`/`appInput`: un nombre vacío o
  lleno de espacios no crea nada y lo explica bajo el campo. Al crear, el diálogo se cierra
  solo; `Cancelar` y `Esc` no dejan estado a medias.
- **Dos rutas lazy nuevas**, con el chunk verificado en el build: `board-list` (8.5 kB
  crudos / 2.8 kB transferidos) y `board-detail` (2.7 kB / 1.1 kB).
- **La tarjeta entera es el enlace** al detalle (`a` + `routerLink`, no un `div` con
  `click`): teclado, foco y semántica gratis. El filete sube de tono al pasar el ratón y al
  enfocar, aprovechando la transición que `app-card` ya traía.
- **`board-detail` es solo la puerta**, no el lienzo: identifica el tablero por `:id`
  (con `withComponentInputBinding()`), avisa si no existe y lista sus columnas. Las
  tarjetas y el arrastre llegan en S3.3 y S3.4.

**Dos defectos que aparecieron por el camino:**

1. **El build llevaba roto desde el renombrado a medias.** `app.routes.ts` seguía
   apuntando a `@pages/home/home` y `board-list.ts` a `./home.html`: el sprint había
   empezado por el renombrado y se quedó ahí, con el árbol en rojo. Se terminó entero
   antes de seguir.
2. **El smoke E2E estaba rojo desde S3.1.** El guard redirige `/` a `/entrar`, pero la
   prueba seguía esperando el `h1` de TaskFlow. Ahora recorre el flujo real: sin sesión →
   `/entrar`, elegir persona → lista, crear un tablero por diálogo → verlo en la lista →
   abrir su detalle.

97 tests (7 nuevos) y `npm run e2e` verde. Verificado con capturas: escritorio, móvil a
390 px, hover y foco por teclado.

---

## ✅ Fase 3 · S3.3 — Lienzo del tablero

Llega el primer **widget**: `widgets/board-canvas`. Es la capa que faltaba por estrenar
del §3.1, y se estrena en el sitio previsto: la página `board-detail` solo resuelve la
ruta y compone; el trabajo de pintar columnas y tarjetas vive en el widget.

- **Columnas de ancho fijo** (`--column-width` 288px) con desplazamiento horizontal, y
  **cada columna se desplaza por su cuenta** (`--column-max-height`, token nuevo): mover
  una no mueve las demás, que es el escenario 3 de la historia 1.
- **La estructura se pinta antes que los datos.** Las columnas y sus rótulos aparecen ya
  durante la carga; lo que llega tarde son las tarjetas, con esqueletos con forma de
  tarjeta dentro de cada columna.
- **Accesibilidad:** cada columna es una `region` con su nombre (`aria-labelledby` sobre
  el `h2`), y el recuento lleva el texto «tarjetas» oculto para quien no ve la pantalla.
  El color del turno nunca va solo: acompaña al nombre.
- **La tarjeta:** lengüeta de turno (la firma, ahora con el color de cada persona),
  título, descripción recortada a dos líneas y, si la tiene, quien la tiene con su avatar.
- **Vacío de verdad:** «Sin tarjetas» en cada columna y una sola línea de tablero entero
  sin trabajo.

**El defecto que salió en la captura:** los esqueletos sueltos desaparecían sobre la
superficie hundida de la columna (`viruta-200`). Ahora cada hueco lleva el mismo fondo
elevado que la tarjeta que va a sustituir, y el estado de carga se ve de un vistazo.

105 tests (8 nuevos) y `npm run e2e` verde. Capturas: lienzo con tarjetas, carga,
tablero vacío y móvil a 390 px.

**Pendiente consciente:** la historia 1 pide explicar _cómo añadir la primera tarjeta_;
eso llega en S3.5, cuando exista la acción de crear.

---

## Sprint actual

**S3.4 — Mover tarjetas con el ratón y con el teclado**

| Tarea                                  | Estado |
| -------------------------------------- | ------ |
| Arrastrar con `@angular/cdk/drag-drop` | ⬜     |
| Reordenar dentro de la misma columna   | ⬜     |
| Alternativa por teclado para mover     | ⬜     |
| El movimiento sobrevive a la recarga   | ⬜     |
| Tests de mover                         | ⬜     |

**Criterio de verde:** mover una tarjeta cambia de columna, se guarda y se puede repetir
sin ratón. `verify` verde.

---

## Dónde me quedé

S3.3 terminado en `feature/S3.3-lienzo`: el lienzo con columnas y tarjetas. 105 tests,
`verify` y `e2e` verdes.

## Siguiente paso concreto

Construir el arrastre de tarjetas entre columnas con `@angular/cdk/drag-drop` y su
alternativa por teclado (el `TaskStore.mover()` ya renombra las dos columnas).

---

## ⚠️ Nota de entorno

El proyecto **no puede compilar, testear ni commitear en modo confinado**: esbuild
lanza un proceso hijo con tuberías y el sandbox lo corta (`spawn EPERM`). Los git
hooks tienen el mismo problema. **Trabaja en acceso total.**

Descartado: **pnpm** (su caché global no se puede redirigir; se usa npm con caché
local en `.npm-cache/`).

`npm run verify` no incluye E2E a propósito: es el chequeo rápido de cada commit.
Los E2E corren en CI y antes de un merge a `main`.

---

## Bitácora

| Fecha      | Sprint | Nota                                                               |
| ---------- | ------ | ------------------------------------------------------------------ |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado.      |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + husky/commitlint/eslint.              |
| 2026-10-17 | S0.2   | Esqueleto FSD, alias, boundaries ejecutables.                      |
| 2026-10-17 | S0.3   | Spec Kit + constitución v1.0.0 + spec 001 aprobada.                |
| 2026-10-17 | S0.4   | Playwright + smoke test + CI. Fase 0 cerrada.                      |
| 2026-10-17 | S1.1   | Dirección **A · Taller** + lengüeta de turno. system.md guardado.  |
| 2026-10-18 | S3.2   | Lista de tableros, diálogo de creación y ruta al detalle.          |
| 2026-10-19 | S3.3   | Lienzo del tablero: widget `board-canvas` con columnas y tarjetas. |
