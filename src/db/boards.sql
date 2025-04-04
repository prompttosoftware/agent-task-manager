-- Define schema for Boards table
CREATE TABLE boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_name TEXT NOT NULL,
    board_type TEXT
);
