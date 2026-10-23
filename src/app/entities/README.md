# entities/

**El negocio.** Modelo, store con signals, acceso a datos y UI de presentación de un
concepto: `board`, `task`, `member`.

```
entities/board/
├── index.ts          # API pública del slice (lo único importable desde fuera)
├── model/            # board.model.ts, board.store.ts (+ .spec.ts)
├── api/              # board.repository.ts (HTTP) e importador local (1.0)
└── ui/               # board-card.ts (presentacional)
```

- ✅ puede importar: `shared/`, **otra entity** (única excepción entre slices)
- ❌ no puede importar: `features/`, `widgets/`, `pages/`
