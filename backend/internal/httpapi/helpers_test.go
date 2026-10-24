package httpapi_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/melocotron/taskflow/backend/internal/testutil"
)

type boardColumn struct {
	ID       string `json:"id"`
	Titulo   string `json:"titulo"`
	Posicion int    `json:"posicion"`
}

type boardMember struct {
	MemberID string `json:"memberId"`
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	Rol      string `json:"rol"`
}

type taskPayload struct {
	ID                string  `json:"id"`
	BoardID           string  `json:"boardId"`
	ColumnaID         string  `json:"columnaId"`
	Titulo            string  `json:"titulo"`
	Descripcion       string  `json:"descripcion"`
	ResponsableID     *string `json:"responsableId"`
	ResponsableNombre *string `json:"responsableNombre"`
	Posicion          int     `json:"posicion"`
	Version           int     `json:"version"`
}

type boardPayload struct {
	ID        string        `json:"id"`
	Titulo    string        `json:"titulo"`
	Archivado bool          `json:"archivado"`
	Rol       string        `json:"rol"`
	Columnas  []boardColumn `json:"columnas"`
	Miembros  []boardMember `json:"miembros"`
	Tareas    []taskPayload `json:"tareas"`
}

func registerUser(t *testing.T, server *httptest.Server, client *http.Client, email string) userPayload {
	t.Helper()
	result := testutil.JSON(t, client, http.MethodPost, server.URL+"/api/v1/auth/register", map[string]string{
		"nombre":   "Persona de prueba",
		"email":    email,
		"password": "secreto-largo",
	})
	if result.Status != http.StatusCreated {
		t.Fatalf("registrar %s: %d %s", email, result.Status, result.Body)
	}
	var user userPayload
	testutil.Decode(t, result, &user)
	return user
}

func createBoard(t *testing.T, server *httptest.Server, client *http.Client, title string) boardPayload {
	t.Helper()
	result := testutil.JSON(t, client, http.MethodPost, server.URL+"/api/v1/boards", map[string]string{
		"titulo": title,
	})
	if result.Status != http.StatusCreated {
		t.Fatalf("crear tablero: %d %s", result.Status, result.Body)
	}
	var board boardPayload
	testutil.Decode(t, result, &board)
	return board
}

func createTask(t *testing.T, server *httptest.Server, client *http.Client, board boardPayload, columnID, title string) taskPayload {
	t.Helper()
	result := testutil.JSON(t, client, http.MethodPost, server.URL+"/api/v1/boards/"+board.ID+"/tasks", map[string]any{
		"columnaId":   columnID,
		"titulo":      title,
		"descripcion": "Descripción de prueba",
	})
	if result.Status != http.StatusCreated {
		t.Fatalf("crear tarjeta: %d %s", result.Status, result.Body)
	}
	var task taskPayload
	testutil.Decode(t, result, &task)
	return task
}

func getBoard(t *testing.T, server *httptest.Server, client *http.Client, boardID string) boardPayload {
	t.Helper()
	result := testutil.JSON(t, client, http.MethodGet, server.URL+"/api/v1/boards/"+boardID, nil)
	if result.Status != http.StatusOK {
		t.Fatalf("leer tablero: %d %s", result.Status, result.Body)
	}
	var board boardPayload
	testutil.Decode(t, result, &board)
	return board
}
