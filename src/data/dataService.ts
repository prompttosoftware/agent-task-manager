// src/services/dataService.ts
import { issues, Issue } from './inMemoryStorage';

export const createIssue = (issue: Issue): Issue => {
  issue.id = Math.random().toString(); // Simple ID generation
  issues.push(issue);
  return issue;
};

export const getIssueByKey = (key: string): Issue | undefined => {
  return issues.find(issue => issue.key === key);
};

export const getAllIssues = (): Issue[] => {
  return issues;
};

export const updateIssue = (key: string, updatedFields: Partial<Issue>): Issue | undefined => {
    const issueIndex = issues.findIndex(issue => issue.key === key);
    if (issueIndex === -1) {
        return undefined;
    }
    issues[issueIndex] = { ...issues[issueIndex], ...updatedFields };
    return issues[issueIndex];
}

export const deleteIssue = (key: string): boolean => {
  const initialLength = issues.length;
  issues = issues.filter(issue => issue.key !== key);
  return issues.length !== initialLength;
};

export const linkIssues = (inwardKey: string, outwardKey: string): void => {
  const inwardIssue = issues.find(issue => issue.key === inwardKey);
  const outwardIssue = issues.find(issue => issue.key === outwardKey);

  if (!inwardIssue || !outwardIssue) {
    throw new Error('Issue not found');
  }

  if (!inwardIssue.linkedIssues) {
    inwardIssue.linkedIssues = [];
  }
  if (!inwardIssue.linkedIssues.includes(outwardKey)) {
    inwardIssue.linkedIssues.push(outwardKey);
  }

  if (outwardIssue) {
    if (!outwardIssue.linkedIssues) {
      outwardIssue.linkedIssues = [];
    }
    if (!outwardIssue.linkedIssues.includes(inwardKey)) {
      outwardIssue.linkedIssues.push(inwardKey);
    }
  }
};
