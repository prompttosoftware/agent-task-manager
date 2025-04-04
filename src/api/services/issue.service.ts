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

  async addAttachment(issueKey: string, filePath: string): Promise<number> {
    try {
      const fileContent = await fs.readFile(filePath);
      const insert = db.prepare('INSERT INTO attachments (issue_key, file_name, file_content) VALUES (?, ?, ?)');
      const info = insert.run(issueKey, filePath.split('/').pop(), fileContent);
      return info.lastInsertRowid as number;
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      throw new Error(error.message || 'Failed to add attachment');
    } finally {
      // Clean up the temporary file
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  }
};
