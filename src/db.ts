import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Attachment } from './models/attachment';
import { Issue, IssueLink } from './models/Issue';
import { StatusCategory } from './src/models/Board';

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
        issueType TEXT,
        assignee TEXT,
        links TEXT -- Store issue links as JSON
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
      'SELECT id, summary, statusCategory, issueType, assignee, links FROM issues WHERE statusCategory = ?', statusCategory
    );
    return rows.map(row => ({
        ...row,
        links: row.links ? JSON.parse(row.links) : undefined
    }));
  }

  async addIssue(issue: Issue) {
    if (!this.db) {
      await this.init();
    }
    const links = issue.links ? JSON.stringify(issue.links) : null;
    await this.db.run(
      'INSERT INTO issues (id, summary, statusCategory, issueType, assignee, links) VALUES (?, ?, ?, ?, ?, ?)',
      issue.id, issue.summary, issue.statusCategory, issue.issueType, issue.assignee, links
    );
  }

  async getEpics(): Promise<Issue[]> {
    if (!this.db) {
      await this.init();
    }
    const rows = await this.db.all<Issue[]>(
      'SELECT id, summary, statusCategory, issueType, assignee, links FROM issues WHERE issueType = ?', 'Epic'
    );
    return rows.map(row => ({
        ...row,
        links: row.links ? JSON.parse(row.links) : undefined
    }));
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    if (!this.db) {
      await this.init();
    }
    const row = await this.db.get<Issue>(
      'SELECT id, summary, statusCategory, issueType, assignee, links FROM issues WHERE id = ?', id
    );
    return row ? {
      ...row,
      links: row.links ? JSON.parse(row.links) : undefined
    } : undefined;
  }

  async updateIssue(id: string, summary: string, links?: IssueLink[]): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    const linksString = links ? JSON.stringify(links) : null;
    await this.db.run(
      'UPDATE issues SET summary = ?, links = ? WHERE id = ?', summary, linksString, id
    );
  }

  async searchIssues(query: string): Promise<Issue[]> {
    if (!this.db) {
      await this.init();
    }
    const rows = await this.db.all<Issue[]>(
        'SELECT id, summary, statusCategory, issueType, assignee, links FROM issues WHERE summary LIKE ?', `%${query}%`
    );
    return rows.map(row => ({
        ...row,
        links: row.links ? JSON.parse(row.links) : undefined
    }));
  }

  async deleteIssue(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'DELETE FROM issues WHERE id = ?', id
    );
  }

  async updateIssueStatus(id: string, statusCategory: StatusCategory): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'UPDATE issues SET statusCategory = ? WHERE id = ?', statusCategory, id
    );
  }

  async updateIssueAssignee(id: string, assignee: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    await this.db.run(
      'UPDATE issues SET assignee = ? WHERE id = ?', assignee, id
    );
  }
}
