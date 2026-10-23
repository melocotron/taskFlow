package httpapi_test

import (
	"net/http"
	"testing"

	"github.com/melocotron/taskflow/backend/internal/testutil"
)

func TestImportLocalIsIdempotent(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	registerUser(t, server, client, "import@example.com")

	payload := map[string]any{
		"tableros": []map[string]any{
			{
				"id":        "local-board-1",
				"titulo":    "Trabajo anterior",
				"archivado": false,
				"creadoEn":  "2026-10-01T10:00:00Z",
				"columnas": []map[string]string{
					{"id": "por-hacer", "titulo": "Por hacer"},
					{"id": "hecho", "titulo": "Hecho"},
				},
			},
		},
		"tareas": []map[string]any{
			{"id": "t1", "boardId": "local-board-1", "columnaId": "por-hacer", "titulo": "Primera", "posicion": 0},
			{"id": "t2", "boardId": "local-board-1", "columnaId": "hecho", "titulo": "Segunda", "posicion": 0},
			{"id": "t3", "boardId": "local-board-1", "columnaId": "no-existe", "titulo": "Huérfana", "posicion": 0},
		},
	}

	first := testutil.JSON(t, client, http.MethodPost, server.URL+"/api/v1/import/local", payload)
	if first.Status != http.StatusOK {
		t.Fatalf("importar: %d %s", first.Status, first.Body)
	}
	var firstResult struct {
		TablerosImportados int `json:"tablerosImportados"`
		TablerosOmitidos   int `json:"tablerosOmitidos"`
		TareasImportadas   int `json:"tareasImportadas"`
		TareasOmitidas     int `json:"tareasOmitidas"`
	}
	testutil.Decode(t, first, &firstResult)
	if firstResult.TablerosImportados != 1 || firstResult.TareasImportadas != 2 || firstResult.TareasOmitidas != 1 {
		t.Fatalf("resultado inesperado: %+v", firstResult)
	}

	var summaries []struct {
		ID string `json:"id"`
	}
	result := testutil.JSON(t, client, http.MethodGet, server.URL+"/api/v1/boards", nil)
	testutil.Decode(t, result, &summaries)
	if len(summaries) != 1 {
		t.Fatalf("tableros importados: %+v", summaries)
	}
	imported := getBoard(t, server, client, summaries[0].ID)
	if len(imported.Columnas) != 2 || len(imported.Tareas) != 2 {
		t.Fatalf("contenido importado: %+v", imported)
	}

	second := testutil.JSON(t, client, http.MethodPost, server.URL+"/api/v1/import/local", payload)
	if second.Status != http.StatusOK {
		t.Fatalf("segunda importación: %d %s", second.Status, second.Body)
	}
	var secondResult struct {
		TablerosImportados int `json:"tablerosImportados"`
		TablerosOmitidos   int `json:"tablerosOmitidos"`
		TareasImportadas   int `json:"tareasImportadas"`
		TareasOmitidas     int `json:"tareasOmitidas"`
	}
	testutil.Decode(t, second, &secondResult)
	if secondResult.TablerosImportados != 0 || secondResult.TablerosOmitidos != 1 || secondResult.TareasImportadas != 0 || secondResult.TareasOmitidas != 3 {
		t.Fatalf("la segunda importación no fue idempotente: %+v", secondResult)
	}
}

func TestImportLocalSkipsInvalidBoards(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	registerUser(t, server, client, "import-invalid@example.com")

	result := testutil.JSON(t, client, http.MethodPost, server.URL+"/api/v1/import/local", map[string]any{
		"tableros": []map[string]any{
			{"id": "sin-columnas", "titulo": "Vacío", "columnas": []map[string]any{}},
			{"id": "", "titulo": "Sin id", "columnas": []map[string]any{{"id": "c", "titulo": "Columna"}}},
		},
		"tareas": []map[string]any{},
	})
	if result.Status != http.StatusOK {
		t.Fatalf("importar inválidos: %d %s", result.Status, result.Body)
	}
	var payload struct {
		TablerosImportados int `json:"tablerosImportados"`
		TablerosOmitidos   int `json:"tablerosOmitidos"`
	}
	testutil.Decode(t, result, &payload)
	if payload.TablerosImportados != 0 || payload.TablerosOmitidos != 2 {
		t.Fatalf("resultado inesperado: %+v", payload)
	}
}
