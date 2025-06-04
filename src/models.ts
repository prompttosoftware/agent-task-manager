import { v4 as uuidv4 } from 'uuid';

/**
 * @description The base structure for all issue types.
 */
export interface BaseIssue {
  /**
   * @description A unique identifier for the issue (UUID).
   * @type {string}
   */
  id: string;
  /**
   * @description A human-readable key for the issue (e.g., "TASK-1").
   * @type {string}
   */
  key: string;
  /**
   * @description The type of the issue.
   * @type {"Task" | "Story" | "Epic" | "Bug" | "Subtask"}
   */
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  /**
   * @description A brief summary of the issue.
   * @type {string}
   */
  summary: string;
  /**
   * @description An optional detailed description of the issue.
   * @type {string | undefined}
   */
  description?: string;
  /**
   * @description The current status of the issue in the workflow.
   * @type {"Todo" | "In Progress" | "Done"}
   */
  status: "Todo" | "In Progress" | "Done";
  /**
   * @description The timestamp when the issue was created (ISO8601).
   * @type {string}
   */
  createdAt: string;
  /**
   * @description The timestamp when the issue was last updated (ISO8601).
   * @type {string}
   */
  updatedAt: string;
}

/**
 * @description Specific properties for Epic issues.
 */
export interface EpicSpecifics {
  /**
   * @description An array of keys of issues that are children of this Epic.
   * @type {string[]}
   */
  childIssueKeys: string[];
}

export interface SubtaskSpecifics {
  parentIssueKey: string;
}

export interface Task extends BaseIssue {
  /**
   * @description The specific type for a Task issue.
   * @override
   * @type {"Task"}
   */
  issueType: "Task";
}

/**
 * @description Represents a Story issue.
 * @augments BaseIssue
 */
export interface Story extends BaseIssue {
  /**
   * @description The specific type for a Story issue.
   * @override
   * @type {"Story"}
   */
  issueType: "Story";
}

/**
 * @description Represents a Bug issue.
 * @augments BaseIssue
 */
export interface Bug extends BaseIssue {
  /**
   * @description The specific type for a Bug issue.
   * @override
   * @type {"Bug"}
   */
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
