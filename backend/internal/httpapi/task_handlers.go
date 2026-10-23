package httpapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/melocotron/taskflow/backend/internal/store"
)

type createTaskRequest struct {
	ColumnaID     string  `json:"columnaId"`
	Titulo        string  `json:"titulo"`
	Descripcion   string  `json:"descripcion"`
	ResponsableID *string `json:"responsableId"`
}

type updateTaskRequest struct {
	Titulo        *string         `json:"titulo"`
	Descripcion   *string         `json:"descripcion"`
	ResponsableID json.RawMessage `json:"responsableId"`
	Version       *int            `json:"version"`
}

type moveTaskRequest struct {
	ColumnaID string `json:"columnaId"`
	Posicion  int    `json:"posicion"`
	Version   *int   `json:"version"`
}

func (s *Server) createTask(w http.ResponseWriter, r *http.Request) {
	boardID := chi.URLParam(r, "boardId")
	if !validUUID(boardID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "El tablero no existe.")
		return
	}

	var request createTaskRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}
	if !validUUID(request.ColumnaID) {
		writeError(w, http.StatusUnprocessableEntity, "columna_invalida", "La columna no es válida.")
		return
	}
	title, err := validateTitle(request.Titulo, 240, "tarjeta")
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "titulo_invalido", err.Error())
		return
	}
	description, err := validateDescription(request.Descripcion)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "descripcion_invalida", err.Error())
		return
	}
	if request.ResponsableID != nil && !validUUID(*request.ResponsableID) {
		writeError(w, http.StatusUnprocessableEntity, "responsable_invalido", "El responsable no es válido.")
		return
	}

	user, _ := currentUser(r)
	task, err := s.store.CreateTask(
		r.Context(), boardID, user.ID, request.ColumnaID, title, description, request.ResponsableID,
	)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toTask(task))
}

func (s *Server) updateTask(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	if !validUUID(taskID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "La tarjeta no existe.")
		return
	}

	var request updateTaskRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}
	if request.Titulo == nil && request.Descripcion == nil && len(request.ResponsableID) == 0 {
		writeError(w, http.StatusUnprocessableEntity, "sin_cambios", "Indica al menos un campo para actualizar.")
		return
	}

	update := store.TaskUpdate{Version: request.Version}
	if request.Titulo != nil {
		title, err := validateTitle(*request.Titulo, 240, "tarjeta")
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "titulo_invalido", err.Error())
			return
		}
		update.Title = &title
	}
	if request.Descripcion != nil {
		description, err := validateDescription(*request.Descripcion)
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "descripcion_invalida", err.Error())
			return
		}
		update.Description = &description
	}
	if len(request.ResponsableID) > 0 {
		update.AssigneeSet = true
		if string(request.ResponsableID) != "null" {
			var assigneeID string
			if err := json.Unmarshal(request.ResponsableID, &assigneeID); err != nil || !validUUID(assigneeID) {
				writeError(w, http.StatusUnprocessableEntity, "responsable_invalido", "El responsable no es válido.")
				return
			}
			update.AssigneeID = &assigneeID
		}
	}
	if request.Version != nil && *request.Version < 1 {
		writeError(w, http.StatusUnprocessableEntity, "version_invalida", "La versión no es válida.")
		return
	}

	user, _ := currentUser(r)
	task, err := s.store.UpdateTask(r.Context(), taskID, user.ID, update)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toTask(task))
}

func (s *Server) deleteTask(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	if !validUUID(taskID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "La tarjeta no existe.")
		return
	}

	user, _ := currentUser(r)
	if err := s.store.DeleteTask(r.Context(), taskID, user.ID); err != nil {
		s.respondStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) moveTask(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "taskId")
	if !validUUID(taskID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "La tarjeta no existe.")
		return
	}

	var request moveTaskRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}
	if !validUUID(request.ColumnaID) {
		writeError(w, http.StatusUnprocessableEntity, "columna_invalida", "La columna no es válida.")
		return
	}
	if request.Posicion < 0 {
		writeError(w, http.StatusUnprocessableEntity, "posicion_invalida", "La posición no es válida.")
		return
	}
	if request.Version != nil && *request.Version < 1 {
		writeError(w, http.StatusUnprocessableEntity, "version_invalida", "La versión no es válida.")
		return
	}

	user, _ := currentUser(r)
	task, err := s.store.MoveTask(
		r.Context(), taskID, user.ID, request.ColumnaID, request.Posicion, request.Version,
	)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toTask(task))
}
