package httpapi

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// static sirve la build de Angular y deja que las rutas de la SPA caigan en index.html.
// Las rutas /api que no existen siguen respondiendo JSON, no HTML.
func (s *Server) static(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/") {
		writeError(w, http.StatusNotFound, "ruta_no_encontrada", "La ruta no existe.")
		return
	}

	root, err := filepath.Abs(s.cfg.StaticDir)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "interno", "No se pudo servir la aplicación.")
		return
	}

	requested := filepath.Join(root, filepath.FromSlash(strings.TrimPrefix(r.URL.Path, "/")))
	clean := filepath.Clean(requested)
	if clean != root && !strings.HasPrefix(clean, root+string(os.PathSeparator)) {
		writeError(w, http.StatusNotFound, "ruta_no_encontrada", "La ruta no existe.")
		return
	}

	if info, err := os.Stat(clean); err == nil && !info.IsDir() {
		http.ServeFile(w, r, clean)
		return
	}

	http.ServeFile(w, r, filepath.Join(root, "index.html"))
}
