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
| `app-menu` + `button[appMenuItem]`     | Panel y acciones con navegación por teclado del CDK                                           |
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

## Fase 3 — Features

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

## ✅ Fase 3 · S3.4 — Mover tarjetas

Mover una tarjeta tiene **dos caminos y una sola operación de dominio**. El arrastre del
CDK y el menú «mover a…» de cada tarjeta llaman al mismo `TaskStore.mover()`: lo que se
prueba en el store vale para los dos, y las dos columnas se renumeran igual.

- **Arrastrar:** `cdkDropListGroup` sobre el lienzo y un `cdkDropList` por columna, con el
  id de la columna como dato. Al soltar se pide el índice al CDK y decide el store, que es
  quien sabe recortar índices y renumerar origen y destino. Reordenar dentro de la misma
  columna es el mismo camino con otro índice.
- **Sin ratón:** el arrastre no existe para el teclado, así que cada tarjeta lleva un menú
  con las columnas (todas menos la suya). Es visible, se descubre solo y el aviso que
  aparece al mover es lo que oye quien no ve la pantalla.
- **Quien solo observa** no ve el menú y no puede arrastrar: el CDK queda desactivado, no
  solo escondido. El método lo vuelve a comprobar, como al crear un tablero.
- **La vista previa del arrastre** flota con la sombra de overlay, la única que el sistema
  permite. Su sombra vive en `overlays.css` porque el CDK la saca del componente.

**El defecto que salió al probarlo en un navegador de verdad:** pulsar una opción de
cualquier menú **no ejecutaba nada**. El CDK cierra el menú al pulsar, y cerrarlo destruye
la vista del overlay: una escucha `(click)` puesta _por encima_ del botón se va con esa
vista antes de que el clic termine de propagarse. La acción no corría y no avisaba de nada.
Afectaba también a «cambiar de persona» y «Salir» de la lista de tableros, que nunca
hicieron nada. Arreglado en el sistema: `app-menu-item` pasa a ser `button[appMenuItem]`,
un componente sobre el `<button>` nativo, igual que `appButton` y `appIconButton`.
`menu.spec.ts` vigila que no vuelva.

Dos cosas más que salieron al mirar de cerca: el recuento decía «1 tarjetas», y «Salir»
cerraba la sesión pero dejaba dentro (ahora navega a `/entrar`).

114 tests y `npm run e2e` verde, con un recorrido nuevo que arrastra con ratón de verdad:
el CDK mide píxeles y eso en jsdom no se puede probar. Capturas: menú de mover, arrastre en
curso, tablero tras mover y móvil a 390 px.

---

> **Nota de proceso (S3.4).** El commit `feat` de S3.4 se llevó dentro
> `docs/PROGRESS.md`: lint-staged volvió a añadirlo al preparar el commit, así que no
> hubo un commit `docs(progress)` separado. El contenido está; el historial de ese sprint
> no es tan limpio como el de los anteriores. Desde S3.5 este archivo se actualiza y se
> commitea **en la rama**, antes de fusionar.

---

## ✅ Fase 3 · S3.5 — Crear y editar tarjetas con Signal Forms

Primera pieza de `features/`: `task-form`. **Una sola pieza crea y edita**, porque dos
formularios acaban validando distinto.

- **Signal Forms de verdad.** El modelo es una señal; el esquema declara `required`,
  `maxLength` y una regla propia; `[formField]` ata cada control y `[formRoot]` envía. El
  mensaje sale del estado del campo (`touched` + `errors`), no de una variable paralela.
  `submit()` marca tocado al intentar guardar: el error aparece entonces, no mientras
  alguien escribe por primera vez.
- **Dos reglas para el mismo «no».** `required` no frena un título hecho de espacios; la
  segunda regla mira el texto recortado. El formulario y `crearTask()` rechazan por el
  mismo motivo, así que el mensaje no promete algo que el dominio no cumpla.
- **El formulario no conoce el store.** Emite `DatosTarjeta` ya recortado (`responsable:
null` si no hay) y el widget decide si crea o edita. La validación no se duplica.
- **Crear desde la columna.** «Añadir tarjeta» al pie de cada columna, visible solo con
  permiso y con el nombre de la columna en el título del diálogo. El tablero vacío ahora
  explica **cómo** añadir la primera: el pendiente de S3.3 queda cerrado.
