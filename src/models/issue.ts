// src/models/issue.ts

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
}
