package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/melocotron/taskflow/backend/internal/model"
)

func (s *Store) CreateUser(ctx context.Context, name, email, passwordHash string) (model.User, error) {
	id := uuid.NewString()

	var user model.User
	err := s.Pool.QueryRow(ctx, `
		INSERT INTO users (id, name, email, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, name, email, password_hash, created_at
	`, id, name, email, passwordHash).Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.CreatedAt,
	)
	if isUniqueViolation(err) {
		return model.User{}, ErrConflict
	}
	if err != nil {
		return model.User{}, fmt.Errorf("crear usuario: %w", err)
	}

	return user, nil
}

func (s *Store) UserByEmail(ctx context.Context, email string) (model.User, error) {
	var user model.User
	err := s.Pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, created_at
		FROM users
		WHERE email = $1
	`, email).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.User{}, ErrNotFound
	}
	if err != nil {
		return model.User{}, fmt.Errorf("buscar usuario por email: %w", err)
	}

	return user, nil
}

func (s *Store) UserByID(ctx context.Context, id string) (model.User, error) {
	var user model.User
	err := s.Pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, created_at
		FROM users
		WHERE id = $1
	`, id).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.User{}, ErrNotFound
	}
	if err != nil {
		return model.User{}, fmt.Errorf("buscar usuario: %w", err)
	}

	return user, nil
}
