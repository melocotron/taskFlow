package testutil

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/melocotron/taskflow/backend/internal/store"
	"github.com/melocotron/taskflow/backend/migrations"
)

// NewStore abre la base de pruebas, aplica migraciones y limpia las tablas.
// Si TEST_DATABASE_URL no existe, la prueba se omite.
func NewStore(t *testing.T) *store.Store {
	t.Helper()

	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("TEST_DATABASE_URL no está definida; se omiten las pruebas de integración")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := migrations.Up(ctx, databaseURL); err != nil {
		t.Fatalf("aplicar migraciones: %v", err)
	}

	st, err := store.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("abrir base de pruebas: %v", err)
	}
	t.Cleanup(st.Close)

	if _, err := st.Pool.Exec(ctx, `
		TRUNCATE tasks, board_columns, board_members, boards, sessions, users
		RESTART IDENTITY CASCADE
	`); err != nil {
		t.Fatalf("limpiar base de pruebas: %v", err)
	}

	return st
}
