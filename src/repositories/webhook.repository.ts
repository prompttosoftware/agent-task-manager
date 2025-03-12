// src/repositories/webhook.repository.ts
import db from '../config/database.config';

export interface Webhook {
  id?: number;
  name: string;
  url: string;
  events?: string;
  filters?: string;
}

export const createWebhook = (webhook: Omit<Webhook, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Webhooks (name, url, events, filters) VALUES (?, ?, ?, ?)`, // Removed id
      [webhook.name, webhook.url, webhook.events, webhook.filters],
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

export const getWebhookByName = (name: string): Promise<Webhook | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Webhooks WHERE name = ?`, // Select all columns
      [name],
      (err, row: Webhook) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updateWebhook = (id: number, webhook: Partial<Webhook>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(webhook)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(webhook);

    db.run(
      `UPDATE Webhooks SET ${setClauses} WHERE id = ?`,
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

export const deleteWebhook = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Webhooks WHERE id = ?`,
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
