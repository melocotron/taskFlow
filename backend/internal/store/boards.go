package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/melocotron/taskflow/backend/internal/model"
)

type BoardSnapshot struct {
	Board   model.Board
	Role    model.Role
	Columns []model.Column
	Members []model.BoardMember
	Tasks   []model.Task
}

type querier interface {
	QueryRow(context.Context, string, ...any) pgx.Row
	Query(context.Context, string, ...any) (pgx.Rows, error)
}

func (s *Store) CreateBoard(ctx context.Context, userID, title string, legacyID *string) (model.Board, []model.Column, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return model.Board{}, nil, fmt.Errorf("iniciar creación de tablero: %w", err)
	}
	defer tx.Rollback(ctx)

	boardID := uuid.NewString()
	var board model.Board
	err = tx.QueryRow(ctx, `
		INSERT INTO boards (id, title, created_by, legacy_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, title, archived, created_by, legacy_id, created_at, updated_at
	`, boardID, title, userID, legacyID).Scan(
		&board.ID, &board.Title, &board.Archived, &board.CreatedBy, &board.LegacyID,
		&board.CreatedAt, &board.UpdatedAt,
	)
	if isUniqueViolation(err) {
		return model.Board{}, nil, ErrConflict
	}
	if err != nil {
		return model.Board{}, nil, fmt.Errorf("crear tablero: %w", err)
	}

	columns := make([]model.Column, 0, 3)
	for position, columnTitle := range []string{"Por hacer", "En curso", "Hecho"} {
		column := model.Column{
			ID:       uuid.NewString(),
			BoardID:  board.ID,
			Title:    columnTitle,
			Position: position,
		}
		err = tx.QueryRow(ctx, `
			INSERT INTO board_columns (id, board_id, title, position)
			VALUES ($1, $2, $3, $4)
			RETURNING created_at
		`, column.ID, column.BoardID, column.Title, column.Position).Scan(&column.CreatedAt)
		if err != nil {
			return model.Board{}, nil, fmt.Errorf("crear columna inicial: %w", err)
		}
		columns = append(columns, column)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO board_members (board_id, user_id, role)
		VALUES ($1, $2, 'admin')
	`, board.ID, userID)
	if err != nil {
		return model.Board{}, nil, fmt.Errorf("crear membresía inicial: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return model.Board{}, nil, fmt.Errorf("confirmar tablero: %w", err)
	}

	return board, columns, nil
}

func (s *Store) ListBoards(ctx context.Context, userID string, includeArchived bool) ([]model.BoardSummary, error) {
	rows, err := s.Pool.Query(ctx, `
		SELECT
			b.id, b.title, b.archived, b.created_by, b.legacy_id, b.created_at, b.updated_at,
			bm.role,
			(SELECT count(*) FROM board_columns c WHERE c.board_id = b.id),
			(SELECT count(*) FROM tasks t WHERE t.board_id = b.id)
		FROM boards b
		JOIN board_members bm ON bm.board_id = b.id
		WHERE bm.user_id = $1 AND ($2 OR b.archived = false)
		ORDER BY b.updated_at DESC, b.created_at DESC
	`, userID, includeArchived)
	if err != nil {
		return nil, fmt.Errorf("listar tableros: %w", err)
	}
	defer rows.Close()

	boards := make([]model.BoardSummary, 0)
	for rows.Next() {
		var summary model.BoardSummary
		if err := rows.Scan(
			&summary.ID, &summary.Title, &summary.Archived, &summary.CreatedBy, &summary.LegacyID,
			&summary.CreatedAt, &summary.UpdatedAt, &summary.Role, &summary.TotalColumns, &summary.TotalTasks,
		); err != nil {
			return nil, fmt.Errorf("leer tablero: %w", err)
		}
		boards = append(boards, summary)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer tableros: %w", err)
	}

	return boards, nil
}

func (s *Store) BoardSnapshot(ctx context.Context, boardID, userID string) (BoardSnapshot, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return BoardSnapshot{}, fmt.Errorf("iniciar lectura de tablero: %w", err)
	}
	defer tx.Rollback(ctx)

	var snapshot BoardSnapshot
	err = tx.QueryRow(ctx, `
		SELECT b.id, b.title, b.archived, b.created_by, b.legacy_id, b.created_at, b.updated_at, bm.role
		FROM boards b
		JOIN board_members bm ON bm.board_id = b.id
		WHERE b.id = $1 AND bm.user_id = $2
	`, boardID, userID).Scan(
		&snapshot.Board.ID, &snapshot.Board.Title, &snapshot.Board.Archived, &snapshot.Board.CreatedBy,
		&snapshot.Board.LegacyID, &snapshot.Board.CreatedAt, &snapshot.Board.UpdatedAt, &snapshot.Role,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return BoardSnapshot{}, ErrNotFound
	}
	if err != nil {
		return BoardSnapshot{}, fmt.Errorf("leer tablero: %w", err)
	}

	snapshot.Columns, err = listColumns(ctx, tx, boardID)
	if err != nil {
		return BoardSnapshot{}, err
	}
	snapshot.Members, err = listMembers(ctx, tx, boardID)
	if err != nil {
		return BoardSnapshot{}, err
	}
	snapshot.Tasks, err = listTasks(ctx, tx, boardID)
	if err != nil {
		return BoardSnapshot{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return BoardSnapshot{}, fmt.Errorf("confirmar lectura de tablero: %w", err)
	}
	return snapshot, nil
}

func (s *Store) UpdateBoard(ctx context.Context, boardID, userID string, title *string, archived *bool) error {
	role, err := boardRole(ctx, s.Pool, boardID, userID)
	if err != nil {
		return err
	}
	if title != nil && !canEdit(role) {
		return ErrForbidden
	}
	if archived != nil && role != model.RoleAdmin {
		return ErrForbidden
	}

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("iniciar actualización de tablero: %w", err)
	}
	defer tx.Rollback(ctx)

	if title != nil {
		if _, err := tx.Exec(ctx, `
			UPDATE boards SET title = $1, updated_at = now() WHERE id = $2
		`, *title, boardID); err != nil {
			return fmt.Errorf("actualizar título: %w", err)
		}
	}
	if archived != nil {
		if _, err := tx.Exec(ctx, `
			UPDATE boards SET archived = $1, updated_at = now() WHERE id = $2
		`, *archived, boardID); err != nil {
			return fmt.Errorf("archivar tablero: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("confirmar actualización: %w", err)
	}
	return nil
}

func (s *Store) AddMember(ctx context.Context, boardID, adminID, email string, role model.Role) (model.BoardMember, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return model.BoardMember{}, fmt.Errorf("iniciar alta de miembro: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := requireRole(ctx, tx, boardID, adminID, model.RoleAdmin); err != nil {
		return model.BoardMember{}, err
	}

	var user model.User
	err = tx.QueryRow(ctx, `
		SELECT id, name, email, created_at FROM users WHERE email = $1
	`, email).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.BoardMember{}, ErrNotFound
	}
	if err != nil {
		return model.BoardMember{}, fmt.Errorf("buscar cuenta para invitar: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO board_members (board_id, user_id, role)
		VALUES ($1, $2, $3)
	`, boardID, user.ID, role)
	if isUniqueViolation(err) {
		return model.BoardMember{}, ErrConflict
	}
	if err != nil {
		return model.BoardMember{}, fmt.Errorf("añadir miembro: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return model.BoardMember{}, fmt.Errorf("confirmar alta de miembro: %w", err)
	}

	return model.BoardMember{UserID: user.ID, Name: user.Name, Email: user.Email, Role: role}, nil
}

