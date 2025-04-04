-- Define the schema for the Issues table
CREATE TABLE Issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_key TEXT UNIQUE NOT NULL,
    issue_type TEXT,
    summary TEXT,
    description TEXT,
    status TEXT,
    assignee_id INTEGER,
    board_id INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (assignee_id) REFERENCES Users(id),
    FOREIGN KEY (board_id) REFERENCES Boards(id)
);
