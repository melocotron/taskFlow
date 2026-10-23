package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"strings"

	"github.com/google/uuid"
	"github.com/melocotron/taskflow/backend/internal/model"
)

var errInvalidJSON = errors.New("cuerpo JSON inválido")

func decodeJSON(w http.ResponseWriter, r *http.Request, target any, maxBytes int64) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(target); err != nil {
		return fmt.Errorf("%w: %v", errInvalidJSON, err)
	}

	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return fmt.Errorf("%w: se esperaba un único objeto", errInvalidJSON)
	}
	return nil
}

func normalizeEmail(raw string) (string, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" || len(raw) > 254 {
		return "", errors.New("el email no es válido")
	}
	address, err := mail.ParseAddress(raw)
	if err != nil || !strings.EqualFold(address.Address, raw) {
		return "", errors.New("el email no es válido")
	}
	return strings.ToLower(address.Address), nil
}

func validateName(raw string) (string, error) {
	name := strings.TrimSpace(raw)
	if len(name) == 0 || len([]rune(name)) > 120 {
		return "", errors.New("el nombre debe tener entre 1 y 120 caracteres")
	}
	return name, nil
}

func validatePassword(raw string) error {
	if len(raw) < 8 {
		return errors.New("la contraseña debe tener al menos 8 caracteres")
	}
	if len(raw) > 200 {
		return errors.New("la contraseña es demasiado larga")
	}
	return nil
}

func validateTitle(raw string, max int, label string) (string, error) {
	title := strings.TrimSpace(raw)
	if len(title) == 0 {
		return "", fmt.Errorf("el título de %s no puede estar vacío", label)
	}
	if len([]rune(title)) > max {
		return "", fmt.Errorf("el título de %s no puede superar %d caracteres", label, max)
	}
	return title, nil
}

func validateDescription(raw string) (string, error) {
	if len([]rune(raw)) > 10000 {
		return "", errors.New("la descripción no puede superar 10000 caracteres")
	}
	return raw, nil
}

func validUUID(raw string) bool {
	_, err := uuid.Parse(strings.TrimSpace(raw))
	return err == nil
}

func parseRole(raw string) (model.Role, error) {
	role := model.Role(strings.TrimSpace(raw))
	if !model.ValidRole(role) {
		return "", errors.New("el rol debe ser admin, editor o viewer")
	}
	return role, nil
}
