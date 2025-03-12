// src/models/issue.ts

export interface Issue {
  id: string;
  summary: string;
  description: string;
  status: string;
  // Add other relevant fields like assignee, priority, etc.
}
