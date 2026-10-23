package httpapi

import (
	"context"
	"net/http"
	"time"
)

func (s *Server) healthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"estado": "ok"})
}

func (s *Server) readyz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := s.store.Ping(ctx); err != nil {
		writeError(w, http.StatusServiceUnavailable, "no_disponible", "La base de datos no está disponible.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"estado": "listo"})
}
