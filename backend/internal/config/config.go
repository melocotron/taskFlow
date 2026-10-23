package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL    string
	HTTPAddr       string
	AppEnv         string
	CookieSecure   bool
	CookieName     string
	SessionTTL     time.Duration
	AllowedOrigins []string
	MaxBodyBytes   int64
	StaticDir      string
}

func Load() (Config, error) {
	// .env es una comodidad de desarrollo; en producción las variables vienen del
	// proveedor y la ausencia del archivo no es un error. El segundo intento permite
	// ejecutar `go run` desde `backend/` con el `.env` de la raíz.
	if err := godotenv.Load(); err != nil {
		_ = godotenv.Load("../.env")
	}

	appEnv := getenv("APP_ENV", "development")
	cookieName := os.Getenv("COOKIE_NAME")
	if cookieName == "" {
		if appEnv == "production" {
			cookieName = "__Host-taskflow_session"
		} else {
			cookieName = "taskflow_session"
		}
	}

	secureDefault := appEnv == "production"
	secure, err := getbool("COOKIE_SECURE", secureDefault)
	if err != nil {
		return Config{}, err
	}

	ttl, err := time.ParseDuration(getenv("SESSION_TTL", "168h"))
	if err != nil {
		return Config{}, fmt.Errorf("SESSION_TTL inválido: %w", err)
	}

	maxBody, err := strconv.ParseInt(getenv("MAX_BODY_BYTES", "1048576"), 10, 64)
	if err != nil || maxBody <= 0 {
		return Config{}, fmt.Errorf("MAX_BODY_BYTES inválido")
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL es obligatoria")
	}

	return Config{
		DatabaseURL:    databaseURL,
		HTTPAddr:       getenv("HTTP_ADDR", ":8080"),
		AppEnv:         appEnv,
		CookieSecure:   secure,
		CookieName:     cookieName,
		SessionTTL:     ttl,
		AllowedOrigins: splitCSV(getenv("ALLOWED_ORIGINS", "http://localhost:4200")),
		MaxBodyBytes:   maxBody,
		StaticDir:      strings.TrimSpace(os.Getenv("STATIC_DIR")),
	}, nil
}

func getenv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func getbool(key string, fallback bool) (bool, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, fmt.Errorf("%s debe ser true o false: %w", key, err)
	}
	return parsed, nil
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
