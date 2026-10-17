# pages/

**Una página = una ruta.** Solo compone: no tiene lógica de negocio propia.

- ✅ puede importar: `widgets/`, `features/`, `entities/`, `shared/`
- ❌ no puede importar: otra `page`

```ts
import { BoardCanvas } from '@widgets/board-canvas';
```

Nombre de archivo: `board-list/board-list.ts` (estilo 2025, sin `.component`).
