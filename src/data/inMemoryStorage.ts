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