func (s *Store) UpdateMemberRole(ctx context.Context, boardID, adminID, targetID string, role model.Role) (model.BoardMember, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return model.BoardMember{}, fmt.Errorf("iniciar cambio de rol: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := requireRole(ctx, tx, boardID, adminID, model.RoleAdmin); err != nil {
		return model.BoardMember{}, err
	}

	var currentRole model.Role
	err = tx.QueryRow(ctx, `
		SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2 FOR UPDATE
	`, boardID, targetID).Scan(&currentRole)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.BoardMember{}, ErrNotFound
	}
	if err != nil {
		return model.BoardMember{}, fmt.Errorf("leer rol actual: %w", err)
	}

	if currentRole == model.RoleAdmin && role != model.RoleAdmin {
		if err := ensureAnotherAdmin(ctx, tx, boardID, targetID); err != nil {
			return model.BoardMember{}, err
		}
	}

	var member model.BoardMember
	err = tx.QueryRow(ctx, `
		UPDATE board_members bm
		SET role = $1
		FROM users u
		WHERE bm.board_id = $2 AND bm.user_id = $3 AND u.id = bm.user_id
		RETURNING bm.user_id, u.name, u.email, bm.role
	`, role, boardID, targetID).Scan(&member.UserID, &member.Name, &member.Email, &member.Role)
	if err != nil {
		return model.BoardMember{}, fmt.Errorf("actualizar rol: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return model.BoardMember{}, fmt.Errorf("confirmar cambio de rol: %w", err)
	}
	return member, nil
}

