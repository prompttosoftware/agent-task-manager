-- Define the schema for the Attachments table
CREATE TABLE Attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES Issues(id)
);
