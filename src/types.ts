// src/types.ts

/**
 * Represents the data required to create a new issue.
 */
export interface IssueCreationData {
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
}

/**
 * Represents a full issue object with all properties.
 */
export interface Issue {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  status: 'open' | 'in progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}
