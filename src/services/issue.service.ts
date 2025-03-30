// Define service functions here
import { Issue, IssueLink } from '../types/issue.d';
import { db } from '../db/database';

export const findIssues = async (keywords?: string, status?: string, assignee?: string): Promise<Issue[]> => {
  let query = 'SELECT * FROM issues WHERE 1=1';
  const params: any[] = [];

  if (keywords) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${keywords}%`, `%${keywords}%`);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (assignee) {
    query += ' AND assignee = ?';
    params.push(assignee);
  }

  const stmt = db.prepare(query);
  const issues = stmt.all(...params) as Issue[];
  return issues;
};

export const getIssue = async (issueKey: string): Promise<Issue | undefined> => {
  const stmt = db.prepare('SELECT * FROM issues WHERE id = ?');
  const issue = stmt.get(issueKey) as Issue | undefined;
  return issue;
};

export const deleteIssue = async (issueKey: string): Promise<void> => {
  const stmt = db.prepare('DELETE FROM issues WHERE id = ?');
  stmt.run(issueKey);
};

export const addAttachment = async (issueKey: string, attachment: any): Promise<void> => {
  const stmt = db.prepare('INSERT INTO attachments (issueId, filename, contentType, size, data) VALUES (?, ?, ?, ?, ?)');
  stmt.run(issueKey, attachment.filename, attachment.contentType, attachment.size, attachment.data);
};

export const createIssueLink = async (issueLink: IssueLink): Promise<void> => {
    const stmt = db.prepare('INSERT INTO issue_links (issueKey, type, linkedIssueKey) VALUES (?, ?, ?)');
    stmt.run(issueLink.issueKey, issueLink.type, issueLink.linkedIssueKey);
};

export const issueExists = async (issueKey: string): Promise<boolean> => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM issues WHERE id = ?');
    const result = stmt.get(issueKey) as { count: number };
    return result.count > 0;
};

export const getIssueCreateMetadata = async (projectKeys?: string[], issueTypeNames?: string[]): Promise<any> => {
    // This function is a placeholder.  You would normally query your datastore for
    // valid project keys and issue type names and return them.
    return {
        projectKeys: projectKeys || [],
        issueTypeNames: issueTypeNames || []
    };
};

export const getIssueTransitions = async (issueKey: string): Promise<any> => {
  // This function is a placeholder.  You would normally query your datastore for
  // valid issue transitions and return them.
  return [];
};