- **Editar desde la tarjeta.** El menú de cada tarjeta pasa a llamarse «Acciones de…» y
  ofrece «Editar tarjeta» antes de las columnas de destino. Sigue habiendo un solo icono
  por tarjeta.
- **Responsable (FR-011).** Desplegable con las tres personas y «Sin asignar»; `appInput`
  aprende a vestir `select` para no dejar un control del navegador a medio vestir.

**Tres defectos que salieron al mirar (no los veían los tests):**

1. **La flecha de mover nunca fue una flecha.** Al SVG del botón le faltaba la regla de
   `stroke`, así que el navegador rellenaba el path y pintaba dos triángulos sueltos, sin
   la línea del medio. La regla de trazo vive ahora en el widget.
2. **El diálogo tocaba los bordes en móvil.** 480 px fijos se recortaban a 390 sin
   margen; ahora es `min(480px, 100vw - 2 × espacio-4)`.
3. **`maxlength` a mano no compila.** NG8022 rechaza atributos que el esquema ya
   gestiona: la longitud se declara una vez y la directiva la lleva al control.

**Verificado con capturas:** diálogo de creación relleno, error de validación, menú de la
tarjeta, lienzo con los botones de añadir y móvil a 390 px con el diálogo abierto.

**E2E nuevo:** crear la primera tarjeta por la interfaz, recargar, editar desde el menú y
recargar otra vez. También comprueba que sin título no se guarda y el diálogo no se cierra.

128 tests (14 nuevos) y `npm run e2e` verde (7, tres nuevos).

---

## ✅ Fase 3 · S3.5b — Renombrar el tablero

Salió al usarlo, no de un test: no había forma de cambiar el nombre de un tablero. El
store sabía hacerlo desde S2.1 (`renombrar()`, con test), pero **nunca se le puso puerta**:
la lista solo tenía «Nuevo tablero» y el detalle solo enseñaba el `h1`. El spec tampoco lo
pedía —FR-003 es crear—, así que no era un fallo de S3.5: era un hueco entre el dominio y
las pantallas, y quedó cerrado aquí.

- **Renombrar desde el detalle**, junto al título, con `puedeEditar()` y la comprobación
  repetida en el método. El diálogo abre con el nombre actual **seleccionado**: escribir
  sustituye en vez de obligar a borrar.
- **Una sola validación del nombre.** El formulario de tablero pasa a `features/board-form`
  con Signal Forms y lo usan crear y renombrar. Antes la creación validaba a mano dentro
  de la página; ahora hay una regla y dos puertas.
- **El foco entra por el campo, no por la X.** El botón de cerrar iba antes que el
  contenido en el DOM, así que `first-tabbable` lo enfocaba a él. Pasa al final del DOM y
  se coloca con posición absoluta: quien abre un diálogo empieza en el primer control, y
  el recorrido de teclado empieza por el dato.

139 tests (11 nuevos) y 10 E2E (3 nuevos: renombrar y recargar, nombre vacío y rol de solo
lectura).

**Anotado en IDEAS:** archivar tableros. `archivar()` existe igual que `renombrar()` y
tampoco tiene interfaz; para exponerlo hace falta una vista de archivados, o el tablero
desaparece sin vuelta.

---

## ✅ Fase 3 · S3.6 — Filtros y búsqueda con el estado en la URL

El tablero ya se puede mirar por partes: texto libre (título y descripción, sin acentos) y
persona responsable. **El filtro no vive en la pantalla: vive en la URL.**

- **`linkedSignal` es exactamente la pieza.** El filtro se deriva de `?q=` y `?persona=`
  —los query params llegan como inputs por `withComponentInputBinding()`— y además se
  puede escribir desde la barra. Un `computed` no dejaría teclear; un `signal` normal
  dejaría de obedecer a la URL al recargar o al compartir el enlace.
- **La URL se escribe con `replaceUrl`.** Sin él, cada tecla sería un paso de historial;
  con él, atrás vuelve a la pantalla anterior y el enlace se puede compartir.
- **La barra es un componente controlado** (`features/board-filters`): recibe el filtro y
  emite el siguiente, sin saber de rutas. La página es la única que escribe en la URL.
