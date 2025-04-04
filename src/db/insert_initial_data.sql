-- Insert default boards
INSERT INTO Boards (name) VALUES ('To Do');
INSERT INTO Boards (name) VALUES ('In Progress');
INSERT INTO Boards (name) VALUES ('Done');

-- Insert default issue types (assuming an IssueTypes table exists)
-- Replace with the actual table and column names if different
INSERT INTO IssueTypes (name) VALUES ('Task');
INSERT INTO IssueTypes (name) VALUES ('Subtask');
INSERT INTO IssueTypes (name) VALUES ('Story');
INSERT INTO IssueTypes (name) VALUES ('Bug');
INSERT INTO IssueTypes (name) VALUES ('Epic');

-- Insert default transitions (assuming a Transitions table exists)
-- Replace with the actual table and column names if different and adjust board/issue type IDs
INSERT INTO Transitions (fromBoard, toBoard, name) VALUES ((SELECT id FROM Boards WHERE name = 'To Do'), (SELECT id FROM Boards WHERE name = 'In Progress'), 'To Do -> In Progress');
INSERT INTO Transitions (fromBoard, toBoard, name) VALUES ((SELECT id FROM Boards WHERE name = 'In Progress'), (SELECT id FROM Boards WHERE name = 'Done'), 'In Progress -> Done');
INSERT INTO Transitions (fromBoard, toBoard, name) VALUES ((SELECT id FROM Boards WHERE name = 'To Do'), (SELECT id FROM Boards WHERE name = 'Done'), 'To Do -> Done');
INSERT INTO Transitions (fromBoard, toBoard, name) VALUES ((SELECT id FROM Boards WHERE name = 'In Progress'), (SELECT id FROM Boards WHERE name = 'To Do'), 'In Progress -> To Do');
