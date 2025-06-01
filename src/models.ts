// src/models.ts

import { v4 as uuidv4 } from 'uuid';

// Define the union type for issue types
type IssueType = "Task" | "Story" | "Epic" | "Bug" | "Subtask";

// BaseIssue interface
interface BaseIssue {
  id: string; // UUID
  key: string;
  issueType: IssueType;
  summary: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  parentKey?: string | null; // Optional reference to a parent issue key - Use this for Subtasks
}

// EpicSpecifics - Only Epic needs this specific property
interface EpicSpecifics {
  childIssueKeys: string[];
}

// SubtaskSpecifics - No longer needs parentIssueKey as it's in BaseIssue
// Removing parentIssueKey from here to avoid conflict with BaseIssue
interface SubtaskSpecifics {
  // parentIssueKey: string; // REMOVED: Use parentKey from BaseIssue instead
}

// Concrete issue types
interface Task extends BaseIssue {}
interface Story extends BaseIssue {}
interface Bug extends BaseIssue {}
interface Epic extends BaseIssue, EpicSpecifics {}
// Subtask extends BaseIssue and an empty SubtaskSpecifics (for consistency, though could just extend BaseIssue)
// Extending SubtaskSpecifics even if empty makes it clear it's a specific type.
interface Subtask extends BaseIssue, SubtaskSpecifics {}

// AnyIssue union type
type AnyIssue = Task | Story | Epic | Bug | Subtask;

// DbSchema interface
interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}

// Input type for creating a new issue via the service
// This should match the expected input of the issueService.createIssue function.
// The service expects issueTypeName as a string (optional), not the strict union type,
// as it handles the mapping and defaulting internally.
interface CreateIssueInput {
  issueTypeName?: string; // Allow string or undefined as input from controller
  title: string;
  description?: string;
  parentKey?: string | null; // Use parentKey consistently for input as well
}

export { IssueType, BaseIssue, EpicSpecifics, SubtaskSpecifics, Task, Story, Bug, Epic, Subtask, AnyIssue, DbSchema, CreateIssueInput };
