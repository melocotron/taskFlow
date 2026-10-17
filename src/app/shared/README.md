# shared/

**Sin conocimiento del negocio.** Nada de `Board`, `Task` ni `Member` aquí dentro.
Si algo de esta carpeta menciona el dominio, está en el sitio equivocado.

```
shared/
├── ui/    # EL DESIGN SYSTEM: button, input, card, dialog…
├── lib/   # utilidades puras (fechas, ids, arrays)
└── api/   # cliente HTTP, interceptores, manejo de errores
```

- ✅ puede importar: solo `shared/`
- ❌ no puede importar: `entities/`, `features/`, `widgets/`, `pages/`

Esta es la regla que más se rompe y la que más caro sale.
