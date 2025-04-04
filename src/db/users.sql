-- Define the schema for the Users table
CREATE TABLE Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_key TEXT UNIQUE NOT NULL,
  display_name TEXT
);
