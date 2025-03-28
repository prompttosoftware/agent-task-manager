import { StatusCategory } from './Board';

export enum IssueType {
  Bug = 'Bug',
  Task = 'Task',
  Story = 'Story',
  // Add more issue types as needed
}

export interface Issue {
  id: string;
  summary: string;
  statusCategory: StatusCategory;
  issueType: IssueType; // Use enum
  links?: IssueLink[]; // Add issue links to the model
  [key: string]: any; // Allow for dynamic fields based on issue type
}

export interface IssueLink {
  type: string; // e.g., "relates to", "blocks", "is blocked by"
  issueKey: string; // The key of the linked issue
}
