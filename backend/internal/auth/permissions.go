package auth

import "github.com/melocotron/taskflow/backend/internal/model"

type Action string

const (
	ActionView    Action = "ver"
	ActionEdit    Action = "editar"
	ActionManage  Action = "administrar"
	ActionArchive Action = "archivar"
)

// Can es la única tabla de permisos de tablero. Los handlers consultan esta función;
// la interfaz no decide nada por su cuenta.
func Can(role model.Role, action Action) bool {
	switch role {
	case model.RoleAdmin:
		return true
	case model.RoleEditor:
		return action == ActionView || action == ActionEdit
	case model.RoleViewer:
		return action == ActionView
	default:
		return false
	}
}
