package auth

import (
	"testing"

	"github.com/melocotron/taskflow/backend/internal/model"
)

func TestPermissions(t *testing.T) {
	cases := []struct {
		role    model.Role
		action  Action
		allowed bool
	}{
		{model.RoleAdmin, ActionView, true},
		{model.RoleAdmin, ActionEdit, true},
		{model.RoleAdmin, ActionManage, true},
		{model.RoleAdmin, ActionArchive, true},
		{model.RoleEditor, ActionView, true},
		{model.RoleEditor, ActionEdit, true},
		{model.RoleEditor, ActionManage, false},
		{model.RoleEditor, ActionArchive, false},
		{model.RoleViewer, ActionView, true},
		{model.RoleViewer, ActionEdit, false},
		{model.RoleViewer, ActionManage, false},
		{model.Role("desconocido"), ActionView, false},
	}
	for _, testCase := range cases {
		if got := Can(testCase.role, testCase.action); got != testCase.allowed {
			t.Errorf("Can(%q, %q) = %v; se esperaba %v", testCase.role, testCase.action, got, testCase.allowed)
		}
	}
}
