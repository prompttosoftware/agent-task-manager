// src/repositories/issue.repository.ts
import db from '../config/database.config';

export interface Issue {
  id?: number;
  key: string;
  issueTypeId: number;
  projectId: number;
  priorityId: number;
  statusId: number;
  assigneeId?: string;
  summary: string;
  description?: string;
  labels?: string;
  issueLinks?: string;
  subtasks?: string;
  progress_progress?: number;
  progress_total?: number;
  attachments?: string;
  created_at?: string;
  updated_at?: string;
}

export const createIssue = (issue: Omit<Issue, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Issues (key, issueTypeId, projectId, priorityId, statusId, assigneeId, summary, description, labels, issueLinks, subtasks, progress_progress, progress_total, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // Removed created_at and updated_at as they are handled by default
      [issue.key, issue.issueTypeId, issue.projectId, issue.priorityId, issue.statusId, issue.assigneeId, issue.summary, issue.description, issue.labels, issue.issueLinks, issue.subtasks, issue.progress_progress, issue.progress_total, issue.attachments],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );
  });
};

export const getIssueByKey = (key: string): Promise<Issue | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Issues WHERE key = ?`, // Select all columns
      [key],
      (err, row: Issue) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updateIssue = (key: string, issue: Partial<Issue>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(issue)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(issue);

    db.run(
      `UPDATE Issues SET ${setClauses} WHERE key = ?`,
      [...values, key],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
};

export const deleteIssue = (key: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Issues WHERE key = ?`,
      [key],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
};
