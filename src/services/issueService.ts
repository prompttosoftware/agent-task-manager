// src/services/issueService.ts
import { v4 as uuidv4 } from 'uuid';

interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    labels: string[];
  };
}

let issues: Issue[] = []; // In-memory storage

export async function createIssue(issueData: any): Promise<Issue> {
  // Validate the issue data (basic example)
  if (!issueData || !issueData.fields || !issueData.fields.summary || !issueData.fields.issuetype || !issueData.fields.labels) {
    throw new Error('Invalid issue data.  Missing required fields.');
  }

  const newIssue: Issue = {
    id: uuidv4(),
    key: `ATM-${issues.length + 1}`, // Generate a simple key
    fields: {
      summary: issueData.fields.summary,
      issuetype: { name: issueData.fields.issuetype.name },
      labels: issueData.fields.labels,
    },
  };

  issues.push(newIssue);
  return newIssue;
}
