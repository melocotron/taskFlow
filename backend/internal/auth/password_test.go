package auth

import (
	"strings"
	"testing"
)

func TestHashPasswordRoundTrip(t *testing.T) {
	hash, err := HashPassword("secreto-largo")
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	if !strings.HasPrefix(hash, "$argon2id$") {
		t.Fatalf("formato inesperado: %s", hash)
	}

	valid, err := VerifyPassword("secreto-largo", hash)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if !valid {
		t.Fatal("la contraseña correcta no fue aceptada")
	}

	invalid, err := VerifyPassword("otra-contraseña", hash)
	if err != nil {
		t.Fatalf("verify incorrecta: %v", err)
	}
	if invalid {
		t.Fatal("una contraseña incorrecta fue aceptada")
	}
}

func TestHashPasswordUsesDifferentSalts(t *testing.T) {
	first, err := HashPassword("secreto-largo")
	if err != nil {
		t.Fatal(err)
	}
	second, err := HashPassword("secreto-largo")
	if err != nil {
		t.Fatal(err)
	}
	if first == second {
		t.Fatal("dos hashes de la misma contraseña no deben coincidir")
	}
}

func TestVerifyPasswordRejectsMalformedHash(t *testing.T) {
	for _, hash := range []string{"", "texto", "$argon2id$v=19$m=65536,t=3,p=2$abc"} {
		if _, err := VerifyPassword("secreto", hash); err == nil {
			t.Fatalf("se esperaba error para %q", hash)
		}
	}
}

func TestSessionTokenIsOpaqueAndHashed(t *testing.T) {
	token, hash, err := NewSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if token == "" || len(hash) != 32 {
		t.Fatalf("token/hash inesperados: %q %d", token, len(hash))
	}
	if string(hash) == token {
		t.Fatal("el hash no debe ser el token en claro")
	}
	if string(HashToken(token)) != string(hash) {
		t.Fatal("HashToken no coincide con el hash generado")
	}

	other, _, err := NewSessionToken()
	if err != nil {
		t.Fatal(err)
	}
	if other == token {
		t.Fatal("dos sesiones no deben compartir token")
	}
}
