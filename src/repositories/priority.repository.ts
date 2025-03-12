// src/repositories/priority.repository.ts
import db from '../config/database.config';

export interface Priority {
  id?: number;
  name: string;
}

export const createPriority = (priority: Omit<Priority, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Priorities (name) VALUES (?)`, // Removed id
      [priority.name],
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

export const getPriorityByName = (name: string): Promise<Priority | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Priorities WHERE name = ?`, // Select all columns
      [name],
      (err, row: Priority) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updatePriority = (id: number, priority: Partial<Priority>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(priority)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(priority);

    db.run(
      `UPDATE Priorities SET ${setClauses} WHERE id = ?`,
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

export const deletePriority = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Priorities WHERE id = ?`,
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
