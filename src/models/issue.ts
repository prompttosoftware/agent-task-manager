import { v4 as uuidv4 } from 'uuid';

export interface BaseIssue {
  id: string;
  key: string;
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  summary: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

export interface EpicSpecifics {
  childIssueKeys: string[];
}

export interface SubtaskSpecifics {
  parentIssueKey: string;
}

export interface Task extends BaseIssue {}

export interface Story extends BaseIssue {}

export interface Bug extends BaseIssue {}

export interface Epic extends BaseIssue, EpicSpecifics {}

export interface Subtask extends BaseIssue, SubtaskSpecifics {}

export type AnyIssue = Task | Story | Epic | Bug | Subtask;

export interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}
