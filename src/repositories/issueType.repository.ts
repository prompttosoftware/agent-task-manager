// src/repositories/issueType.repository.ts
import db from '../config/database.config';

export interface IssueType {
  id?: number;
  name: string;
  description?: string;
  subtask?: boolean;
  hierarchyLevel?: number;
}

export const createIssueType = (issueType: Omit<IssueType, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO IssueTypes (name, description, subtask, hierarchyLevel) VALUES (?, ?, ?, ?)`, // Removed id
      [issueType.name, issueType.description, issueType.subtask, issueType.hierarchyLevel],
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

export const getIssueTypeByName = (name: string): Promise<IssueType | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM IssueTypes WHERE name = ?`, // Select all columns
      [name],
      (err, row: IssueType) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updateIssueType = (id: number, issueType: Partial<IssueType>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(issueType)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(issueType);

    db.run(
      `UPDATE IssueTypes SET ${setClauses} WHERE id = ?`,
      [...values, id],
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

export const deleteIssueType = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM IssueTypes WHERE id = ?`,
      [id],
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
