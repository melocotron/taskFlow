package httpapi

import (
	"context"
	"errors"
	"net/http"

	"github.com/melocotron/taskflow/backend/internal/auth"
	"github.com/melocotron/taskflow/backend/internal/model"
	"github.com/melocotron/taskflow/backend/internal/store"
)

type contextKey string

const userContextKey contextKey = "usuario"

func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(s.cfg.CookieName)
		if err != nil || cookie.Value == "" {
			writeError(w, http.StatusUnauthorized, "no_autenticado", "Inicia sesión para continuar.")
			return
		}

		user, err := s.store.UserBySession(r.Context(), auth.HashToken(cookie.Value))
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				http.SetCookie(w, auth.ClearSessionCookie(s.cfg.CookieName, s.cfg.CookieSecure))
				writeError(w, http.StatusUnauthorized, "sesion_invalida", "La sesión caducó. Inicia sesión de nuevo.")
				return
			}
			s.logger.Error("error al leer la sesión", "error", err)
			writeError(w, http.StatusInternalServerError, "interno", "No se pudo comprobar la sesión.")
			return
		}

		ctx := context.WithValue(r.Context(), userContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func currentUser(r *http.Request) (model.User, bool) {
	user, ok := r.Context().Value(userContextKey).(model.User)
	return user, ok
}
