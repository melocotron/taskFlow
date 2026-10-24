package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
)

const sessionTokenBytes = 32

// NewSessionToken genera un token opaco para la cookie y el hash que se guarda en
// la base de datos. El token en claro nunca se persiste.
func NewSessionToken() (string, []byte, error) {
	raw := make([]byte, sessionTokenBytes)
	if _, err := rand.Read(raw); err != nil {
		return "", nil, err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	return token, HashToken(token), nil
}

func HashToken(token string) []byte {
	sum := sha256.Sum256([]byte(token))
	return sum[:]
}

func randomRead(buffer []byte) (int, error) {
	return rand.Read(buffer)
}