- **El lienzo filtra con un solo `computed`** para todas las columnas, no dentro de la
  plantilla: recorrer 200 tarjetas en cada detección de cambios se nota. La búsqueda
  normaliza (minúsculas y sin acentos) en los dos lados, así «revision» encuentra
  «Revisión».
- **Los estados no mienten:** con filtro se anuncia «1 de 4 tarjetas» en `role="status"`;
  si nada coincide se dice eso y no «este tablero no tiene tarjetas»; y un tablero vacío
  sigue explicando cómo empezar aunque haya filtro.
- **Con filtro puesto no se arrastra.** El CDK devuelve el índice de la lista **visible** y
  la columna real tiene huecos escondidos: soltar ahí mentiría sobre el orden. El menú
  «mover a…» sigue disponible porque no depende del índice.

**Dos cosas que salieron al montarlo:**

1. **`undefined` en los query params.** El router pone `undefined` en los inputs que la URL
   no trae; el filtro arrancaba con `undefined` y el lienzo intentaba recortar un texto que
   no existía. La página se quedaba sin columnas y sin etiquetas. Se arregla en el origen:
   `?? ''`.
2. **La X azul del buscador.** Chromium pinta su propio botón de limpiar en los
   `input[type=search]`, en un azul que no es un token. Se oculta: el filtro ya tiene
   «Quitar filtro» al lado, que sí es un control del sistema.

156 tests (17 nuevos) y 15 E2E (5 nuevos). Capturas: barra en reposo, filtro activo, sin
resultados y móvil a 390 px.

---

## ✅ Fase 3 · S3.7 — Invitaciones y rol por tablero

La historia 4 del spec, la única que seguía sin implementación. El rol deja de ser
global y pasa a vivir en el tablero: la misma persona puede administrar uno y solo
mirar otro.

- **`Board.miembros`** es la lista de personas con acceso y su rol. Quien crea un
  tablero entra como administrador; nadie más entra hasta que lo inviten.
- **La migración no deja a nadie fuera.** Los tableros guardados antes de S3.7 no
  tienen `miembros`; al cargarlos se les asignan los roles que tenía la demo (Marta
  administra, Iván edita, Alba observa) y se reescribe el almacén una sola vez.
- **Tres capas de permiso, ahora por tablero.** `puedeEn(board, persona, acción)`
  combina la matriz de roles con la pertenencia. La lista de tableros solo muestra
  los accesos; una URL directa a un tablero ajeno da «No tienes acceso», no un error
  técnico. El lienzo, renombrar y el panel de personas preguntan al tablero concreto.
- **`features/board-members`.** Cualquier persona con acceso ve quién está y con qué
  rol; solo quien administra ve el formulario de invitación y los selectores de rol.
  El dominio vuelve a comprobar la administración y protege el último administrador.
- **Crear ya no es un permiso global.** Cualquier persona puede crear su tablero y
  administrarlo; el rol se demuestra dentro de cada tablero.

**Tres defectos que salieron al mirar la captura:** el `<select>` de rol mostraba
siempre la primera opción (Administración) porque el `[value]` se aplicaba antes de
que existieran las opciones; ahora cada `<option>` lleva su `[selected]`. La fila
repetía el rol en un subtítulo y en el control; se quedó solo el control. Y el
diálogo pedía 560 px cuando el sistema lo limita a 480: se dejó el ancho del sistema.

179 tests (23 nuevos) y 18 E2E (3 nuevos: invitar, acceso denegado y observador sin
formulario). `verify` verde. Capturas: panel de personas, lista con tu rol, detalle de
observadora y móvil a 390 px.

---

## ✅ Fase 4 · S4.1 — Los cuatro journeys E2E

La suite deja de ser una colección de pruebas por feature y pasa a tener un archivo por
journey del PLAN. Los recorridos que siembran su tablero lo siguen haciendo; el journey 1
empieza sin sesión.

- **`journey-1-tablero`**: entrar → crear tablero → abrir → crear la primera tarjeta →
  recargar. Sustituye al smoke de S0.4, que ya no aportaba nada distinto.
- **`journey-2-mover`**: ratón, menú y teclado. La prueba de teclado abre el menú de
  acciones con Enter, comprueba que el foco entra en «Editar tarjeta», baja a «Mover a
  En curso» y confirma; después recarga.
