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
    const { keywords, status, assignee, priority, reporter, page = 1, pageSize = 10 } = query;
    const offset = (page - 1) * pageSize;
    let sql = 'SELECT * FROM issues WHERE 1=1';
    const params: any[] = [];

    if (keywords) {
      sql += ' AND (summary LIKE ? OR description LIKE ?)';
      const keywordSearch = `%${keywords}%`;
      params.push(keywordSearch, keywordSearch);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (assignee) {
      sql += ' AND assignee = ?';
      params.push(assignee);
    }

    if (priority) {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    if (reporter) {
      sql += ' AND reporter = ?';
      params.push(reporter);
    }

    const countQuery = `SELECT COUNT(*) as total FROM issues WHERE 1=1 ${sql.substring(sql.indexOf('AND'))}`;
    const countParams = [...params];
    const countStatement = db.prepare(countQuery);
    const countResult = countStatement.get(...countParams);
    const total = countResult ? (countResult as any).total : 0;

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const statement = db.prepare(sql);
    const issues = statement.all(...params);

    return {
      issues: issues,
      total: total,
    };
  }
};