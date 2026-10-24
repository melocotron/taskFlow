package httpapi

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/melocotron/taskflow/backend/internal/store"
)

type errorBody struct {
	Error errorDetail `json:"error"`
}

type errorDetail struct {
	Codigo  string `json:"codigo"`
	Mensaje string `json:"mensaje"`
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if value == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(value); err != nil {
		slog.Error("no se pudo escribir la respuesta", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, codigo, mensaje string) {
	writeJSON(w, status, errorBody{Error: errorDetail{Codigo: codigo, Mensaje: mensaje}})
}

func (s *Server) respondStoreError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		writeError(w, http.StatusNotFound, "no_encontrado", "El recurso no existe o no está disponible.")
	case errors.Is(err, store.ErrForbidden):
		writeError(w, http.StatusForbidden, "sin_permiso", "No tienes permiso para realizar esta acción.")
	case errors.Is(err, store.ErrLastAdmin):
		writeError(w, http.StatusConflict, "ultimo_admin", "El tablero necesita al menos un administrador.")
	case errors.Is(err, store.ErrConflict):
		writeError(w, http.StatusConflict, "conflicto", "El recurso cambió en otra sesión. Recarga e inténtalo de nuevo.")
	default:
		s.logger.Error("error interno", "error", err)
		writeError(w, http.StatusInternalServerError, "interno", "No se pudo completar la operación.")
	}
}
