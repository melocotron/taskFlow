package httpapi_test

import (
	"net/http"
	"testing"

	"github.com/melocotron/taskflow/backend/internal/testutil"
)

func TestMembersAndRoles(t *testing.T) {
	st := testutil.NewStore(t)
	server, admin := testutil.NewServer(t, st)
	adminUser := registerUser(t, server, admin, "admin@example.com")
	board := createBoard(t, server, admin, "Equipo")

	viewerServer, viewer := testutil.NewServer(t, st)
	viewerUser := registerUser(t, viewerServer, viewer, "viewer@example.com")

	addViewer := testutil.JSON(t, admin, http.MethodPost, server.URL+"/api/v1/boards/"+board.ID+"/members", map[string]string{
		"email": viewerUser.Email,
		"rol":   "viewer",
	})
	if addViewer.Status != http.StatusCreated {
		t.Fatalf("añadir viewer: %d %s", addViewer.Status, addViewer.Body)
	}

	visible := getBoard(t, viewerServer, viewer, board.ID)
	if visible.Rol != "viewer" || len(visible.Miembros) != 2 {
		t.Fatalf("tablero para viewer inesperado: %+v", visible)
	}

	createAttempt := testutil.JSON(t, viewer, http.MethodPost,
		viewerServer.URL+"/api/v1/boards/"+board.ID+"/tasks",
		map[string]string{"columnaId": board.Columnas[0].ID, "titulo": "No permitido"})
	if createAttempt.Status != http.StatusForbidden {
		t.Fatalf("viewer no debe crear tarjetas: %d %s", createAttempt.Status, createAttempt.Body)
	}

	renameAttempt := testutil.JSON(t, viewer, http.MethodPatch,
		viewerServer.URL+"/api/v1/boards/"+board.ID,
		map[string]string{"titulo": "No permitido"})
	if renameAttempt.Status != http.StatusForbidden {
		t.Fatalf("viewer no debe renombrar: %d %s", renameAttempt.Status, renameAttempt.Body)
	}

	memberAttempt := testutil.JSON(t, viewer, http.MethodPost,
		viewerServer.URL+"/api/v1/boards/"+board.ID+"/members",
		map[string]string{"email": "nadie@example.com", "rol": "viewer"})
	if memberAttempt.Status != http.StatusForbidden {
		t.Fatalf("viewer no debe gestionar miembros: %d %s", memberAttempt.Status, memberAttempt.Body)
	}

	selfDemote := testutil.JSON(t, admin, http.MethodPatch,
		server.URL+"/api/v1/boards/"+board.ID+"/members/"+adminUser.ID,
		map[string]string{"rol": "viewer"})
	if selfDemote.Status != http.StatusConflict {
		t.Fatalf("el último admin no debe degradarse: %d %s", selfDemote.Status, selfDemote.Body)
	}

	selfRemove := testutil.JSON(t, admin, http.MethodDelete,
		server.URL+"/api/v1/boards/"+board.ID+"/members/"+adminUser.ID, nil)
	if selfRemove.Status != http.StatusConflict {
		t.Fatalf("el último admin no debe eliminarse: %d %s", selfRemove.Status, selfRemove.Body)
	}

	removeViewer := testutil.JSON(t, admin, http.MethodDelete,
		server.URL+"/api/v1/boards/"+board.ID+"/members/"+viewerUser.ID, nil)
	if removeViewer.Status != http.StatusNoContent {
		t.Fatalf("eliminar viewer: %d %s", removeViewer.Status, removeViewer.Body)
	}

	afterRemoval := testutil.JSON(t, viewer, http.MethodGet,
		viewerServer.URL+"/api/v1/boards/"+board.ID, nil)
	if afterRemoval.Status != http.StatusNotFound {
		t.Fatalf("viewer eliminado no debe ver el tablero: %d %s", afterRemoval.Status, afterRemoval.Body)
	}
}
