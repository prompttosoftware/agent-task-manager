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
    FOREIGN KEY (issue_type) REFERENCES IssueTypes(name),
    FOREIGN KEY (board_id) REFERENCES Boards(id)
);

-- Insert default boards
INSERT INTO Boards (name) VALUES
('To Do'),
('In Progress'),
('Done');

-- Insert default issue types
INSERT INTO IssueTypes (name) VALUES
('Task'),
('Subtask'),
('Story'),
('Bug'),
('Epic');

-- Insert default transitions
-- Assuming we use board names for simplicity.  A more robust system would use IDs.
INSERT INTO Transitions (from_board_id, to_board_id) VALUES
  ((SELECT id FROM Boards WHERE name = 'To Do'), (SELECT id FROM Boards WHERE name = 'In Progress')),
  ((SELECT id FROM Boards WHERE name = 'In Progress'), (SELECT id FROM Boards WHERE name = 'Done')),
  ((SELECT id FROM Boards WHERE name = 'To Do'), (SELECT id FROM Boards WHERE name = 'Done')),
  ((SELECT id FROM Boards WHERE name = 'In Progress'), (SELECT id FROM Boards WHERE name = 'To Do'));