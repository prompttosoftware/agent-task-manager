// src/services/issueService.ts
import { v4 as uuidv4 } from 'uuid';

interface Issue {
  issueKey: string;
  summary: string;
  description: string;
  issueType: string;
  attachments: string[];
}

const issues: { [key: string]: Issue } = {};

export class IssueService {
  async createIssue(summary: string, description: string, issueType: string): Promise<Issue> {
    const issueKey = `TASK-${uuidv4()}`.slice(0, 12).toUpperCase();
    const issue: Issue = {
      issueKey,
      summary,
      description,
      issueType,
      attachments: []
    };
    issues[issueKey] = issue;
    return issue;
  }

  async getIssue(issueKey: string): Promise<Issue | undefined> {
    return issues[issueKey];
  }

  async addAttachment(issueKey: string, filePath: string): Promise<void> {
    const issue = issues[issueKey];
    if (!issue) {
      throw new Error('Issue not found');
    }
    issue.attachments.push(filePath);
  }
}

export const issueService = new IssueService();
