# features/

**Una acción del usuario = un feature.** `create-task`, `move-task`, `filter-tasks`.
Un feature es un verbo: si el nombre no es un verbo, probablemente es un widget.

- ✅ puede importar: `entities/`, `shared/`
- ❌ no puede importar: `widgets/`, `pages/`, otro `feature`

Cada slice exporta **solo** por su `index.ts`. Si nadie más lo usa, no se exporta.
