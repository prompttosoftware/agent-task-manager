// src/repositories/agent.repository.ts
import db from '../config/database.config';

export interface Agent {
  id: string;
  name?: string;
}

export const createAgent = (agent: Agent): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Agents (id, name) VALUES (?, ?)`, // Removed id and created_at
      [agent.id, agent.name],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
};

export const getAgentById = (id: string): Promise<Agent | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Agents WHERE id = ?`, // Select all columns
      [id],
      (err, row: Agent) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updateAgent = (id: string, agent: Partial<Agent>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(agent)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(agent);

    db.run(
      `UPDATE Agents SET ${setClauses} WHERE id = ?`,
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

export const deleteAgent = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Agents WHERE id = ?`,
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
