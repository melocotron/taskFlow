package testutil

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/melocotron/taskflow/backend/internal/config"
	"github.com/melocotron/taskflow/backend/internal/httpapi"
	"github.com/melocotron/taskflow/backend/internal/store"
)

const TestCookieName = "taskflow_test_session"

func NewServer(t *testing.T, st *store.Store) (*httptest.Server, *http.Client) {
	t.Helper()

	cfg := config.Config{
		DatabaseURL:    "test",
		HTTPAddr:       ":0",
		AppEnv:         "test",
		CookieSecure:   false,
		CookieName:     TestCookieName,
		SessionTTL:     time.Hour,
		AllowedOrigins: []string{"http://localhost:4200"},
		MaxBodyBytes:   1 << 20,
	}

	logger := slog.New(slog.NewTextHandler(testWriter{t}, &slog.HandlerOptions{Level: slog.LevelError}))
	server := httptest.NewServer(httpapi.NewRouter(cfg, st, logger))
	t.Cleanup(server.Close)

	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatalf("crear cookie jar: %v", err)
	}
	client := &http.Client{Jar: jar, Timeout: 10 * time.Second}
	return server, client
}

type testWriter struct {
	t *testing.T
}

func (w testWriter) Write(data []byte) (int, error) {
	w.t.Log(string(bytes.TrimSpace(data)))
	return len(data), nil
}

type response struct {
	Status int
	Body   []byte
}

func JSON(t *testing.T, client *http.Client, method, url string, body any) response {
	t.Helper()

	var reader *bytes.Reader
	if body == nil {
		reader = bytes.NewReader(nil)
	} else {
		encoded, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("serializar cuerpo: %v", err)
		}
		reader = bytes.NewReader(encoded)
	}

	request, err := http.NewRequest(method, url, reader)
	if err != nil {
		t.Fatalf("crear petición: %v", err)
	}
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}

	httpResponse, err := client.Do(request)
	if err != nil {
		t.Fatalf("ejecutar petición: %v", err)
	}
	defer httpResponse.Body.Close()

	buffer := new(bytes.Buffer)
	if _, err := buffer.ReadFrom(httpResponse.Body); err != nil {
		t.Fatalf("leer respuesta: %v", err)
	}

	return response{Status: httpResponse.StatusCode, Body: buffer.Bytes()}
}

func Decode(t *testing.T, r response, target any) {
	t.Helper()
	if err := json.Unmarshal(r.Body, target); err != nil {
		t.Fatalf("decodificar respuesta %d (%s): %v", r.Status, string(r.Body), err)
	}
}
