// src/repositories/project.repository.ts
import db from '../config/database.config';

export interface Project {
  id?: number;
  key: string;
  name: string;
}

export const createProject = (project: Omit<Project, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Projects (key, name) VALUES (?, ?)`, // Removed id
      [project.key, project.name],
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

export const getProjectByKey = (key: string): Promise<Project | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Projects WHERE key = ?`, // Select all columns
      [key],
      (err, row: Project) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updateProject = (id: number, project: Partial<Project>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(project)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(project);

    db.run(
      `UPDATE Projects SET ${setClauses} WHERE id = ?`,
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

export const deleteProject = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Projects WHERE id = ?`,
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
