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

// Base input type for creating a new issue (common properties)
interface BaseCreateIssueInput {
  summary: string;
  description?: string;
  status: 'Todo' | 'In Progress' | 'Done';
}

// Specific input types for each issue type
interface CreateTaskInput extends BaseCreateIssueInput {
  issueType: 'TASK';
}

interface CreateStoryInput extends BaseCreateIssueInput {
  issueType: 'STOR';
}

interface CreateEpicInput extends BaseCreateIssueInput {
  issueType: 'EPIC';
}

interface CreateBugInput extends BaseCreateIssueInput {
  issueType: 'BUG';
}

interface CreateSubtaskInput extends BaseCreateIssueInput {
  issueType: 'SUBT';
  parentIssueKey: string; // Required for subtasks
}

// Input type for creating a new issue (discriminated union)
export type CreateIssueInput =
  | CreateTaskInput
  | CreateStoryInput
  | CreateEpicInput
  | CreateBugInput
  | CreateSubtaskInput;

// Define a type for the database schema
export interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}

export type IssueType = 'TASK' | 'STOR' | 'EPIC' | 'BUG' | 'SUBT';
