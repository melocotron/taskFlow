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
	return &Server{
		cfg:         cfg,
		store:       st,
		logger:      logger,
		authLimiter: newIPLimiter(2, 20),
	}
}
