// src/types/issue.d.ts

// Placeholder for issue types
export interface Issue {
  id: string;
  description: string;
  status: 'open' | 'in progress' | 'resolved' | 'closed'; // Example: added status
  createdAt: Date; // Example: added creation date
  updatedAt: Date; // Example: added update date
}

export interface IssueLink {
  sourceIssueId: string;
  targetIssueId: string;
  type: 'relates_to' | 'blocks' | 'is_blocked_by'; // Example: Issue Link Types
}