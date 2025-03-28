import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Attachment } from './models/attachment';
import { Issue } from './models/Issue';

export class Database {
  private db: any;

  async init() {
    this.db = await open({
      filename: 'database.db',
      driver: sqlite3.Database,
    });
    await this.db.exec(
      `CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issueId TEXT NOT NULL,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        mimetype TEXT
      )`
    );
    await this.db.exec(
      `CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        summary TEXT NOT NULL,
        statusCategory TEXT NOT NULL,
        issueType TEXT
      )`
    );
  }

  async addAttachment(attachment: Attachment) {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'INSERT INTO attachments (issueId, fileName, filePath, createdAt, mimetype) VALUES (?, ?, ?, ?, ?)',
      attachment.issueId, attachment.filename, attachment.filePath, attachment.createdAt, attachment.mimetype
    );
  }

  async getAttachmentsByIssueId(issueId: string): Promise<Attachment[]> {
    if (!this.db) {
      await this.init();
    }
    const rows = await this.db.all<Attachment[]>(
      'SELECT id, issueId, fileName, filePath, createdAt, mimetype FROM attachments WHERE issueId = ?', issueId
    );
    return rows;
  }
  
  async getAttachment(id: string): Promise<Attachment | undefined> {
    if (!this.db) {
      await this.init();
    }
    const row = await this.db.get<Attachment>(
      'SELECT id, issueId, fileName, filePath, createdAt, mimetype FROM attachments WHERE id = ?', id
    );
    return row;
  }

  async getIssuesByStatusCategory(statusCategory: string): Promise<Issue[]> {
    if (!this.db) {
      await this.init();
    }
    const rows = await this.db.all<Issue[]>(
      'SELECT id, summary, statusCategory, issueType FROM issues WHERE statusCategory = ?', statusCategory
    );
    return rows;
  }

  async addIssue(issue: Issue) {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'INSERT INTO issues (id, summary, statusCategory, issueType) VALUES (?, ?, ?, ?)',
      issue.id, issue.summary, issue.statusCategory, issue.issueType
    );
  }

  async getEpics(): Promise<Issue[]> {
    if (!this.db) {
      await this.init();
    }
    const rows = await this.db.all<Issue[]>(
      'SELECT id, summary, statusCategory, issueType FROM issues WHERE issueType = ?', 'Epic'
    );
    return rows;
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    if (!this.db) {
      await this.init();
    }
    const row = await this.db.get<Issue>(
      'SELECT id, summary, statusCategory, issueType FROM issues WHERE id = ?', id
    );
    return row;
  }

  async updateIssue(id: string, summary: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'UPDATE issues SET summary = ? WHERE id = ?', summary, id
    );
  }

  async searchIssues(query: string): Promise<Issue[]> {
    if (!this.db) {
      await this.init();
    }
    const rows = await this.db.all<Issue[]>(
        'SELECT id, summary, statusCategory, issueType FROM issues WHERE summary LIKE ?', `%${query}%`
    );
    return rows;
  }

  async deleteIssue(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'DELETE FROM issues WHERE id = ?', id
    );
  }
}
