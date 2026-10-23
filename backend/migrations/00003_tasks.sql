-- +goose Up
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 240),
    description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 10000),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tasks_board_column_position_idx ON tasks(board_id, column_id, position);
CREATE INDEX tasks_assignee_idx ON tasks(assignee_id);

-- +goose Down
DROP TABLE IF EXISTS tasks;
