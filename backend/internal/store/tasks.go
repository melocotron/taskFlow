package store

import (
	"context"
	"errors"
	"fmt"
	"sort"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/melocotron/taskflow/backend/internal/model"
)

type TaskUpdate struct {
	Title       *string
	Description *string
	AssigneeSet bool
	AssigneeID  *string
	Version     *int
}

func (s *Store) CreateTask(
	ctx context.Context,
	boardID, userID, columnID, title, description string,
	assigneeID *string,
) (model.Task, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return model.Task{}, fmt.Errorf("iniciar creación de tarjeta: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := requireRole(ctx, tx, boardID, userID, model.RoleEditor); err != nil {
		return model.Task{}, err
	}
	if err := ensureColumnInBoard(ctx, tx, boardID, columnID); err != nil {
		return model.Task{}, err
	}
	if err := ensureAssigneeIsMember(ctx, tx, boardID, assigneeID); err != nil {
		return model.Task{}, err
	}

	var position int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(position), -1) + 1 FROM tasks WHERE column_id = $1
	`, columnID).Scan(&position); err != nil {
		return model.Task{}, fmt.Errorf("calcular posición: %w", err)
	}

	id := uuid.NewString()
	var task model.Task
	err = tx.QueryRow(ctx, `
		INSERT INTO tasks (id, board_id, column_id, title, description, assignee_id, position)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, board_id, column_id, title, description, assignee_id, position,
		          version, created_at, updated_at
	`, id, boardID, columnID, title, description, assigneeID, position).Scan(
		&task.ID, &task.BoardID, &task.ColumnID, &task.Title, &task.Description,
		&task.AssigneeID, &task.Position, &task.Version, &task.CreatedAt, &task.UpdatedAt,
	)
	if err != nil {
		return model.Task{}, fmt.Errorf("crear tarjeta: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return model.Task{}, fmt.Errorf("confirmar tarjeta: %w", err)
	}

	task.AssigneeName, err = assigneeName(ctx, s.Pool, task.AssigneeID)
	if err != nil {
		return model.Task{}, err
	}
	return task, nil
}

func (s *Store) TaskForUser(ctx context.Context, taskID, userID string) (model.Task, model.Role, error) {
	var task model.Task
	var role model.Role
	err := s.Pool.QueryRow(ctx, `
		SELECT t.id, t.board_id, t.column_id, t.title, t.description,
		       t.assignee_id, u.name, t.position, t.version, t.created_at, t.updated_at,
		       bm.role
		FROM tasks t
		JOIN board_members bm ON bm.board_id = t.board_id AND bm.user_id = $2
		LEFT JOIN users u ON u.id = t.assignee_id
		WHERE t.id = $1
	`, taskID, userID).Scan(
		&task.ID, &task.BoardID, &task.ColumnID, &task.Title, &task.Description,
		&task.AssigneeID, &task.AssigneeName, &task.Position, &task.Version,
		&task.CreatedAt, &task.UpdatedAt, &role,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Task{}, "", ErrNotFound
	}
	if err != nil {
		return model.Task{}, "", fmt.Errorf("leer tarjeta: %w", err)
	}
	return task, role, nil
}

func (s *Store) UpdateTask(ctx context.Context, taskID, userID string, update TaskUpdate) (model.Task, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return model.Task{}, fmt.Errorf("iniciar edición de tarjeta: %w", err)
	}
	defer tx.Rollback(ctx)

	task, role, err := taskForUpdate(ctx, tx, taskID, userID)
	if err != nil {
		return model.Task{}, err
	}
	if !canEdit(role) {
		return model.Task{}, ErrForbidden
	}
	if update.Version != nil && *update.Version != task.Version {
		return model.Task{}, ErrConflict
	}

	title := task.Title
	if update.Title != nil {
		title = *update.Title
	}
	description := task.Description
	if update.Description != nil {
		description = *update.Description
	}
	assignee := task.AssigneeID
	if update.AssigneeSet {
		assignee = update.AssigneeID
	}
	if err := ensureAssigneeIsMember(ctx, tx, task.BoardID, assignee); err != nil {
		return model.Task{}, err
	}

	err = tx.QueryRow(ctx, `
		UPDATE tasks
		SET title = $1, description = $2, assignee_id = $3,
		    version = version + 1, updated_at = now()
		WHERE id = $4 AND version = $5
		RETURNING id, board_id, column_id, title, description, assignee_id, position,
		          version, created_at, updated_at
	`, title, description, assignee, task.ID, task.Version).Scan(
		&task.ID, &task.BoardID, &task.ColumnID, &task.Title, &task.Description,
		&task.AssigneeID, &task.Position, &task.Version, &task.CreatedAt, &task.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Task{}, ErrConflict
	}
	if err != nil {
		return model.Task{}, fmt.Errorf("actualizar tarjeta: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return model.Task{}, fmt.Errorf("confirmar edición: %w", err)
	}

	task.AssigneeName, err = assigneeName(ctx, s.Pool, task.AssigneeID)
	if err != nil {
		return model.Task{}, err
	}
	return task, nil
}

func (s *Store) DeleteTask(ctx context.Context, taskID, userID string) error {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("iniciar borrado de tarjeta: %w", err)
	}
	defer tx.Rollback(ctx)

	task, role, err := taskForUpdate(ctx, tx, taskID, userID)
	if err != nil {
		return err
	}
	if !canEdit(role) {
		return ErrForbidden
	}

	if _, err := tx.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, task.ID); err != nil {
		return fmt.Errorf("eliminar tarjeta: %w", err)
	}
	if err := renumberColumn(ctx, tx, task.ColumnID); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("confirmar borrado: %w", err)
	}
	return nil
}

func (s *Store) MoveTask(ctx context.Context, taskID, userID, targetColumnID string, targetPosition int, expectedVersion *int) (model.Task, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return model.Task{}, fmt.Errorf("iniciar movimiento: %w", err)
	}
	defer tx.Rollback(ctx)

	task, role, err := taskForUpdate(ctx, tx, taskID, userID)
	if err != nil {
		return model.Task{}, err
	}
	if !canEdit(role) {
		return model.Task{}, ErrForbidden
	}
	if expectedVersion != nil && *expectedVersion != task.Version {
		return model.Task{}, ErrConflict
	}
	if err := ensureColumnInBoard(ctx, tx, task.BoardID, targetColumnID); err != nil {
		return model.Task{}, err
	}

	columns := []string{task.ColumnID}
	if targetColumnID != task.ColumnID {
		columns = append(columns, targetColumnID)
	}
	sort.Strings(columns)

	rows, err := tx.Query(ctx, `
		SELECT id, column_id, position
		FROM tasks
		WHERE column_id = ANY($1)
		ORDER BY column_id, position
		FOR UPDATE
	`, columns)
	if err != nil {
		return model.Task{}, fmt.Errorf("bloquear columnas: %w", err)
	}
	type taskPosition struct {
		id       string
		columnID string
		position int
	}
	all := make([]taskPosition, 0)
	for rows.Next() {
		var item taskPosition
		if err := rows.Scan(&item.id, &item.columnID, &item.position); err != nil {
			rows.Close()
			return model.Task{}, fmt.Errorf("leer posiciones: %w", err)
		}
		all = append(all, item)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return model.Task{}, fmt.Errorf("recorrer posiciones: %w", err)
	}

	source := make([]string, 0)
	target := make([]string, 0)
	for _, item := range all {
		if item.id == task.ID {
			continue
		}
		if item.columnID == task.ColumnID {
			source = append(source, item.id)
		}
		if item.columnID == targetColumnID {
			target = append(target, item.id)
		}
	}

	if task.ColumnID == targetColumnID {
		source = target
	}
	if targetPosition < 0 {
		targetPosition = 0
	}
	if targetPosition > len(target) {
		targetPosition = len(target)
	}
	target = append(target, "")
	copy(target[targetPosition+1:], target[targetPosition:])
	target[targetPosition] = task.ID

	if task.ColumnID != targetColumnID {
		for index, id := range source {
			if _, err := tx.Exec(ctx, `UPDATE tasks SET position = $1 WHERE id = $2`, index, id); err != nil {
				return model.Task{}, fmt.Errorf("renumerar origen: %w", err)
			}
		}
	}
	for index, id := range target {
		if id == task.ID {
			if _, err := tx.Exec(ctx, `
				UPDATE tasks
				SET column_id = $1, position = $2, version = version + 1, updated_at = now()
				WHERE id = $3
			`, targetColumnID, index, id); err != nil {
				return model.Task{}, fmt.Errorf("mover tarjeta: %w", err)
			}
			continue
		}
		if _, err := tx.Exec(ctx, `UPDATE tasks SET position = $1 WHERE id = $2`, index, id); err != nil {
			return model.Task{}, fmt.Errorf("renumerar destino: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return model.Task{}, fmt.Errorf("confirmar movimiento: %w", err)
	}

	return s.taskByID(ctx, task.ID)
}

func (s *Store) taskByID(ctx context.Context, taskID string) (model.Task, error) {
	var task model.Task
	err := s.Pool.QueryRow(ctx, `
		SELECT t.id, t.board_id, t.column_id, t.title, t.description,
		       t.assignee_id, u.name, t.position, t.version, t.created_at, t.updated_at
		FROM tasks t
		LEFT JOIN users u ON u.id = t.assignee_id
		WHERE t.id = $1
	`, taskID).Scan(
		&task.ID, &task.BoardID, &task.ColumnID, &task.Title, &task.Description,
		&task.AssigneeID, &task.AssigneeName, &task.Position, &task.Version,
		&task.CreatedAt, &task.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Task{}, ErrNotFound
	}
	if err != nil {
		return model.Task{}, fmt.Errorf("leer tarjeta: %w", err)
	}
	return task, nil
}

func taskForUpdate(ctx context.Context, tx pgx.Tx, taskID, userID string) (model.Task, model.Role, error) {
	var task model.Task
	var role model.Role
	err := tx.QueryRow(ctx, `
		SELECT t.id, t.board_id, t.column_id, t.title, t.description,
		       t.assignee_id, t.position, t.version, t.created_at, t.updated_at,
		       bm.role
		FROM tasks t
		JOIN board_members bm ON bm.board_id = t.board_id AND bm.user_id = $2
		WHERE t.id = $1
		FOR UPDATE OF t
	`, taskID, userID).Scan(
		&task.ID, &task.BoardID, &task.ColumnID, &task.Title, &task.Description,
		&task.AssigneeID, &task.Position, &task.Version, &task.CreatedAt, &task.UpdatedAt,
		&role,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return model.Task{}, "", ErrNotFound
	}
	if err != nil {
		return model.Task{}, "", fmt.Errorf("bloquear tarjeta: %w", err)
	}
	return task, role, nil
}

func ensureColumnInBoard(ctx context.Context, q querier, boardID, columnID string) error {
	var exists bool
	if err := q.QueryRow(ctx, `
		SELECT EXISTS (SELECT 1 FROM board_columns WHERE id = $1 AND board_id = $2)
	`, columnID, boardID).Scan(&exists); err != nil {
		return fmt.Errorf("comprobar columna: %w", err)
	}
	if !exists {
		return ErrNotFound
	}
	return nil
}

func ensureAssigneeIsMember(ctx context.Context, q querier, boardID string, assigneeID *string) error {
	if assigneeID == nil {
		return nil
	}
	var exists bool
	if err := q.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM board_members WHERE board_id = $1 AND user_id = $2
		)
	`, boardID, *assigneeID).Scan(&exists); err != nil {
		return fmt.Errorf("comprobar responsable: %w", err)
	}
	if !exists {
		return fmt.Errorf("%w: el responsable no pertenece al tablero", ErrForbidden)
	}
	return nil
}

func assigneeName(ctx context.Context, q querier, assigneeID *string) (*string, error) {
	if assigneeID == nil {
		return nil, nil
	}
	var name string
	err := q.QueryRow(ctx, `SELECT name FROM users WHERE id = $1`, *assigneeID).Scan(&name)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("leer responsable: %w", err)
	}
	return &name, nil
}

func renumberColumn(ctx context.Context, tx pgx.Tx, columnID string) error {
	rows, err := tx.Query(ctx, `
		SELECT id FROM tasks WHERE column_id = $1 ORDER BY position, created_at FOR UPDATE
	`, columnID)
	if err != nil {
		return fmt.Errorf("leer columna para renumerar: %w", err)
	}
	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return fmt.Errorf("leer id de tarjeta: %w", err)
		}
		ids = append(ids, id)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return fmt.Errorf("recorrer columna: %w", err)
	}
	for index, id := range ids {
		if _, err := tx.Exec(ctx, `UPDATE tasks SET position = $1 WHERE id = $2`, index, id); err != nil {
			return fmt.Errorf("renumerar columna: %w", err)
		}
	}
	return nil
}
