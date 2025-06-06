import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the base properties for an issue.
 */
export interface BaseIssue {
  /**
   * The unique identifier for the issue (UUID).
   */
  id: string; // UUID
  /**
   * A human-readable, unique key generated for the issue (e.g., PROJ-123).
   */
  key: string;
  /**
   * The type of the issue.
   */
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  /**
   * A brief summary of the issue.
   */
  summary: string;
  /**
   * A detailed description of the issue.
   */
  description?: string;
  /**
   * The current status of the issue in the workflow.
   */
  status: "Todo" | "In Progress" | "Done";
  /**
   * The timestamp when the issue was created (ISO8601 format).
   */
  createdAt: string; // ISO8601
  /**
   * The timestamp when the issue was last updated (ISO8601 format).
   */
  updatedAt: string; // ISO8601 - Set to current timestamp using new Date().toISOString()
}

/**
 * Represents properties specific to Epic issues.
 */
export interface EpicSpecifics {
  /**
   * An array of keys of issues that are children of this Epic.
   */
  childIssueKeys: string[];
}

/**
 * Represents properties specific to Subtask issues.
 */
export interface SubtaskSpecifics {
  /**
   * The key of the parent issue this Subtask belongs to.
   */
  parentIssueKey: string;
}

/**
 * Represents a Task issue, inheriting base properties.
 */
export interface Task extends BaseIssue {
  issueType: "Task";
}

/**
 * Represents a Story issue, inheriting base properties.
 */
export interface Story extends BaseIssue {
  issueType: "Story";
}

/**
 * Represents a Bug issue, inheriting base properties.
 */
export interface Bug extends BaseIssue {
  issueType: "Bug";
}

/**
 * Represents an Epic issue, inheriting base properties and including specific properties for Epics.
 */
export interface Epic extends BaseIssue, EpicSpecifics {
  issueType: "Epic";
}

/**
 * Represents a Subtask issue, inheriting base properties and including specific properties for Subtasks.
 */
export interface Subtask extends BaseIssue, SubtaskSpecifics {
  issueType: "Subtask";
}

/**
 * Represents any possible issue type.
 */
export type AnyIssue = Task | Story | Epic | Bug | Subtask;

/**
 * Represents the structure of the in-memory database schema.
 */
export interface DbSchema {
  /**
   * An array containing all issues in the database.
   */
  issues: AnyIssue[];
  /**
   * A counter used to generate unique issue keys sequentially.
   */
  issueKeyCounter: number;
}