- **`journey-3-filtrar`** y **`journey-4-invitar`**: los recorridos ya existentes, con sus
  bordes (persona, sin acentos, acceso denegado, observadora).

**El teclado no funcionaba de verdad.** El menú se abría y el ratón elegía opciones, pero
las flechas no entraban en ellas: `app-menu` envolvía el `cdkMenu` en un `<div>` interno y
el CDK buscaba sus opciones entre el contenido de ese `div`, donde solo veía el
`<ng-content>`. El foco se quedaba en el disparador. `CdkMenu` pasa al anfitrión con
`hostDirectives`: ahora el CDK ve los botones proyectados, el foco entra en el primero y
las flechas recorren el menú. La prueba unitaria del menú comprueba ese foco.

**Verificado:** 179 tests unitarios, 19 E2E (`npm run e2e` verde) y `npm run verify`
verde. `crear.spec.ts` y `renombrar.spec.ts` se quedan como regresión de formularios y
nombre: no son journeys, pero cubren escenarios de aceptación que ya estaban y no cuestan
una espera perceptible.

---

## ✅ Fase 4 · S4.2 — Auditoría de accesibilidad

`e2e/a11y.spec.ts` tiene nueve pruebas que pasan axe con sus reglas por defecto, no solo
con las etiquetas WCAG. Cubren entrar, la lista vacía y la lista con tableros, el menú de
sesión, el diálogo de creación, el detalle, los diálogos de renombrar, personas, editar y
nueva tarjeta, el menú de tarjeta, el aviso de movimiento, la vista de observadora, el
acceso denegado, el tablero inexistente y el detalle a 390 px. Cada estado termina en
`expect(violations).toEqual([])`; el mensaje de fallo lleva la regla, el impacto y el nodo.
No se excluye ninguna regla.

La novena prueba recorre la aplicación **sin ratón**: Tab y Enter para entrar, abrir el
tablero, renombrar, abrir Personas y el menú de una tarjeta; Escape para volver. En cada
parada se comprueba que `:focus-visible` deja un contorno sólido y que el foco regresa al
disparador.

**Lo que encontró axe y se corrigió en producto:**

- Las iniciales del turno `cinta` estaban a 2,87:1. Es el único turno claro, así que usan
  la tinta principal (5,33:1) en vez de la tinta de papel.
- El contenedor de overlays del CDK quedaba fuera de todo landmark. `OverlayContainerAccesible`
  le pone `role="region"` y un nombre; los roles propios de diálogo y menú no cambian.
- El encabezado de los diálogos era `<header>` y, dentro de la nueva región, axe lo leía
  como un `banner` anidado. Pasa a ser un `<div>`: el nombre accesible lo sigue dando el
  `h2`.
- `EmptyState` tenía un `h3` fijo: en la lista vacía saltaba de `h1` a `h3` y en el acceso
  denegado no había `h1`. El nivel ahora es un input (2 por defecto); el acceso denegado
  usa `h1` y el tablero inexistente también.

**Verificado:** 180 tests unitarios, 28 E2E (`npm run e2e` verde) y `npm run verify`
verde.

---

## ✅ Fase 4 · S4.3 — Rendimiento y presupuesto

El bundle inicial baja de **414,48 kB a 330,94 kB** (-20 %) y de 104,48 a 88,46 kB de
transferencia estimada. La causa principal era el barril `@shared/ui`: `App` importaba
`ToastContainer` desde el índice y eso arrastraba todos los componentes compartidos y el
CDK de overlays al bundle inicial. El shell ahora importa `@shared/ui/toast` directamente.

- El contenedor de avisos se carga con `@defer (on idle)`: no es crítico y el servicio
  conserva en cola lo que llegue antes de que el bloque esté listo.
- Se retira `provideHttpClient()`: no había ninguna petición HTTP; los repositorios usan
  almacenamiento local.
- El presupuesto inicial queda en **350 kB de aviso y 370 kB de error** en `angular.json`.
- La aplicación sigue sin `zone.js`: Angular 22 es zoneless por defecto y no hay
  `polyfills` que lo reintroduzcan. `e2e/performance.spec.ts` comprueba en el navegador
  que `window.Zone` no existe.
- Revisión de detección de cambios: Angular 22 usa `OnPush` por defecto; no hay
  `ChangeDetectionStrategy.Default` ni componentes fuera de ese modo. Los componentes ya
  trabajan con signals, así que no hace falta añadir decoradores redundantes.

