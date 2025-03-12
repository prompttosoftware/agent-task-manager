// src/repositories/attachment.repository.ts
import db from '../config/database.config';

export interface Attachment {
  id?: number;
  issueId: number;
  filename: string;
  filepath: string;
  created_at?: string;
}

export const createAttachment = (attachment: Omit<Attachment, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO Attachments (issueId, filename, filepath) VALUES (?, ?, ?)`, // Removed id and created_at
      [attachment.issueId, attachment.filename, attachment.filepath],
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

export const getAttachmentById = (id: number): Promise<Attachment | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM Attachments WHERE id = ?`, // Select all columns
      [id],
      (err, row: Attachment) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      }
    );
  });
};

export const updateAttachment = (id: number, attachment: Partial<Attachment>): Promise<void> => {
  return new Promise((resolve, reject) => {
    const setClauses = Object.keys(attachment)
      .filter(key => key !== 'id') // Prevent updating ID
      .map(key => `${key} = ?`)
      .join(', ');

    if (!setClauses) {
      resolve(); // Nothing to update
      return;
    }

    const values = Object.values(attachment);

    db.run(
      `UPDATE Attachments SET ${setClauses} WHERE id = ?`,
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

export const deleteAttachment = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM Attachments WHERE id = ?`,
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
