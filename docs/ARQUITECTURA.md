# Arquitectura

> Una sola flecha. Si un import la rompe, el lint falla y el commit no pasa.

```
pages  →  widgets  →  features  →  entities  →  shared
```

## Qué va en cada capa

| Capa        | Qué contiene                                   | Ejemplo                       |
| ----------- | ---------------------------------------------- | ----------------------------- |
| `pages/`    | Una ruta. Solo compone.                        | `board-list`, `board-detail`  |
| `widgets/`  | Bloque de UI con sentido propio.               | `board-canvas`, `app-sidebar` |
| `features/` | **Una acción** del usuario (verbo).            | `create-task`, `move-task`    |
| `entities/` | El negocio: modelo, store, API, UI de lectura. | `board`, `task`, `member`     |
| `shared/`   | Sin negocio: design system, utilidades, HTTP.  | `ui/button`, `lib/date`       |

## Qué puede importar cada capa

| Desde ↓ / hacia → | pages | widgets | features | entities | shared |
| ----------------- | :---: | :-----: | :------: | :------: | :----: |
| pages             |   —   |   ✅    |    ✅    |    ✅    |   ✅   |
| widgets           |  ❌   |    —    |    ✅    |    ✅    |   ✅   |
| features          |  ❌   |   ❌    |    —     |    ✅    |   ✅   |
| entities          |  ❌   |   ❌    |    ❌    |    ✅    |   ✅   |
| shared            |  ❌   |   ❌    |    ❌    |    ❌    |   ✅   |

`entities → entities` es la **única** excepción entre slices: `task` necesita el tipo
`BoardId` de `board`. Y siempre a través del `index.ts` del slice.

## Encapsulación de slices

Desde fuera de un slice solo se importa su `index.ts`:

```ts
// ✅
import { BoardStore } from '@entities/board';

// ❌ lo bloquea el lint
import { BoardStore } from '@entities/board/model/board.store';
```

## Los comandos

```bash
npm run lint        # eslint + fronteras de arquitectura
npm run lint:arch   # solo fronteras (más rápido para comprobar un cambio)
npm run verify      # format + lint + tests + build (lo que corre CI)
```

## Cuando el lint te bloquea

El mensaje dice exactamente qué regla y qué import. Las reglas viven en
[.dependency-cruiser.cjs](../.dependency-cruiser.cjs), una por línea de la tabla.

Casi siempre la solución correcta es **mover el código**, no silenciar la regla:

- ¿`shared` importa `entities`? Ese componente no es compartido: súbelo a `entities`.
- ¿`features` importa `widgets`? Ese feature quiere ser un widget.
- ¿`entities` importa `features`? La lógica de negocio está en el sitio equivocado.
