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

## Sprint actual

**S1.4 — Superficies: Card, Panel, Badge, Avatar, Divider, Skeleton, EmptyState**

| Tarea                                               | Estado |
| --------------------------------------------------- | ------ |
| `shared/ui/card` (con soporte de lengüeta de turno) | ⬜     |
| `shared/ui/badge`                                   | ⬜     |
| `shared/ui/avatar` (iniciales, sin anillo arcoíris) | ⬜     |
| `shared/ui/divider`, `skeleton`, `empty-state`      | ⬜     |
| Demo en `/kitchen-sink`                             | ⬜     |
| Tests por componente                                | ⬜     |

**Criterio de verde:** las siete piezas viven en `shared/ui`, la lengüeta de turno
funciona dentro de `card`, y `verify` pasa.

---

## Dónde me quedé

S1.3 cerrado y mergeado. Árbol limpio.

## Siguiente paso concreto

Crear `src/app/shared/ui/card/` con la lengüeta de turno como parte del componente.

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
