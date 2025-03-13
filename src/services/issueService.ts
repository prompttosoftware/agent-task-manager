// src/services/issueService.ts

// In-memory data (replace with database in a real application)
const issues = [
  {
    id: '1',
    key: 'TASK-1',
    properties: {},
    fields: {
      issuetype: { id: '1', description: 'Task', name: 'Task', subtask: false, hierarchyLevel: 0 },
      project: { id: '1', key: 'TASK', name: 'Task Project' },
      priority: { name: 'High', id: '1' },
      labels: ['backend', 'api'],
      issuelinks: [],
      status: { name: 'Open', id: '1' },
      description: 'Implement GET /issue/{issueNumber}',
      summary: 'Implement API Endpoint: GET /issue/{issueNumber} (Find Issue)',
      subtasks: [],
      progress: { progress: 50, total: 100 },
    },
  },
  {
    id: '2',
    key: 'BUG-1',
    properties: {},
    fields: {
      issuetype: { id: '2', description: 'Bug', name: 'Bug', subtask: false, hierarchyLevel: 0 },
      project: { id: '2', key: 'BUG', name: 'Bug Project' },
      priority: { name: 'High', id: '1' },
      labels: ['frontend', 'ui'],
      issuelinks: [],
      status: { name: 'Open', id: '1' },
      description: 'Fix button alignment issue',
      summary: 'Button alignment issue',
      subtasks: [],
      progress: { progress: 100, total: 100 },
    },
  },
];

function parseIssueNumber(issueNumber: string): { projectKey: string, issueId: string } | null {
    const match = issueNumber.match(/^([A-Z]+)-(\d+)$/);
    if (!match) {
        return null;
    }
    return {
        projectKey: match[1],
        issueId: match[2]
    };
}

export async function getIssueService(issueNumber: string, fieldsParam?: string) {
  const parsedIssueNumber = parseIssueNumber(issueNumber);
  if (!parsedIssueNumber) {
    throw new Error('Invalid issue number format');
  }

  const issue = issues.find((issue) => issue.key === issueNumber);

  if (!issue) {
    return null;
  }

  if (fieldsParam) {
    const fieldsToReturn = fieldsParam.split(',');
    const filteredIssue: any = { ...issue }; // Create a copy to avoid modifying the original
    filteredIssue.fields = {};
    for (const field of fieldsToReturn) {
        if (issue.fields && issue.fields[field as keyof typeof issue.fields]) {
            filteredIssue.fields[field] = issue.fields[field as keyof typeof issue.fields];
        }
    }
    return filteredIssue;
  }

  return issue;
}
