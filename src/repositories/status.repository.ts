// src/repositories/status.repository.ts
import db from '../config/database.config';

export interface Status {
  id?: number;
  name: string;
  boardId?: number;
}

export const createStatus = (status: Omit<Status, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Statuses (name, boardId) VALUES (?, ?)`, // Removed id
      [status.name, status.boardId],
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

export const getStatusByName = (name: string): Promise<Status | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Statuses WHERE name = ?`, // Select all columns
      [name],
      (err, row: Status) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updateStatus = (id: number, status: Partial<Status>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(status)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(status);

    db.run(
      `UPDATE Statuses SET ${setClauses} WHERE id = ?`,
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

export const deleteStatus = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Statuses WHERE id = ?`,
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
