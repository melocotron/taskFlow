package model

import "time"

type Role string

const (
	RoleAdmin  Role = "admin"
	RoleEditor Role = "editor"
	RoleViewer Role = "viewer"
)

func ValidRole(role Role) bool {
	return role == RoleAdmin || role == RoleEditor || role == RoleViewer
}

type User struct {
	ID           string
	Name         string
	Email        string
	PasswordHash string
	CreatedAt    time.Time
}

type Session struct {
	ID        string
	UserID    string
	TokenHash []byte
	ExpiresAt time.Time
	CreatedAt time.Time
}

type Board struct {
	ID        string
	Title     string
	Archived  bool
	CreatedBy string
	LegacyID  *string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type BoardSummary struct {
	Board
	Role         Role
	TotalColumns int
	TotalTasks   int
}

type BoardMember struct {
	UserID    string
	Name      string
	Email     string
	Role      Role
	CreatedAt time.Time
}

type Column struct {
	ID        string
	BoardID   string
	Title     string
	Position  int
	CreatedAt time.Time
}

type Task struct {
	ID           string
	BoardID      string
	ColumnID     string
	Title        string
	Description  string
	AssigneeID   *string
	AssigneeName *string
	Position     int
	Version      int
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
