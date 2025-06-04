import { v4 as uuidv4 } from 'uuid';

/**
 * Specific properties for Epic issues.
 */
export interface EpicSpecifics {
  /**
   * A list of keys of issues that are children of this epic.
   */
  childIssueKeys: string[];
}

/**
 * Specific properties for Subtask issues.
 */
export interface SubtaskSpecifics {
  /**
   * The key of the parent issue for this subtask.
   */
  parentIssueKey: string;
}

/**
 * The base interface representing common properties across all issue types.
 */
export interface BaseIssue {
  /**
   * The unique identifier for the issue (UUID).
   */
  id: string; // UUID
  /**
   * The unique human-readable key for the issue (e.g., PROJ-123).
   */
  key: string;
  /**
   * The type of the issue.
   */
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  /**
   * A brief summary or title for the issue.
   */
  summary: string;
  /**
   * A detailed description of the issue (optional).
   */
  description?: string;
  /**
   * The current status of the issue in its workflow.
   */
  status: "Todo" | "In Progress" | "Done";
  /**
   * The timestamp when the issue was created (ISO8601 format).
   */
  createdAt: string; // ISO8601
  /**
   * The timestamp when the issue was last updated (ISO8601 format).
   */
  updatedAt: string; // ISO8601
}

/**
 * A union type representing all possible issue type values.
 */
export type IssueType = BaseIssue['issueType'];

/**
 * Represents a Task issue, inheriting common properties from BaseIssue.
 */
export interface Task extends BaseIssue {
  issueType: "Task";
}

/**
 * Represents a Story issue, inheriting common properties from BaseIssue.
 */
export interface Story extends BaseIssue {
  issueType: "Story";
}

/**
 * Represents a Bug issue, inheriting common properties from BaseIssue.
 */
export interface Bug extends BaseIssue {
  issueType: "Bug";
}

/**
 * Represents an Epic issue, inheriting common properties from BaseIssue and specific properties from EpicSpecifics.
 */
export interface Epic extends BaseIssue, EpicSpecifics {
  issueType: "Epic";
}

/**
 * Represents a Subtask issue, inheriting common properties from BaseIssue and specific properties from SubtaskSpecifics.
 */
export interface Subtask extends BaseIssue, SubtaskSpecifics {
  issueType: "Subtask";
}

/**
 * A union type representing any possible issue type.
 */
export type AnyIssue = Task | Story | Epic | Bug | Subtask;
