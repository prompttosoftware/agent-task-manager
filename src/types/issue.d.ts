// src/types/issue.d.ts

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: string; // Optional assignee
  reporter: string;
  created: string;
  updated: string;
}
