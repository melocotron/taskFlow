package httpapi

import (
	"log/slog"

	"github.com/melocotron/taskflow/backend/internal/config"
	"github.com/melocotron/taskflow/backend/internal/store"
)

type Server struct {
	cfg         config.Config
	store       *store.Store
	logger      *slog.Logger
	authLimiter *ipLimiter
}

func NewServer(cfg config.Config, st *store.Store, logger *slog.Logger) *Server {
	if logger == nil {
		logger = slog.Default()
	}

	// En producción se limita el acceso por IP (una petición cada dos segundos con
	// ráfaga de 20). Las suites de test crean muchas cuentas desde la misma IP en
	// segundos, así que solo en `test`/`e2e` se usa un límite amplio para no convertir
	// la suite en una prueba del limitador.
	everySeconds, burst := 2.0, 20
	if cfg.AppEnv == "test" || cfg.AppEnv == "e2e" {
		everySeconds, burst = 0.01, 500
	}

	return &Server{
		cfg:         cfg,
		store:       st,
		logger:      logger,
		authLimiter: newIPLimiter(everySeconds, burst),
	}
}
