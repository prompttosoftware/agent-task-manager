-- Define the schema for the Epics table
CREATE TABLE IF NOT EXISTS epics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    epic_key TEXT UNIQUE NOT NULL,
    epic_name TEXT NOT NULL,
    epic_description TEXT
);
