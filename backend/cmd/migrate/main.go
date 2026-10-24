package main

import (
	"context"
	"log/slog"
	"os"
	"time"

	"github.com/melocotron/taskflow/backend/internal/config"
	"github.com/melocotron/taskflow/backend/migrations"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	cfg, err := config.Load()
	if err != nil {
		slog.Error("configuración inválida", "error", err)
		os.Exit(1)
	}

	if err := migrations.Up(ctx, cfg.DatabaseURL); err != nil {
		slog.Error("migraciones fallidas", "error", err)
		os.Exit(1)
	}

	slog.Info("migraciones aplicadas")
}
