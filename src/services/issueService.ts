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

/**
 * Creates a new issue with a unique ID and default status.
 * Saves the new issue and returns it.
 *
 * @param {object} issueData - The data for the new issue.
 * @param {string} issueData.summary - A brief summary of the issue.
 * @param {string} issueData.description - A detailed description of the issue.
 * @param {string} issueData.project - The project the issue belongs to.
 * @param {string} issueData.issueType - The type of the issue (e.g., Bug, Task, Story).
 * @param {string} [issueData.parent] - The optional ID of a parent issue.
 * @returns {Issue} The newly created Issue object.
 */
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
