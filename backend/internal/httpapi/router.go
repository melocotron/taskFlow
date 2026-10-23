package httpapi

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/melocotron/taskflow/backend/internal/config"
	"github.com/melocotron/taskflow/backend/internal/store"
)

func NewRouter(cfg config.Config, st *store.Store, logger *slog.Logger) http.Handler {
	s := NewServer(cfg, st, logger)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(s.requestLogger)
	r.Use(s.securityHeaders)
	r.Use(s.csrf)

	r.Get("/healthz", s.healthz)
	r.Get("/readyz", s.readyz)

	r.Route("/api/v1", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(s.authRateLimit)
			r.Post("/auth/register", s.register)
			r.Post("/auth/login", s.login)
		})
		r.Post("/auth/logout", s.logout)

		r.Group(func(r chi.Router) {
			r.Use(s.requireAuth)
			r.Get("/me", s.me)

			r.Get("/boards", s.listBoards)
			r.Post("/boards", s.createBoard)

			r.Route("/boards/{boardId}", func(r chi.Router) {
				r.Get("/", s.getBoard)
				r.Patch("/", s.updateBoard)
				r.Post("/members", s.addMember)
				r.Patch("/members/{userId}", s.updateMemberRole)
				r.Delete("/members/{userId}", s.removeMember)
				r.Post("/tasks", s.createTask)
			})

			r.Patch("/tasks/{taskId}", s.updateTask)
			r.Delete("/tasks/{taskId}", s.deleteTask)
			r.Post("/tasks/{taskId}/move", s.moveTask)

			r.Post("/import/local", s.importLocal)
		})
	})

	if cfg.StaticDir != "" {
		r.Get("/*", s.static)
	}

	r.NotFound(func(w http.ResponseWriter, _ *http.Request) {
		writeError(w, http.StatusNotFound, "ruta_no_encontrada", "La ruta no existe.")
	})
	r.MethodNotAllowed(func(w http.ResponseWriter, _ *http.Request) {
		writeError(w, http.StatusMethodNotAllowed, "metodo_no_permitido", "El método no está permitido.")
	})

	return r
}
