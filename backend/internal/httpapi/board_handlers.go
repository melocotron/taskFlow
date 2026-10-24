package httpapi

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type createBoardRequest struct {
	Titulo string `json:"titulo"`
}

type updateBoardRequest struct {
	Titulo    *string `json:"titulo"`
	Archivado *bool   `json:"archivado"`
}

func (s *Server) listBoards(w http.ResponseWriter, r *http.Request) {
	includeArchived := false
	if raw := r.URL.Query().Get("archivados"); raw != "" {
		parsed, err := strconv.ParseBool(raw)
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "filtro_invalido", "El filtro archivados debe ser true o false.")
			return
		}
		includeArchived = parsed
	}

	user, _ := currentUser(r)
	boards, err := s.store.ListBoards(r.Context(), user.ID, includeArchived)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}

	response := make([]boardSummaryResponse, 0, len(boards))
	for _, board := range boards {
		response = append(response, toBoardSummary(board))
	}
	writeJSON(w, http.StatusOK, response)
}

func (s *Server) createBoard(w http.ResponseWriter, r *http.Request) {
	var request createBoardRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}
	title, err := validateTitle(request.Titulo, 160, "tablero")
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "titulo_invalido", err.Error())
		return
	}

	user, _ := currentUser(r)
	board, _, err := s.store.CreateBoard(r.Context(), user.ID, title, nil)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}

	snapshot, err := s.store.BoardSnapshot(r.Context(), board.ID, user.ID)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toBoardDetail(snapshot))
}

func (s *Server) getBoard(w http.ResponseWriter, r *http.Request) {
	boardID := chi.URLParam(r, "boardId")
	if !validUUID(boardID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "El tablero no existe.")
		return
	}

	user, _ := currentUser(r)
	snapshot, err := s.store.BoardSnapshot(r.Context(), boardID, user.ID)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toBoardDetail(snapshot))
}

func (s *Server) updateBoard(w http.ResponseWriter, r *http.Request) {
	boardID := chi.URLParam(r, "boardId")
	if !validUUID(boardID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "El tablero no existe.")
		return
	}

	var request updateBoardRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}
	if request.Titulo == nil && request.Archivado == nil {
		writeError(w, http.StatusUnprocessableEntity, "sin_cambios", "Indica al menos un campo para actualizar.")
		return
	}
	if request.Titulo != nil {
		title, err := validateTitle(*request.Titulo, 160, "tablero")
		if err != nil {
			writeError(w, http.StatusUnprocessableEntity, "titulo_invalido", err.Error())
			return
		}
		request.Titulo = &title
	}

	user, _ := currentUser(r)
	if err := s.store.UpdateBoard(r.Context(), boardID, user.ID, request.Titulo, request.Archivado); err != nil {
		s.respondStoreError(w, err)
		return
	}

	snapshot, err := s.store.BoardSnapshot(r.Context(), boardID, user.ID)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toBoardDetail(snapshot))
}