**Verificado:** 180 tests unitarios, 29 E2E (`npm run e2e` verde) y `npm run verify`
verde. El build no emite avisos de presupuesto.

---

## ✅ Fase 4 · S4.4 — Pulido visual

Segunda pasada sobre las pantallas reales con `design-deslop` + `design-review`. No se
rediseñó la dirección **A · Taller**: se corrigieron defectos concretos de interacción,
contraste y desbordamiento.

- **Avisos por encima del diálogo.** El CDK 22 monta sus overlays en la capa superior
  (Popover API), donde `z-index` deja de ordenar. `OVERLAY_DEFAULT_CONFIG` desactiva
  `usePopover`; el aviso usa `--z-toast: 1100` sobre el contenedor del CDK (1000).
- **El aviso también existe para lectores de pantalla.** Vive como hijo directo de
  `body`, con `role="status"` y `aria-live="polite"`. Así el diálogo no lo oculta del
  árbol de accesibilidad, y su `z-index` puede quedar por encima.
- **El primer aviso no espera al ocio.** `@defer (on idle; when hayAvisos())` adelanta la
  carga del contenedor si ya hay un aviso en cola; el mensaje no caduca antes de verse.
- **La X de los avisos se lee.** Sobre acento y peligro hereda
  `--text-on-accent`/`--text-on-danger`; antes usaba `text-secondary` (~1.02:1).
- **El scroll del lienzo no mueve la página.** `contain: paint` en `.columnas` encierra
  el desbordamiento horizontal del grid. En móvil, `document.scrollWidth` pasa de 907 a
  390 px y el encabezado deja de moverse con el gesto; el scroll interno sigue disponible.
- **Navegación táctil.** «← Todos los tableros» pasa a 40×118 px, con hover; las tarjetas
  de la pantalla de entrada responden con filete y tono.
- **Añadir es una acción.** «Añadir tarjeta» lleva un `+` de trazo (`aria-hidden`) para
  separar la acción del contenido de las tarjetas.

**Verificado:** 180 tests unitarios, 29 E2E (`npm run e2e` verde) y `npm run verify`
verde. Bundle inicial **331,96 kB** (88,94 kB de transferencia estimada).

---

## ✅ Fase 4 · S4.4.1 — Hundido de superficies

Ajuste posterior a la prueba manual de S4.4. Se añadió la clase global `.presionable`
para las superficies que se pueden pulsar:

- La tarjeta de la pantalla de entrada y el enlace de cada tablero bajan **1 px** al
  pulsar. El fondo de la tarjeta de entrada pasa a `surface-sunken` sin transición, para
  que el clic rápido también se sienta.
- `prefers-reduced-motion` anula el desplazamiento y mantiene el cambio de tono.
- El cursor que aparecía dentro de «Cancelar» era el **modo de navegación del navegador
  (F7)**, no un defecto de la app: los botones son `<button>` nativos y el foco se mueve
  con `Tab`. No se añadió `user-select: none` ni se alteró la selección de texto.
- `e2e/presion.spec.ts` comprueba el `transform` calculado al pulsar y su anulación con
  movimiento reducido. La auditoría axe espera a que termine la animación del aviso para
  no medir un fotograma intermedio.

**Verificado:** 180 tests unitarios, 31 E2E (`npm run e2e` verde) y `npm run verify`
verde. Bundle inicial **332,20 kB** (89,02 kB de transferencia estimada).

---

## ✅ Fase 4.5 · S4.5 — Reconciliación del plan

Se alineó la documentación con lo que realmente se construyó antes de añadir el
laboratorio de Angular 22:

- `PLAN.md` pasa a `npm`, corrige S2.4, añade S4.4.1 y S4.5/S4.6, y reordena la Fase 5
  para publicar el 1.0 antes de SSR y WebMCP.
- El mapa de cobertura deja de prometer `@Service`, `injectAsync` y `httpResource` como
  hechos: se cubren en S4.6, en un laboratorio aislado.
- `entities/README.md` ya no habla de `board.api.ts`: el slice usa
  `board.repository.ts` sobre `localStorage`.
- Quedan registradas las desviaciones conscientes: sin backend, archivar solo en
  dominio y Spec 001 sin `plan.md`/`tasks.md` retroactivos.
