package httpapi

import (
	"time"

	"github.com/melocotron/taskflow/backend/internal/model"
	"github.com/melocotron/taskflow/backend/internal/store"
)

type boardSnapshot = store.BoardSnapshot

type userResponse struct {
	ID       string `json:"id"`
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	CreadoEn string `json:"creadoEn"`
}

type boardSummaryResponse struct {
	ID            string `json:"id"`
	Titulo        string `json:"titulo"`
	Archivado     bool   `json:"archivado"`
	Rol           string `json:"rol"`
	CreadoEn      string `json:"creadoEn"`
	TotalColumnas int    `json:"totalColumnas"`
	TotalTarjetas int    `json:"totalTarjetas"`
}

type boardDetailResponse struct {
	ID            string           `json:"id"`
	Titulo        string           `json:"titulo"`
	Archivado     bool             `json:"archivado"`
	Rol           string           `json:"rol"`
	CreadoEn      string           `json:"creadoEn"`
	ActualizadoEn string           `json:"actualizadoEn"`
	Columnas      []columnResponse `json:"columnas"`
	Miembros      []memberResponse `json:"miembros"`
	Tareas        []taskResponse   `json:"tareas"`
}

type columnResponse struct {
	ID       string `json:"id"`
	Titulo   string `json:"titulo"`
	Posicion int    `json:"posicion"`
}

type memberResponse struct {
	MemberID string `json:"memberId"`
	Nombre   string `json:"nombre"`
	Email    string `json:"email"`
	Rol      string `json:"rol"`
}

type taskResponse struct {
	ID                string  `json:"id"`
	BoardID           string  `json:"boardId"`
	ColumnaID         string  `json:"columnaId"`
	Titulo            string  `json:"titulo"`
	Descripcion       string  `json:"descripcion"`
	ResponsableID     *string `json:"responsableId"`
	ResponsableNombre *string `json:"responsableNombre"`
	Posicion          int     `json:"posicion"`
	Version           int     `json:"version"`
	CreadoEn          string  `json:"creadoEn"`
	ActualizadoEn     string  `json:"actualizadoEn"`
}

func formatTime(value time.Time) string {
	return value.UTC().Format(time.RFC3339)
}

func toUser(u model.User) userResponse {
	return userResponse{
		ID:       u.ID,
		Nombre:   u.Name,
		Email:    u.Email,
		CreadoEn: formatTime(u.CreatedAt),
	}
}

func toBoardSummary(b model.BoardSummary) boardSummaryResponse {
	return boardSummaryResponse{
		ID:            b.ID,
		Titulo:        b.Title,
		Archivado:     b.Archived,
		Rol:           string(b.Role),
		CreadoEn:      formatTime(b.CreatedAt),
		TotalColumnas: b.TotalColumns,
		TotalTarjetas: b.TotalTasks,
	}
}

func toBoardDetail(snapshot boardSnapshot) boardDetailResponse {
	columns := make([]columnResponse, 0, len(snapshot.Columns))
	for _, column := range snapshot.Columns {
		columns = append(columns, columnResponse{
			ID:       column.ID,
			Titulo:   column.Title,
			Posicion: column.Position,
		})
	}

	members := make([]memberResponse, 0, len(snapshot.Members))
	for _, member := range snapshot.Members {
		members = append(members, memberResponse{
			MemberID: member.UserID,
			Nombre:   member.Name,
			Email:    member.Email,
			Rol:      string(member.Role),
		})
	}

	tasks := make([]taskResponse, 0, len(snapshot.Tasks))
	for _, task := range snapshot.Tasks {
		tasks = append(tasks, toTask(task))
	}

	return boardDetailResponse{
		ID:            snapshot.Board.ID,
		Titulo:        snapshot.Board.Title,
		Archivado:     snapshot.Board.Archived,
		Rol:           string(snapshot.Role),
		CreadoEn:      formatTime(snapshot.Board.CreatedAt),
		ActualizadoEn: formatTime(snapshot.Board.UpdatedAt),
		Columnas:      columns,
		Miembros:      members,
		Tareas:        tasks,
	}
}

func toTask(task model.Task) taskResponse {
	return taskResponse{
		ID:                task.ID,
		BoardID:           task.BoardID,
		ColumnaID:         task.ColumnID,
		Titulo:            task.Title,
		Descripcion:       task.Description,
		ResponsableID:     task.AssigneeID,
		ResponsableNombre: task.AssigneeName,
		Posicion:          task.Position,
		Version:           task.Version,
		CreadoEn:          formatTime(task.CreatedAt),
		ActualizadoEn:     formatTime(task.UpdatedAt),
	}
}
