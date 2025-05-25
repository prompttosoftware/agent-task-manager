import { v4 as uuidv4 } from 'uuid';

// BaseIssue Interface
interface BaseIssue {
  id: string; // UUID
  key: string;
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  summary: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

// Epic Specifics
interface EpicSpecifics {
  childIssueKeys: string[];
}

// Subtask Specifics
interface SubtaskSpecifics {
  parentIssueKey: string;
}

// Concrete Issue Types
interface Task extends BaseIssue {}
interface Story extends BaseIssue {}
interface Bug extends BaseIssue {}
interface Epic extends BaseIssue, EpicSpecifics {}
interface Subtask extends BaseIssue, SubtaskSpecifics {}

// Union Type
type AnyIssue = Task | Story | Epic | Bug | Subtask;

// DbSchema Interface
interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}

export { BaseIssue, EpicSpecifics, SubtaskSpecifics, Task, Story, Bug, Epic, Subtask, AnyIssue, DbSchema };
