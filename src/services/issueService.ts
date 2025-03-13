// src/services/issueService.ts

import { Issue } from '../models/issue';

let issues: { [key: string]: Issue } = {
  'TASK-1': {
    issueKey: 'TASK-1',
    summary: 'Example Task',
    description: 'This is an example task.',
    assignee: null,
  },
};

export const getIssue = (issueKey: string): Issue | undefined => {
  return issues[issueKey];
};

export const updateIssueAssignee = (issueKey: string, agentId: string): boolean => {
  if (!issues[issueKey]) {
    return false;
  }
  issues[issueKey].assignee = agentId;
  return true;
};
