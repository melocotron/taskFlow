package httpapi

import (
	"net/http"

	"github.com/melocotron/taskflow/backend/internal/store"
)

type importLocalRequest struct {
	Tableros []localBoardRequest `json:"tableros"`
	Tareas   []localTaskRequest  `json:"tareas"`
}

type localBoardRequest struct {
	ID        string               `json:"id"`
	Titulo    string               `json:"titulo"`
	Columnas  []localColumnRequest `json:"columnas"`
	Archivado bool                 `json:"archivado"`
	CreadoEn  string               `json:"creadoEn"`
}

type localColumnRequest struct {
	ID     string `json:"id"`
	Titulo string `json:"titulo"`
}

type localTaskRequest struct {
	ID          string  `json:"id"`
	BoardID     string  `json:"boardId"`
	ColumnaID   string  `json:"columnaId"`
	Titulo      string  `json:"titulo"`
	Descripcion string  `json:"descripcion"`
	Responsable *string `json:"responsable"`
	Posicion    int     `json:"posicion"`
	CreadoEn    string  `json:"creadoEn"`
}

type importResultResponse struct {
	TablerosImportados int `json:"tablerosImportados"`
	TablerosOmitidos   int `json:"tablerosOmitidos"`
	TareasImportadas   int `json:"tareasImportadas"`
	TareasOmitidas     int `json:"tareasOmitidas"`
}

func (s *Server) importLocal(w http.ResponseWriter, r *http.Request) {
	var request importLocalRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}

	boards := make([]store.LocalBoardInput, 0, len(request.Tableros))
	for _, board := range request.Tableros {
		columns := make([]store.LocalColumnInput, 0, len(board.Columnas))
		for _, column := range board.Columnas {
			columns = append(columns, store.LocalColumnInput{ID: column.ID, Title: column.Titulo})
		}
		boards = append(boards, store.LocalBoardInput{
			ID:       board.ID,
			Title:    board.Titulo,
			Archived: board.Archivado,
			Columns:  columns,
		})
	}

	tasks := make([]store.LocalTaskInput, 0, len(request.Tareas))
	for _, task := range request.Tareas {
		tasks = append(tasks, store.LocalTaskInput{
			BoardID:     task.BoardID,
			ColumnID:    task.ColumnaID,
			Title:       task.Titulo,
			Description: task.Descripcion,
			Position:    task.Posicion,
		})
	}

	user, _ := currentUser(r)
	result, err := s.store.ImportLocal(r.Context(), user.ID, boards, tasks)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, importResultResponse{
		TablerosImportados: result.ImportedBoards,
		TablerosOmitidos:   result.SkippedBoards,
		TareasImportadas:   result.ImportedTasks,
		TareasOmitidas:     result.SkippedTasks,
	})
}
