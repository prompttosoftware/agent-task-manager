// src/services/issue.service.ts
import { Issue } from '../types/issue.d.ts';

// Mock issue data for now.  Replace with database interaction later.
const issues: Issue[] = [];

export const createIssue = async (issueData: Omit<Issue, 'id'>): Promise<Issue> => {
  const newIssue: Issue = {
    id: String(Date.now()), // Temporary ID.  Replace with database ID.
    ...issueData,
  };
  issues.push(newIssue);
  return newIssue;
};

export const getIssue = async (id: string): Promise<Issue | undefined> => {
  return issues.find(issue => issue.id === id);
};

export const updateIssue = async (id: string, updateData: Partial<Issue>): Promise<Issue | undefined> => {
  const issueIndex = issues.findIndex(issue => issue.id === id);
  if (issueIndex === -1) {
    return undefined;
  }
  issues[issueIndex] = { ...issues[issueIndex], ...updateData };
  return issues[issueIndex];
};

export const deleteIssue = async (id: string): Promise<void> => {
  const issueIndex = issues.findIndex(issue => issue.id === id);
  if (issueIndex !== -1) {
    issues.splice(issueIndex, 1);
  }
};

export const listIssues = async (): Promise<Issue[]> => {
  return issues;
};
