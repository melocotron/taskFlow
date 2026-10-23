package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

type addMemberRequest struct {
	Email string `json:"email"`
	Rol   string `json:"rol"`
}

type updateMemberRequest struct {
	Rol string `json:"rol"`
}

func (s *Server) addMember(w http.ResponseWriter, r *http.Request) {
	boardID := chi.URLParam(r, "boardId")
	if !validUUID(boardID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "El tablero no existe.")
		return
	}

	var request addMemberRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}
	email, err := normalizeEmail(request.Email)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "email_invalido", err.Error())
		return
	}
	role, err := parseRole(request.Rol)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "rol_invalido", err.Error())
		return
	}

	user, _ := currentUser(r)
	member, err := s.store.AddMember(r.Context(), boardID, user.ID, email, role)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, memberResponse{
		MemberID: member.UserID,
		Nombre:   member.Name,
		Email:    member.Email,
		Rol:      string(member.Role),
	})
}

func (s *Server) updateMemberRole(w http.ResponseWriter, r *http.Request) {
	boardID := chi.URLParam(r, "boardId")
	targetID := chi.URLParam(r, "userId")
	if !validUUID(boardID) || !validUUID(targetID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "La membresía no existe.")
		return
	}

	var request updateMemberRequest
	if err := decodeJSON(w, r, &request, s.cfg.MaxBodyBytes); err != nil {
		writeError(w, http.StatusUnprocessableEntity, "json_invalido", "El cuerpo de la petición no es válido.")
		return
	}
	role, err := parseRole(request.Rol)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, "rol_invalido", err.Error())
		return
	}

	user, _ := currentUser(r)
	member, err := s.store.UpdateMemberRole(r.Context(), boardID, user.ID, targetID, role)
	if err != nil {
		s.respondStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, memberResponse{
		MemberID: member.UserID,
		Nombre:   member.Name,
		Email:    member.Email,
		Rol:      string(member.Role),
	})
}

func (s *Server) removeMember(w http.ResponseWriter, r *http.Request) {
	boardID := chi.URLParam(r, "boardId")
	targetID := chi.URLParam(r, "userId")
	if !validUUID(boardID) || !validUUID(targetID) {
		writeError(w, http.StatusNotFound, "no_encontrado", "La membresía no existe.")
		return
	}

	user, _ := currentUser(r)
	if err := s.store.RemoveMember(r.Context(), boardID, user.ID, targetID); err != nil {
		s.respondStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
