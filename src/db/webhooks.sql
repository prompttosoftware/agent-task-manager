-- Define the schema for the Webhooks table
CREATE TABLE webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP
);
