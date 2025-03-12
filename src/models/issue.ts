// src/models/issue.ts

export interface Issue {
  id: string;
  boardId: string;
  summary: string;
  description: string;
  assignee?: string;
  status: string;
  // Add other relevant fields as needed
}