- Decisiones cerradas: carpeta `taskFlow`, app en la raíz y remoto
  `https://github.com/melocotron/taskFlow.git`.

**Verificado:** 180 tests unitarios, 31 E2E y `npm run verify` verde. Sin cambios de
código; el bundle inicial sigue en **332,20 kB**.

---

## ✅ Fase 4.5 · S4.6 — Laboratorio Angular 22

Se cubrieron las tres APIs que el mapa de cobertura daba por hechas:

- **`@Service()`**: `ToastService` pasa del decorador clásico al nuevo; sigue siendo
  singleton y sus tests no cambian.
- **`injectAsync()`**: un servicio de laboratorio se carga con `import()` solo al pulsar
  un botón de `/kitchen-sink`; no entra en el camino crítico.
- **`httpResource` + interceptor**: una petición a `/api/laboratorio` se resuelve en
  memoria, con retardo para que se vea el estado de carga. No hay backend ni se toca la
  persistencia del producto.
- **Aislamiento de producción**: `angular.json` sustituye la ruta lazy del kitchen-sink
  por una redirección. Así `HttpClient` y el laboratorio no entran en el bundle inicial.
- `e2e/laboratorio.spec.ts` cubre ruta lazy, provider, interceptor, `httpResource` e
  `injectAsync` en un solo recorrido.

**Verificado:** 180 tests unitarios, **32 E2E** (`npm run e2e` verde) y `npm run verify`
verde. Bundle inicial **333,88 kB** (87,35 kB de transferencia estimada); sigue dentro
del presupuesto 350/370 kB.

---

## ✅ Fase 5 · S5.1 — Entrega 1.0

TaskFlow ya tiene repositorio remoto y una release publicada:

- `main` y `develop` están en GitHub:
  `https://github.com/melocotron/taskFlow`.
- CI verde en ambas ramas, con los jobs de calidad y E2E.
- Se sincronizó el lockfile con `@types/node` para que `npm ci` funcione en un
  entorno limpio; el fallo inicial de CI fue exactamente ese.
- `release/1.0.0` sube la versión, añade `CHANGELOG.md` y actualiza el README.
- Tag `v1.0.0` y GitHub Release:
  `https://github.com/melocotron/taskFlow/releases/tag/v1.0.0`.
- `develop` recibió el back-merge de la release.

**Verificado:** 180 tests unitarios, 32 E2E, `npm run verify` verde y CI verde en
`main` y `develop`. Bundle inicial **333,88 kB**.

---

## ✅ Fase 6 · S6.1 — Backend compartido (Spec 002)

La aplicación deja de ser solo un ejercicio de frontend: se añadió la primera entrega
del servicio compartido, con especificación, plan, modelo de datos y contrato antes del
código.

- **Spec 002 aprobada** con cuatro historias: cuenta y sesión, tableros persistentes,
  roles por tablero e importación local. Artefactos en `specs/002-shared-backend/`.
- **PostgreSQL 17 local** con `compose.yaml`, base `taskflow_test` y migraciones
  embebidas con `goose` (`00001` usuarios/sesiones, `00002` tableros/columnas/miembros,
  `00003` tarjetas).
- **API Go** bajo `/api/v1`: registro, login, logout, `/me`, tableros, miembros,
  tarjetas, movimiento transaccional e importación idempotente.
- **Seguridad:** Argon2id, sesiones opacas con solo el SHA-256 en base de datos, cookie
  `HttpOnly`, comprobación de `Origin` y límite básico de peticiones de autenticación.
- **Permisos en servidor:** `admin`, `editor`, `viewer`; un `viewer` recibe `403`, un
  tablero ajeno responde `404`, y el último administrador no puede desaparecer.
- **Concurrencia:** `version` en tarjetas; una edición con versión vieja recibe `409`.
- **Importación:** conserva tableros y tarjetas de 1.0 con `legacy_id`; repetirla no
  duplica tableros.
- **Operación:** Dockerfile multi-stage que compila Angular y Go, sirve estáticos con
  `STATIC_DIR`, y job `backend` en GitHub Actions con PostgreSQL real.
- **Seguridad de dependencias:** Vite fijado a 8.3.5 con `overrides`; `npm audit`
  queda en cero vulnerabilidades conocidas.

