# widgets/

**Bloques de UI con sentido propio**, formados por varios features + entities.
Ejemplo: el tablero completo con sus columnas y tarjetas.

- ✅ puede importar: `features/`, `entities/`, `shared/`
- ❌ no puede importar: `pages/`, otro `widget`

Si un widget empieza a tener lógica de negocio, esa lógica baja a `entities/`.
