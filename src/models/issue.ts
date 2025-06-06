export interface Task {
  id: string;
  key: string;
  issueType: 'TASK';
  summary: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  createdAt: string;
  updatedAt: string;
}

export interface Story {
  id: string;
  key: string;
  issueType: 'STOR';
  summary: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  createdAt: string;
  updatedAt: string;
}

export interface Epic {
  id: string;
  key: string;
  issueType: 'EPIC';
  summary: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  createdAt: string;
  updatedAt: string;
}

export interface Bug {
  id: string;
  key: string;
  issueType: 'BUG';
  summary: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  key: string;
  issueType: 'SUBT';
  summary: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
  createdAt: string;
  updatedAt: string;
  parentIssueKey: string;
}


// Union type for all issue types
export type AnyIssue = Task | Story | Epic | Bug | Subtask;

// Input type for creating a new issue
export type CreateIssueInput = Omit<AnyIssue, 'id' | 'key' | 'createdAt' | 'updatedAt'>;

// Define a type for the database schema
export interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}

export type IssueType = 'TASK' | 'STOR' | 'EPIC' | 'BUG' | 'SUBT';