func (s *Store) RemoveMember(ctx context.Context, boardID, adminID, targetID string) error {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("iniciar baja de miembro: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := requireRole(ctx, tx, boardID, adminID, model.RoleAdmin); err != nil {
		return err
	}

	var role model.Role
	err = tx.QueryRow(ctx, `
		SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2 FOR UPDATE
	`, boardID, targetID).Scan(&role)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("leer rol a eliminar: %w", err)
	}

	if role == model.RoleAdmin {
		if err := ensureAnotherAdmin(ctx, tx, boardID, targetID); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(ctx, `
		DELETE FROM board_members WHERE board_id = $1 AND user_id = $2
	`, boardID, targetID); err != nil {
		return fmt.Errorf("eliminar miembro: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("confirmar baja de miembro: %w", err)
	}
	return nil
}

func listColumns(ctx context.Context, q querier, boardID string) ([]model.Column, error) {
	rows, err := q.Query(ctx, `
		SELECT id, board_id, title, position, created_at
		FROM board_columns
		WHERE board_id = $1
		ORDER BY position, created_at
	`, boardID)
	if err != nil {
		return nil, fmt.Errorf("listar columnas: %w", err)
	}
	defer rows.Close()

	columns := make([]model.Column, 0)
	for rows.Next() {
		var column model.Column
		if err := rows.Scan(&column.ID, &column.BoardID, &column.Title, &column.Position, &column.CreatedAt); err != nil {
			return nil, fmt.Errorf("leer columna: %w", err)
		}
		columns = append(columns, column)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer columnas: %w", err)
	}
	return columns, nil
}

func listMembers(ctx context.Context, q querier, boardID string) ([]model.BoardMember, error) {
	rows, err := q.Query(ctx, `
		SELECT u.id, u.name, u.email, bm.role, bm.created_at
		FROM board_members bm
		JOIN users u ON u.id = bm.user_id
		WHERE bm.board_id = $1
		ORDER BY bm.created_at, u.name
	`, boardID)
	if err != nil {
		return nil, fmt.Errorf("listar miembros: %w", err)
	}
	defer rows.Close()

	members := make([]model.BoardMember, 0)
	for rows.Next() {
		var member model.BoardMember
		if err := rows.Scan(&member.UserID, &member.Name, &member.Email, &member.Role, &member.CreatedAt); err != nil {
			return nil, fmt.Errorf("leer miembro: %w", err)
		}
		members = append(members, member)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer miembros: %w", err)
	}
	return members, nil
}

func listTasks(ctx context.Context, q querier, boardID string) ([]model.Task, error) {
	rows, err := q.Query(ctx, `
		SELECT t.id, t.board_id, t.column_id, t.title, t.description,
		       t.assignee_id, u.name, t.position, t.version, t.created_at, t.updated_at
		FROM tasks t
		JOIN board_columns c ON c.id = t.column_id
		LEFT JOIN users u ON u.id = t.assignee_id
		WHERE t.board_id = $1
		ORDER BY c.position, t.position, t.created_at
	`, boardID)
	if err != nil {
		return nil, fmt.Errorf("listar tarjetas: %w", err)
	}
	defer rows.Close()

	tasks := make([]model.Task, 0)
	for rows.Next() {
		var task model.Task
		if err := rows.Scan(
			&task.ID, &task.BoardID, &task.ColumnID, &task.Title, &task.Description,
			&task.AssigneeID, &task.AssigneeName, &task.Position, &task.Version,
			&task.CreatedAt, &task.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("leer tarjeta: %w", err)
		}
		tasks = append(tasks, task)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer tarjetas: %w", err)
	}
	return tasks, nil
}

func boardRole(ctx context.Context, q querier, boardID, userID string) (model.Role, error) {
	var role model.Role
	err := q.QueryRow(ctx, `
		SELECT role FROM board_members WHERE board_id = $1 AND user_id = $2
	`, boardID, userID).Scan(&role)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", fmt.Errorf("leer rol de tablero: %w", err)
	}
	return role, nil
}

func requireRole(ctx context.Context, q querier, boardID, userID string, required model.Role) error {
	role, err := boardRole(ctx, q, boardID, userID)
	if err != nil {
		return err
	}
	if required == model.RoleAdmin && role != model.RoleAdmin {
		return ErrForbidden
	}
	if required == model.RoleEditor && !canEdit(role) {
		return ErrForbidden
	}
	return nil
}

func canEdit(role model.Role) bool {
	return role == model.RoleAdmin || role == model.RoleEditor
}

func ensureAnotherAdmin(ctx context.Context, tx pgx.Tx, boardID, excludedUserID string) error {
	var count int
	if err := tx.QueryRow(ctx, `
		SELECT count(*) FROM board_members
		WHERE board_id = $1 AND role = 'admin' AND user_id <> $2
	`, boardID, excludedUserID).Scan(&count); err != nil {
		return fmt.Errorf("contar administradores: %w", err)
	}
	if count == 0 {
		return ErrLastAdmin
	}
	return nil
}
