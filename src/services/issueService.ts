import { saveIssue } from './inMemoryDatabase';
import { v4 as uuidv4 } from 'uuid';

export interface Issue {
  id: string;
  summary: string;
  description: string;
  project: string;
  issueType: string;
  parent?: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string; // ISO string
}

export const createIssue = (issueData: {
  summary: string;
  description: string;
  project: string;
  issueType: string;
  parent?: string;
}): Issue => {
  const id = `ISSUE-${String(Math.floor(100 + Math.random() * 900)).padStart(3, '0')}`; // Generates ISSUE-000 to ISSUE-999
  const now = new Date().toISOString();
  const newIssue: Issue = {
    id,
    summary: issueData.summary,
    description: issueData.description || '',
    project: issueData.project,
    issueType: issueData.issueType,
    parent: issueData.parent,
    status: 'Open',
    createdAt: now,
  };

  saveIssue(newIssue);
  return newIssue;
};
