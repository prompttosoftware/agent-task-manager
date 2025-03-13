// src/data/inMemoryStorage.ts

export interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    issuetype: { name: string };
    labels: string[];
    status: { name: string; id: string };
    [key: string]: any;
  };
  linkedIssues?: string[]; // Store linked issue keys
}

export interface Board {
  id: string;
  name: string;
  columns: {
    name: string;
    statusIds: string[];
  }[];
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  filters: { [key: string]: any };
}

export const issues: Issue[] = [];
export const boards: Board[] = [];
export const webhooks: Webhook[] = [];

export const addIssueLink = (inwardKey: string, outwardKey: string) => {
  const inwardIssue = issues.find(issue => issue.key === inwardKey);
  const outwardIssue = issues.find(issue => issue.key === outwardKey);

  if (inwardIssue) {
    if (!inwardIssue.linkedIssues) {
      inwardIssue.linkedIssues = [];
    }
    if (!inwardIssue.linkedIssues.includes(outwardKey)) {
      inwardIssue.linkedIssues.push(outwardKey);
    }
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
