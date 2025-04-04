-- Define schema for IssueLinks table
CREATE TABLE IssueLinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_issue_id INTEGER NOT NULL,
    target_issue_id INTEGER NOT NULL,
    link_type TEXT,
    FOREIGN KEY (source_issue_id) REFERENCES Issues(id),
    FOREIGN KEY (target_issue_id) REFERENCES Issues(id)
);

-- Add indices for query performance
CREATE INDEX idx_issue_links_source_issue_id ON IssueLinks (source_issue_id);
CREATE INDEX idx_issue_links_target_issue_id ON IssueLinks (target_issue_id);