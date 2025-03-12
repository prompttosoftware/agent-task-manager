// src/services/issueService.ts

import { Issue } from '../models/issue';

export class IssueService {
  private issues: { [key: string]: Issue } = {};

  async createIssue(issue: Issue): Promise<Issue> {
    this.issues[issue.id] = issue;
    return issue;
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    return this.issues[id];
  }

  async getAllIssues(): Promise<Issue[]> {
    return Object.values(this.issues);
  }

  async updateIssue(id: string, updates: Partial<Issue>): Promise<Issue | undefined> {
    if (!this.issues[id]) {
      return undefined;
    }
    this.issues[id] = { ...this.issues[id], ...updates };
    return this.issues[id];
  }

  async deleteIssue(id: string): Promise<boolean> {
    if (!this.issues[id]) {
      return false;
    }
    delete this.issues[id];
    return true;
  }
}
