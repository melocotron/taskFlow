package httpapi_test

import (
	"net/http"
	"testing"

	"github.com/melocotron/taskflow/backend/internal/testutil"
)

func TestTaskCreateUpdateAndMove(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	registerUser(t, server, client, "task@example.com")
	board := createBoard(t, server, client, "Tareas")

	first := createTask(t, server, client, board, board.Columnas[0].ID, "Primera")
	second := createTask(t, server, client, board, board.Columnas[0].ID, "Segunda")
	if first.Posicion != 0 || second.Posicion != 1 {
		t.Fatalf("posiciones iniciales inesperadas: %d, %d", first.Posicion, second.Posicion)
	}

	update := testutil.JSON(t, client, http.MethodPatch,
		server.URL+"/api/v1/tasks/"+first.ID,
		map[string]any{"titulo": "Primera editada", "version": first.Version})
	if update.Status != http.StatusOK {
		t.Fatalf("editar tarjeta: %d %s", update.Status, update.Body)
	}
	var edited taskPayload
	testutil.Decode(t, update, &edited)
	if edited.Titulo != "Primera editada" || edited.Version != first.Version+1 {
		t.Fatalf("edición inesperada: %+v", edited)
	}

	stale := testutil.JSON(t, client, http.MethodPatch,
		server.URL+"/api/v1/tasks/"+first.ID,
		map[string]any{"titulo": "Versión vieja", "version": first.Version})
	if stale.Status != http.StatusConflict {
		t.Fatalf("versión obsoleta: %d %s", stale.Status, stale.Body)
	}

	moved := testutil.JSON(t, client, http.MethodPost,
		server.URL+"/api/v1/tasks/"+second.ID+"/move",
		map[string]any{"columnaId": board.Columnas[1].ID, "posicion": 0, "version": second.Version})
	if moved.Status != http.StatusOK {
		t.Fatalf("mover tarjeta: %d %s", moved.Status, moved.Body)
	}
	var movedTask taskPayload
	testutil.Decode(t, moved, &movedTask)
	if movedTask.ColumnaID != board.Columnas[1].ID || movedTask.Posicion != 0 {
		t.Fatalf("movimiento inesperado: %+v", movedTask)
	}

	loaded := getBoard(t, server, client, board.ID)
	if len(loaded.Tareas) != 2 {
		t.Fatalf("tarjetas esperadas: %d", len(loaded.Tareas))
	}
	for _, task := range loaded.Tareas {
		if task.ID == second.ID && (task.ColumnaID != board.Columnas[1].ID || task.Posicion != 0) {
			t.Fatalf("la tarjeta no persistió el movimiento: %+v", task)
		}
	}
}

func TestTaskMoveWithinColumnAndRejectsForeignColumn(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	registerUser(t, server, client, "orden@example.com")
	board := createBoard(t, server, client, "Orden")
	column := board.Columnas[0].ID

	first := createTask(t, server, client, board, column, "Uno")
	second := createTask(t, server, client, board, column, "Dos")
	third := createTask(t, server, client, board, column, "Tres")

	moved := testutil.JSON(t, client, http.MethodPost,
		server.URL+"/api/v1/tasks/"+third.ID+"/move",
		map[string]any{"columnaId": column, "posicion": 0, "version": third.Version})
	if moved.Status != http.StatusOK {
		t.Fatalf("mover dentro de columna: %d %s", moved.Status, moved.Body)
	}

	loaded := getBoard(t, server, client, board.ID)
	positions := map[string]int{}
	for _, task := range loaded.Tareas {
		positions[task.ID] = task.Posicion
	}
	if positions[third.ID] != 0 || positions[first.ID] != 1 || positions[second.ID] != 2 {
		t.Fatalf("orden inesperado: %+v", positions)
	}

	otherBoard := createBoard(t, server, client, "Otro")
	foreign := testutil.JSON(t, client, http.MethodPost,
		server.URL+"/api/v1/tasks/"+first.ID+"/move",
		map[string]any{"columnaId": otherBoard.Columnas[0].ID, "posicion": 0})
	if foreign.Status != http.StatusNotFound {
		t.Fatalf("columna de otro tablero: %d %s", foreign.Status, foreign.Body)
	}
}

func TestTaskAssigneeMustBelongToBoard(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	registerUser(t, server, client, "asignado@example.com")
	board := createBoard(t, server, client, "Asignaciones")

	otherServer, otherClient := testutil.NewServer(t, st)
	other := registerUser(t, otherServer, otherClient, "externo@example.com")

	result := testutil.JSON(t, client, http.MethodPost,
		server.URL+"/api/v1/boards/"+board.ID+"/tasks",
		map[string]any{
			"columnaId":     board.Columnas[0].ID,
			"titulo":        "Con responsable externo",
			"responsableId": other.ID,
		})
	if result.Status != http.StatusForbidden {
		t.Fatalf("responsable externo: %d %s", result.Status, result.Body)
	}
}
