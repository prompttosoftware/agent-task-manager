import { db } from '../../src/db/database';
import { Attachment } from '../types/issue.d';
import * as fs from 'fs/promises';

export const issueService = {
  async getIssue(issueKey: string) {
    try {
      const issue = await db.prepare('SELECT * FROM issues WHERE issue_key = ?').get(issueKey);
      return issue;
    } catch (error: any) {
      console.error('Error fetching issue:', error);
      throw new Error(error.message || 'Failed to get issue');
    }
  },

  async addAttachment(issueKey: string, filePath: string, originalname: string, mimetype: string): Promise<number> {
    try {
      const fileContent = await fs.readFile(filePath);
      const insert = db.prepare('INSERT INTO attachments (issue_key, file_name, file_content, mimetype) VALUES (?, ?, ?, ?)');
      const info = insert.run(issueKey, originalname, fileContent, mimetype);
      return info.lastInsertRowid as number;
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      throw new Error(error.message || 'Failed to add attachment');
    } 
  },

  async searchIssues(query: any) {
    // TODO: Implement search functionality based on query parameters
    // Example:
    // const { keywords, status, assignee } = query;
    // let sql = 'SELECT * FROM issues WHERE 1=1';
    // if (keywords) {
    //   sql += ' AND (summary LIKE ? OR description LIKE ?)';
    // }
    // ...
    // const issues = await db.prepare(sql).all(...);
    return []; // Placeholder
  }
};
