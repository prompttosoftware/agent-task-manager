import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Attachment } from './models/attachment';

export class Database {
  private db: any;

  async init() {
    this.db = await open({
      filename: 'database.db',
      driver: sqlite3.Database,
    });
    await this.db.exec(
      `CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        issueId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`
    );
  }

  async addAttachment(attachment: Attachment) {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'INSERT INTO attachments (id, issueId, fileName, filePath, createdAt) VALUES (?, ?, ?, ?, ?)',
      attachment.id, attachment.issueId, attachment.fileName, attachment.filePath, attachment.createdAt
    );
  }
}