**Verificado:** `go vet ./...`, `go test ./...` con PostgreSQL real, recorrido manual
registro → tablero → tarjeta → movimiento → logout, `npm run verify` completo
(180 tests unitarios, lint, fronteras y build), `npm audit` sin hallazgos y la imagen
Docker construida y probada sirviendo la SPA, `/healthz` y 404 JSON para la API.

**Pendiente consciente:** la interfaz todavía usa `localStorage`. La fase 9 de
`specs/002-shared-backend/tasks.md` conecta los repositorios de Angular con la API y
sustituye `/entrar` por login y registro reales.

---

## Siguiente fase

**Fase 6 en curso.** S6.1–S6.3 entregados: especificación, API, Docker y CI. Queda S6.4
(integrar Angular) y S6.5 (desplegar Go + Neon). SSR y WebMCP siguen opcionales.

---

## Dónde me quedé

El backend está implementado y probado de punta a punta con PostgreSQL, pero el
navegador aún no lo consume. La rama activa es `feature/002-shared-backend`.

## Siguiente paso concreto

Integrar Angular con la API: crear `shared/api`, migrar los repositorios de `board`,
`task` y `member` a HTTP, añadir `AuthService` + guard y reemplazar la entrada de demo
por login y registro.

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

| Fecha      | Sprint | Nota                                                                                   |
| ---------- | ------ | -------------------------------------------------------------------------------------- |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado.                          |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + husky/commitlint/eslint.                                  |
| 2026-10-17 | S0.2   | Esqueleto FSD, alias, boundaries ejecutables.                                          |
| 2026-10-17 | S0.3   | Spec Kit + constitución v1.0.0 + spec 001 aprobada.                                    |
| 2026-10-17 | S0.4   | Playwright + smoke test + CI. Fase 0 cerrada.                                          |
| 2026-10-17 | S1.1   | Dirección **A · Taller** + lengüeta de turno. system.md guardado.                      |
| 2026-10-18 | S3.2   | Lista de tableros, diálogo de creación y ruta al detalle.                              |
| 2026-10-19 | S3.3   | Lienzo del tablero: widget `board-canvas` con columnas y tarjetas.                     |
| 2026-10-19 | S3.4   | Mover tarjetas con arrastre y con menú; el menú del sistema no ejecutaba sus acciones. |
| 2026-10-19 | S3.5   | Formulario de tarjeta con Signal Forms: crear desde la columna y editar desde el menú. |
| 2026-10-19 | S3.5b  | Renombrar el tablero desde el detalle; el formulario de tablero pasa a `features`.     |
| 2026-10-19 | S3.6   | Filtro por texto y persona con el estado en la URL; `linkedSignal` y columna filtrada. |
| 2026-10-19 | S3.7   | Roles por tablero e invitaciones; el creador administra y la URL ajena se niega.       |
| 2026-10-20 | S4.1   | Cuatro journeys con archivo propio; el foco entra en los menús con el teclado.         |
| 2026-10-20 | S4.2   | Axe sin violaciones en las pantallas principales y recorrido completo con teclado.     |
| 2026-10-21 | S4.3   | Bundle inicial 330,94 kB (-20 %), avisos con `@defer` y presupuesto 350/370 kB.        |
| 2026-10-21 | S4.4   | Avisos sobre el diálogo y accesibles, X legible y móvil sin scroll de página.          |
| 2026-10-21 | S4.4.1 | Hundido global `.presionable`; F7 explicaba el cursor de texto.                        |
| 2026-10-21 | S4.5   | Plan y READMEs alineados; npm, S4.6 y release 1.0 registrados.                         |
| 2026-10-21 | S4.6   | Laboratorio dev-only de @Service, injectAsync y httpResource; 32 E2E.                  |
| 2026-10-21 | S5.1   | GitHub, CI verde, release 1.0.0 y tag v1.0.0.                                          |
| 2026-10-23 | S6.1   | Spec 002, PostgreSQL local, migraciones y API Go con tests de integración.             |
| 2026-10-23 | S6.2   | Auth, tableros, roles, tarjetas, movimiento, importación y Dockerfile multi-stage.     |
| 2026-10-23 | S6.3   | Imagen Docker verificada; Vite 8.3.5 y `npm audit` sin vulnerabilidades.               |
