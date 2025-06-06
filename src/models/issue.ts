import { v4 as uuidv4 } from 'uuid';

export interface BaseIssue {
  id: string; // UUID
  key: string;
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  summary: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601 - Set to current timestamp using new Date().toISOString()
}

export interface EpicSpecifics {
  childIssueKeys: string[];
}

export interface SubtaskSpecifics {
  parentIssueKey: string;
}

export interface Task extends BaseIssue {
  issueType: "Task";
}

export interface Story extends BaseIssue {
  issueType: "Story";
}

export interface Bug extends BaseIssue {
  issueType: "Bug";
}

export interface Epic extends BaseIssue, EpicSpecifics {
  issueType: "Epic";
}

export interface Subtask extends BaseIssue, SubtaskSpecifics {
  issueType: "Subtask";
}

export type AnyIssue = Task | Story | Epic | Bug | Subtask;

export interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}
