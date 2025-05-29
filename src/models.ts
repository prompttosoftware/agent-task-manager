// src/models.ts

import { v4 as uuidv4 } from 'uuid';

// BaseIssue interface
interface BaseIssue {
  id: string; // UUID
  key: string;
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  summary: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  parentKey?: string | null; // Optional reference to a parent issue key
}

// EpicSpecifics
interface EpicSpecifics {
  childIssueKeys: string[];
}

// SubtaskSpecifics
interface SubtaskSpecifics {
  parentIssueKey: string;
}

// Concrete issue types
interface Task extends BaseIssue {}
interface Story extends BaseIssue {}
interface Bug extends BaseIssue {}
interface Epic extends BaseIssue, EpicSpecifics {}
interface Subtask extends BaseIssue, SubtaskSpecifics {}

// AnyIssue union type
type AnyIssue = Task | Story | Epic | Bug | Subtask;

// DbSchema interface
interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}

// Input type for creating a new issue via the service
interface CreateIssueInput {
  issueTypeName: AnyIssue['issueType']; // Use the specific union type
  title: string;
  description?: string;
  parentKey?: string | null;
}

export { BaseIssue, EpicSpecifics, SubtaskSpecifics, Task, Story, Bug, Epic, Subtask, AnyIssue, DbSchema, CreateIssueInput };
