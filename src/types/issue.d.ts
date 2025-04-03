// src/types/issue.d.ts

/**
 * Represents the priority of an issue.
 */
export enum IssuePriority {
  High = "High",
  Medium = "Medium",
  Low = "Low",
}

/**
 * Represents the status of an issue.
 */
export enum IssueStatus {
  Open = "Open",
  InProgress = "In Progress",
  Resolved = "Resolved",
  Closed = "Closed",
  Blocked = "Blocked",
}

/**
 * Represents a user who is assigned to or involved with an issue.
 */
export interface User {
  id: string; // Unique user identifier (e.g., user ID)
  name: string; // User's display name
  email: string; // User's email address
}

/**
 * Represents a comment on an issue.
 */
export interface Comment {
  id: string; // Unique comment identifier
  author: User; // The user who wrote the comment
  content: string; // The text content of the comment
  createdAt: string; // Timestamp of when the comment was created (ISO 8601 string)
}


/**
 * Represents an issue in the system.
 */
export interface Issue {
  id: string; // Unique identifier for the issue (e.g., UUID)
  title: string; // A concise title or summary of the issue
  description: string; // Detailed description of the issue
  reporter: User; // The user who reported the issue
  assignee?: User; // Optional: The user assigned to the issue (undefined if unassigned)
  priority: IssuePriority; // The priority of the issue
  status: IssueStatus; // The current status of the issue
  createdAt: string; // Timestamp of when the issue was created (ISO 8601 string)
  updatedAt: string; // Timestamp of when the issue was last updated (ISO 8601 string)
  comments: Comment[]; // An array of comments associated with the issue
  labels?: string[]; // Optional: An array of labels or tags associated with the issue
  dueDate?: string; // Optional: Date by which the issue should be resolved (ISO 8601 string)
  // Add any other relevant fields here, such as:
  // - Project: string; // Issue belongs to a project
  // - attachments: Attachment[]; // array of attachments
  // - customFields: {[key: string]: any}; // for custom fields
}