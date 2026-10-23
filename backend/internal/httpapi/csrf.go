package httpapi

import (
	"net/http"
	"strings"
)

// csrf protege los métodos mutables cuando el navegador envía Origin. Los clientes
// de línea de comandos sin Origin siguen funcionando; las cookies son SameSite=Lax.
func (s *Server) csrf(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions:
			next.ServeHTTP(w, r)
			return
		}

		origin := strings.TrimSuffix(strings.TrimSpace(r.Header.Get("Origin")), "/")
		if origin != "" && !s.originAllowed(origin) {
			writeError(w, http.StatusForbidden, "origen_invalido", "El origen de la petición no está permitido.")
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) originAllowed(origin string) bool {
	for _, allowed := range s.cfg.AllowedOrigins {
		if strings.EqualFold(strings.TrimSuffix(allowed, "/"), origin) {
			return true
		}
	}
	return false
}
