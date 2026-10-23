package httpapi

import (
	"errors"
	"net/http"
	"time"

	"github.com/melocotron/taskflow/backend/internal/auth"
	"github.com/melocotron/taskflow/backend/internal/model"
	"github.com/melocotron/taskflow/backend/internal/store"
)

type registerRequest struct {
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	var request registerRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}

	name, err := validateName(request.Nombre)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "nombre_invalido", err.Error())
		return
	}
	email, err := normalizeEmail(request.Email)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "email_invalido", err.Error())
		return
	}
	if err := validatePassword(request.Password); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "password_invalida", err.Error())
		return
	}

	passwordHash, err := auth.HashPassword(request.Password)
	if err != nil {
		s.logger.Error("no se pudo hashear la contraseña", "error", err)
		writeError(w, http.StatusInternalServerError, "interno", "No se pudo crear la cuenta.")
		return
	}

	user, err := s.store.CreateUser(r.Context(), name, email, passwordHash)
	if err != nil {
		if errors.Is(err, store.ErrConflict) {
			writeError(w, http.StatusConflict, "email_duplicado", "Ya existe una cuenta con ese email.")
			return
		}
		s.respondStoreError(w, err)
		return
	}

	if err := s.startSession(w, r, user); err != nil {
		s.respondStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, toUser(user))
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var request loginRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}

	email, err := normalizeEmail(request.Email)
	if err != nil || request.Password == "" {
		writeError(w, http.StatusUnauthorized, "credenciales_invalidas", "El email o la contraseña no son correctos.")
		return
	}

	user, err := s.store.UserByEmail(r.Context(), email)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusUnauthorized, "credenciales_invalidas", "El email o la contraseña no son correctos.")
			return
		}
		s.respondStoreError(w, err)
		return
	}

	valid, err := auth.VerifyPassword(request.Password, user.PasswordHash)
	if err != nil || !valid {
		writeError(w, http.StatusUnauthorized, "credenciales_invalidas", "El email o la contraseña no son correctos.")
		return
	}

	if err := s.startSession(w, r, user); err != nil {
		s.respondStoreError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, toUser(user))
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(s.cfg.CookieName); err == nil && cookie.Value != "" {
		if err := s.store.DeleteSession(r.Context(), auth.HashToken(cookie.Value)); err != nil {
			s.logger.Error("no se pudo cerrar la sesión", "error", err)
		}
	}

	http.SetCookie(w, auth.ClearSessionCookie(s.cfg.CookieName, s.cfg.CookieSecure))
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUser(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "no_autenticado", "Inicia sesión para continuar.")
		return
	}
	writeJSON(w, http.StatusOK, toUser(user))
}

func (s *Server) startSession(w http.ResponseWriter, r *http.Request, user model.User) error {
	token, tokenHash, err := auth.NewSessionToken()
	if err != nil {
		return err
	}

	expiresAt := time.Now().Add(s.cfg.SessionTTL)
	if err := s.store.CreateSession(r.Context(), user.ID, tokenHash, expiresAt); err != nil {
		return err
	}

	http.SetCookie(w, auth.NewSessionCookie(s.cfg.CookieName, token, s.cfg.CookieSecure, s.cfg.SessionTTL))
	return nil
}
