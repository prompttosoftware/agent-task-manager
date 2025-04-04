-- Create Boards table
CREATE TABLE Boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Create IssueTypes table
CREATE TABLE IssueTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Create Transitions table
CREATE TABLE Transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_board_id INTEGER,
    to_board_id INTEGER,
    FOREIGN KEY (from_board_id) REFERENCES Boards(id),
    FOREIGN KEY (to_board_id) REFERENCES Boards(id)
);

-- Create Issues table
CREATE TABLE Issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary TEXT NOT NULL,
    description TEXT,
    issue_type TEXT,
    board_id INTEGER,
    epic_id INTEGER,
    FOREIGN KEY (issue_type) REFERENCES IssueTypes(name),
    FOREIGN KEY (board_id) REFERENCES Boards(id),
    FOREIGN KEY (epic_id) REFERENCES Epics(id)
);

-- Create IssueLinks table
CREATE TABLE IssueLinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id INTEGER,
    linked_issue_id INTEGER,
    type TEXT,
    FOREIGN KEY (issue_id) REFERENCES Issues(id),
    FOREIGN KEY (linked_issue_id) REFERENCES Issues(id)
);

-- Create Webhooks table
CREATE TABLE Webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    url TEXT NOT NULL,
    createdAt DATETIME,
    updatedAt DATETIME
);

-- Create Users table
CREATE TABLE Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,  -- Consider hashing and salting passwords
    email TEXT
);

-- Create Attachments table
CREATE TABLE Attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issue_id INTEGER,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    FOREIGN KEY (issue_id) REFERENCES Issues(id)
);

--Create Epics table
CREATE TABLE Epics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);
