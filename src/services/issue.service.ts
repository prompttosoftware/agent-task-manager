// src/services/issue.service.ts
import { Issue, IssueStatus } from '../types/issue';
import { db } from '../data/db';
import { v4 as uuidv4 } from 'uuid';

export class IssueService {
  async searchIssues(query: string): Promise<Issue[]> {
    try {
      const issues = (await db.getAll('issues')) as Issue[];
      const searchTerm = query.toLowerCase();
      return issues.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm) ||
        (issue.description && issue.description.toLowerCase().includes(searchTerm)) ||
        (issue.assignee && issue.assignee.toLowerCase().includes(searchTerm)) ||
        (issue.reporter && issue.reporter.toLowerCase().includes(searchTerm))
      );
    } catch (error: any) {
      console.error('Error searching issues:', error);
      return [];
    }
  }

  async getIssue(issueKey: string): Promise<Issue | undefined> {
    try {
      const issue = await db.get('issues', issueKey) as Issue;
      return issue;
    } catch (error: any) {
      console.error(`Error getting issue with key ${issueKey}:`, error);
      return undefined;
    }
  }

  async getIssuesByBoard(boardId: string): Promise<Issue[]> {
    try {
      const issues = (await db.getAll('issues')) as Issue[];
      return issues.filter(issue => issue.boardId === boardId);
    } catch (error: any) {
      console.error(`Error getting issues for board ${boardId}:`, error);
      return [];
    }
  }

  async assignIssue(issueKey: string, assigneeKey: string): Promise<Issue | undefined> {
    try {
      const issue = await this.getIssue(issueKey);
      if (!issue) {
        return undefined;
      }

      const updatedIssue = { ...issue, assignee: assigneeKey, updatedAt: new Date() };
      await db.set('issues', issueKey, updatedIssue);
      return updatedIssue;

    } catch (error: any) {
      console.error(`Error assigning issue ${issueKey} to ${assigneeKey}:`, error);
      return undefined;
    }
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<Issue | undefined> {
    try {
      const issue = await this.getIssue(issueKey);
      if (!issue) {
        return undefined;
      }

      // In a real application, you would map transitionId to a new status.
      const updatedIssue = { ...issue, status: transitionId, updatedAt: new Date() };
      await db.set('issues', issueKey, updatedIssue);
      return updatedIssue;

    } catch (error: any) {
      console.error(`Error transitioning issue ${issueKey} to ${transitionId}:`, error);
      return undefined;
    }
  }

  async getCreateMeta(): Promise<any> {
    return {
      fields: [
        {
          key: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          description: 'The title of the issue'
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          description: 'A detailed description of the issue'
        },
        {
          key: 'boardId',
          label: 'Board',
          type: 'select',
          required: true,
          description: 'The ID of the board the issue belongs to'
        },
        {
          key: 'reporter',
          label: 'Reporter',
          type: 'text',
          required: true,
          description: 'The user who reported the issue'
        },
        {
          key: 'assignee',
          label: 'Assignee',
          type: 'text',
          description: 'The user assigned to the issue'
        },
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          description: 'The current status of the issue',
          options: Object.values(IssueStatus).map(status => ({ value: status, label: status }))
        }
      ]
    };
  }

  async getTransitions(issueKey: string): Promise<any> {
    try {
      const issue = await this.getIssue(issueKey);
      if (!issue) {
        return [];
      }

      const transitions = [
        { id: 'to-do', name: 'To Do' },
        { id: 'in-progress', name: 'In Progress' },
        { id: 'done', name: 'Done' },
        { id: 'blocked', name: 'Blocked' }
      ];
      return transitions;
    } catch (error: any) {
      console.error(`Error getting transitions for issue ${issueKey}:`, error);
      return [];
    }
  }
}
