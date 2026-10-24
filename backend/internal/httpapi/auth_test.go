package httpapi_test

import (
	"context"
	"net/http"
	"testing"
	"time"

	"github.com/melocotron/taskflow/backend/internal/auth"
	"github.com/melocotron/taskflow/backend/internal/testutil"
)

type userPayload struct {
	ID     string `json:"id"`
	Nombre string `json:"nombre"`
	Email  string `json:"email"`
}

type errorPayload struct {
	Error struct {
		Codigo  string `json:"codigo"`
		Mensaje string `json:"mensaje"`
	} `json:"error"`
}

func TestAuthFlow(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	base := server.URL + "/api/v1"

	registered := testutil.JSON(t, client, http.MethodPost, base+"/auth/register", map[string]string{
		"nombre":   "Marta Ruiz",
		"email":    "Marta@Example.com",
		"password": "secreto-largo",
	})
	if registered.Status != http.StatusCreated {
		t.Fatalf("registro: estado %d, cuerpo %s", registered.Status, registered.Body)
	}
	var user userPayload
	testutil.Decode(t, registered, &user)
	if user.ID == "" || user.Email != "marta@example.com" {
		t.Fatalf("usuario inesperado: %+v", user)
	}

	me := testutil.JSON(t, client, http.MethodGet, base+"/me", nil)
	if me.Status != http.StatusOK {
		t.Fatalf("me tras registro: %d %s", me.Status, me.Body)
	}

	duplicate := testutil.JSON(t, client, http.MethodPost, base+"/auth/register", map[string]string{
		"nombre":   "Otra Marta",
		"email":    "marta@example.com",
		"password": "otro-secreto",
	})
	if duplicate.Status != http.StatusConflict {
		t.Fatalf("email duplicado: %d %s", duplicate.Status, duplicate.Body)
	}

	logout := testutil.JSON(t, client, http.MethodPost, base+"/auth/logout", nil)
	if logout.Status != http.StatusNoContent {
		t.Fatalf("logout: %d %s", logout.Status, logout.Body)
	}

	afterLogout := testutil.JSON(t, client, http.MethodGet, base+"/me", nil)
	if afterLogout.Status != http.StatusUnauthorized {
		t.Fatalf("me tras logout: %d %s", afterLogout.Status, afterLogout.Body)
	}

	login := testutil.JSON(t, client, http.MethodPost, base+"/auth/login", map[string]string{
		"email":    "MARTA@example.com",
		"password": "secreto-largo",
	})
	if login.Status != http.StatusOK {
		t.Fatalf("login: %d %s", login.Status, login.Body)
	}

	wrongPassword := testutil.JSON(t, client, http.MethodPost, base+"/auth/login", map[string]string{
		"email":    "marta@example.com",
		"password": "incorrecta",
	})
	if wrongPassword.Status != http.StatusUnauthorized {
		t.Fatalf("password incorrecta: %d %s", wrongPassword.Status, wrongPassword.Body)
	}
}

func TestAuthRejectsInvalidInput(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	base := server.URL + "/api/v1"

	cases := []struct {
		name string
		body map[string]string
	}{
		{"email inválido", map[string]string{"nombre": "Marta", "email": "no-es-email", "password": "secreto-largo"}},
		{"password corta", map[string]string{"nombre": "Marta", "email": "marta@example.com", "password": "corta"}},
		{"nombre vacío", map[string]string{"nombre": "  ", "email": "marta@example.com", "password": "secreto-largo"}},
	}
	for _, testCase := range cases {
		t.Run(testCase.name, func(t *testing.T) {
			result := testutil.JSON(t, client, http.MethodPost, base+"/auth/register", testCase.body)
			if result.Status != http.StatusUnprocessableEntity {
				t.Fatalf("estado %d, cuerpo %s", result.Status, result.Body)
			}
			var payload errorPayload
			testutil.Decode(t, result, &payload)
			if payload.Error.Codigo == "" || payload.Error.Mensaje == "" {
				t.Fatalf("error sin forma estable: %s", result.Body)
			}
		})
	}
}

func TestAuthRejectsExpiredSession(t *testing.T) {
	st := testutil.NewStore(t)
	server, client := testutil.NewServer(t, st)
	base := server.URL + "/api/v1"

	registered := testutil.JSON(t, client, http.MethodPost, base+"/auth/register", map[string]string{
		"nombre":   "Sesión caducada",
		"email":    "caducada@example.com",
		"password": "secreto-largo",
	})
	var user userPayload
	testutil.Decode(t, registered, &user)

	if err := st.CreateSession(context.Background(), user.ID, auth.HashToken("expirada"), time.Now().Add(-time.Hour)); err != nil {
		t.Fatalf("crear sesión caducada: %v", err)
	}

	request, err := http.NewRequest(http.MethodGet, base+"/me", nil)
	if err != nil {
		t.Fatal(err)
	}
	request.AddCookie(&http.Cookie{Name: testutil.TestCookieName, Value: "expirada"})
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusUnauthorized {
		t.Fatalf("sesión caducada: %d", response.StatusCode)
	}
}

func TestAuthRejectsInvalidSessionCookie(t *testing.T) {
	st := testutil.NewStore(t)
	server, _ := testutil.NewServer(t, st)

	request, err := http.NewRequest(http.MethodGet, server.URL+"/api/v1/me", nil)
	if err != nil {
		t.Fatal(err)
	}
	request.AddCookie(&http.Cookie{Name: testutil.TestCookieName, Value: "token-que-no-existe"})
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusUnauthorized {
		t.Fatalf("cookie inválida: %d", response.StatusCode)
	}
}

func TestAuthRejectsUnknownOrigin(t *testing.T) {
	st := testutil.NewStore(t)
	server, _ := testutil.NewServer(t, st)

	request, err := http.NewRequest(http.MethodPost, server.URL+"/api/v1/auth/login", nil)
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Origin", "https://sitio-malicioso.example")
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusForbidden {
		t.Fatalf("origen ajeno: %d", response.StatusCode)
	}
}
