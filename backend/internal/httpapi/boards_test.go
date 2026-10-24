package httpapi_test

import (
	"net/http"
	"testing"

	"github.com/melocotron/taskflow/backend/internal/testutil"
)

func TestBoardsPersistAndAreIsolated(t *testing.T) {
	st := testutil.NewStore(t)
	server, alice := testutil.NewServer(t, st)
	registerUser(t, server, alice, "alice@example.com")
	board := createBoard(t, server, alice, "Lanzamiento")

	if len(board.Columnas) != 3 {
		t.Fatalf("se esperaban 3 columnas, hay %d", len(board.Columnas))
	}
	if board.Columnas[0].Titulo != "Por hacer" || board.Columnas[2].Titulo != "Hecho" {
		t.Fatalf("columnas inesperadas: %+v", board.Columnas)
	}
	if board.Rol != "admin" || len(board.Miembros) != 1 {
		t.Fatalf("tablero inicial inesperado: %+v", board)
	}

	loaded := getBoard(t, server, alice, board.ID)
	if loaded.ID != board.ID || len(loaded.Tareas) != 0 {
		t.Fatalf("snapshot inesperado: %+v", loaded)
	}

	var summaries []struct {
		ID     string `json:"id"`
		Rol    string `json:"rol"`
		Titulo string `json:"titulo"`
	}
	result := testutil.JSON(t, alice, http.MethodGet, server.URL+"/api/v1/boards", nil)
	if result.Status != http.StatusOK {
		t.Fatalf("listar tableros: %d %s", result.Status, result.Body)
	}
	testutil.Decode(t, result, &summaries)
	if len(summaries) != 1 || summaries[0].ID != board.ID || summaries[0].Rol != "admin" {
		t.Fatalf("lista inesperada: %+v", summaries)
	}

	_, bob := testutil.NewServer(t, st)
	registerUser(t, server, bob, "bob@example.com")
	foreign := testutil.JSON(t, bob, http.MethodGet, server.URL+"/api/v1/boards/"+board.ID, nil)
	if foreign.Status != http.StatusNotFound {
		t.Fatalf("tablero ajeno: %d %s", foreign.Status, foreign.Body)
	}
}

func TestBoardUpdateAndArchive(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	registerUser(t, server, client, "ana@example.com")
	board := createBoard(t, server, client, "Borrador")

	result := testutil.JSON(t, client, http.MethodPatch, server.URL+"/api/v1/boards/"+board.ID, map[string]any{
		"titulo": "Plan final",
	})
	if result.Status != http.StatusOK {
		t.Fatalf("renombrar: %d %s", result.Status, result.Body)
	}
	var renamed boardPayload
	testutil.Decode(t, result, &renamed)
	if renamed.Titulo != "Plan final" {
		t.Fatalf("título no actualizado: %+v", renamed)
	}

	result = testutil.JSON(t, client, http.MethodPatch, server.URL+"/api/v1/boards/"+board.ID, map[string]any{
		"archivado": true,
	})
	if result.Status != http.StatusOK {
		t.Fatalf("archivar: %d %s", result.Status, result.Body)
	}

	var active []map[string]any
	result = testutil.JSON(t, client, http.MethodGet, server.URL+"/api/v1/boards", nil)
	testutil.Decode(t, result, &active)
	if len(active) != 0 {
		t.Fatalf("el tablero archivado no debe aparecer: %+v", active)
	}

	var archived []map[string]any
	result = testutil.JSON(t, client, http.MethodGet, server.URL+"/api/v1/boards?archivados=true", nil)
	testutil.Decode(t, result, &archived)
	if len(archived) != 1 {
		t.Fatalf("el tablero archivado debe aparecer con el filtro: %+v", archived)
	}
}
