-- Define the schema for the Transitions table
CREATE TABLE Transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transition_name TEXT NOT NULL,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL
);
