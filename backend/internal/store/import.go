package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type LocalBoardInput struct {
	ID       string
	Title    string
	Archived bool
	Columns  []LocalColumnInput
}

type LocalColumnInput struct {
	ID    string
	Title string
}

type LocalTaskInput struct {
	BoardID     string
	ColumnID    string
	Title       string
	Description string
	Position    int
}

type ImportResult struct {
	ImportedBoards int
	SkippedBoards  int
	ImportedTasks  int
	SkippedTasks   int
}

// ImportLocal conserva el trabajo de la versión 1.0. La identidad del tablero local
// (`legacy_id`) hace que una segunda importación no duplique tableros; si un tablero
// ya existe, sus tarjetas también se omiten.
func (s *Store) ImportLocal(ctx context.Context, userID string, boards []LocalBoardInput, tasks []LocalTaskInput) (ImportResult, error) {
	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return ImportResult{}, fmt.Errorf("iniciar importación: %w", err)
	}
	defer tx.Rollback(ctx)

	var result ImportResult
	boardIDs := make(map[string]string)
	columnIDs := make(map[string]map[string]string)

	for _, board := range boards {
		title := strings.TrimSpace(board.Title)
		legacyID := strings.TrimSpace(board.ID)
		validColumns := make([]LocalColumnInput, 0, len(board.Columns))
		for _, column := range board.Columns {
			columnTitle := strings.TrimSpace(column.Title)
			columnID := strings.TrimSpace(column.ID)
			if columnID == "" || columnTitle == "" || utf8.RuneCountInString(columnTitle) > 120 {
				continue
			}
			validColumns = append(validColumns, LocalColumnInput{ID: columnID, Title: columnTitle})
		}
		if legacyID == "" || title == "" || utf8.RuneCountInString(title) > 160 || len(validColumns) == 0 {
			result.SkippedBoards++
			continue
		}

		var existingID string
		err := tx.QueryRow(ctx, `
			SELECT id FROM boards WHERE created_by = $1 AND legacy_id = $2
		`, userID, legacyID).Scan(&existingID)
		if err == nil {
			result.SkippedBoards++
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return ImportResult{}, fmt.Errorf("buscar tablero importado: %w", err)
		}

		newBoardID := uuid.NewString()
		if _, err := tx.Exec(ctx, `
			INSERT INTO boards (id, title, archived, created_by, legacy_id)
			VALUES ($1, $2, $3, $4, $5)
		`, newBoardID, title, board.Archived, userID, legacyID); err != nil {
			return ImportResult{}, fmt.Errorf("importar tablero: %w", err)
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO board_members (board_id, user_id, role)
			VALUES ($1, $2, 'admin')
		`, newBoardID, userID); err != nil {
			return ImportResult{}, fmt.Errorf("importar membresía: %w", err)
		}

		columnIDs[legacyID] = make(map[string]string, len(validColumns))
		for position, column := range validColumns {
			newColumnID := uuid.NewString()
			if _, err := tx.Exec(ctx, `
				INSERT INTO board_columns (id, board_id, title, position)
				VALUES ($1, $2, $3, $4)
			`, newColumnID, newBoardID, column.Title, position); err != nil {
				return ImportResult{}, fmt.Errorf("importar columna: %w", err)
			}
			columnIDs[legacyID][column.ID] = newColumnID
		}

		boardIDs[legacyID] = newBoardID
		result.ImportedBoards++
	}

	for _, task := range tasks {
		newBoardID, ok := boardIDs[strings.TrimSpace(task.BoardID)]
		if !ok {
			result.SkippedTasks++
			continue
		}
		mappedColumns, ok := columnIDs[strings.TrimSpace(task.BoardID)]
		if !ok {
			result.SkippedTasks++
			continue
		}
		newColumnID, ok := mappedColumns[strings.TrimSpace(task.ColumnID)]
		if !ok {
			result.SkippedTasks++
			continue
		}

		title := strings.TrimSpace(task.Title)
		if title == "" || utf8.RuneCountInString(title) > 240 || utf8.RuneCountInString(task.Description) > 10000 {
			result.SkippedTasks++
			continue
		}
		position := task.Position
		if position < 0 {
			position = 0
		}

		if _, err := tx.Exec(ctx, `
			INSERT INTO tasks (id, board_id, column_id, title, description, position)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, uuid.NewString(), newBoardID, newColumnID, title, task.Description, position); err != nil {
			return ImportResult{}, fmt.Errorf("importar tarjeta: %w", err)
		}
		result.ImportedTasks++
	}

	if err := tx.Commit(ctx); err != nil {
		return ImportResult{}, fmt.Errorf("confirmar importación: %w", err)
	}
	return result, nil
}
