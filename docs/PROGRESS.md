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

## Sprint actual

**S2.2 — Entidad `task`**

| Tarea                                                        | Estado |
| ------------------------------------------------------------ | ------ |
| `entities/task/model/task.model.ts` (tipo, estado, posición) | ⬜     |
| `entities/task/model/task.store.ts` con signals              | ⬜     |
| `entities/task/api/task.repository.ts`                       | ⬜     |
| Tests: mover de columna, orden manual                        | ⬜     |

**Criterio de verde:** mover una tarea de columna cambia su estado y su posición, con
tests que lo demuestren; `verify` verde.

---

## Dónde me quedé

S2.1 cerrado y mergeado. Árbol limpio.

Fase 1 cerrada y mergeada. Árbol limpio. Build en 387 kB (subió por el CDK: overlay, menú,
diálogo y a11y). Los presupuestos se ajustan en S4.3.

## Siguiente paso concreto

Crear el slice `entities/board` con modelo, store y su API pública.

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

| Fecha      | Sprint | Nota                                                              |
| ---------- | ------ | ----------------------------------------------------------------- |
| 2026-10-17 | —      | Plan maestro aprobado. Shell reparada (ACL). pnpm descartado.     |
| 2026-10-17 | S0.1   | Scaffolding Angular 22.2.3 + husky/commitlint/eslint.             |
| 2026-10-17 | S0.2   | Esqueleto FSD, alias, boundaries ejecutables.                     |
| 2026-10-17 | S0.3   | Spec Kit + constitución v1.0.0 + spec 001 aprobada.               |
| 2026-10-17 | S0.4   | Playwright + smoke test + CI. Fase 0 cerrada.                     |
| 2026-10-17 | S1.1   | Dirección **A · Taller** + lengüeta de turno. system.md guardado. |
