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

## Sprint actual

**S1.2 — Tokens y kitchen-sink**

| Tarea                                                      | Estado |
| ---------------------------------------------------------- | ------ |
| `src/styles/tokens/primitivos.css`                         | ⬜     |
| `src/styles/tokens/semanticos.css`                         | ⬜     |
| `src/styles/tokens/componentes.css`                        | ⬜     |
| `src/styles/base.css` (reset, tipografía base, focus ring) | ⬜     |
| Fuentes locales con `@fontsource`                          | ⬜     |
| Ruta `/kitchen-sink` mostrando tokens (no componentes)     | ⬜     |
| Chequeo: cero hexadecimales fuera de `tokens/`             | ⬜     |

**Criterio de verde:** `/kitchen-sink` muestra la rampa de color, la escala tipográfica,
el espaciado, los radios y la lengüeta de turno como especimen vivo. `verify` verde.

---

## Dónde me quedé

S1.1 cerrado y commiteado. Nada a medias.

## Siguiente paso concreto

Escribir los tres archivos de tokens y montar `/kitchen-sink` para ver la dirección A.

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
