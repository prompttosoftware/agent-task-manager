import { Issue } from '../types/issue.d';

// In-memory storage (replace with database interaction)
const issues: Issue[] = [];

export const createIssue = async (issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Issue> => {
  const now = new Date().toISOString();
  const newIssue: Issue = {
    id: Math.random().toString(), // Generate a simple ID
    ...issueData,
    createdAt: now,
    updatedAt: now,
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
  issues[issueIndex] = {
    ...issues[issueIndex],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
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
