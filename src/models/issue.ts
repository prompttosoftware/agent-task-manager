/**
 * Defines the base structure for an issue entity.
 * This file contains the interface representing an issue with its core properties.
 */

/**
 * Represents the base structure of an issue.
 * This interface defines the common properties shared by all types of issues.
 */
export interface BaseIssue {
  /**
   * The unique identifier for the issue.
   * @type {string} UUID format.
   */
  id: string;

  /**
   * A unique, human-readable key for the issue (e.g., "PROJ-123").
   * @type {string}
   */
  key: string;

  /**
   * The type of the issue.
   * @type {"Task" | "Story" | "Epic" | "Bug" | "Subtask"}
   */
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";

  /**
   * A brief summary or title of the issue.
   * @type {string}
   */
  summary: string;

  /**
   * A detailed description of the issue.
   * @type {string} Optional.
   */
  description?: string;

  /**
   * The current status of the issue in its workflow.
   * @type {"Todo" | "In Progress" | "Done"}
   */
  status: "Todo" | "In Progress" | "Done";

  /**
   * The timestamp when the issue was created.
   * @type {string} ISO 8601 format.
   */
  createdAt: string;

  /**
   * The timestamp when the issue was last updated.
   * @type {string} ISO 8601 format.
   */
  updatedAt: string;
}

/**
 * Specific properties for Epic issues.
 */
export interface EpicSpecifics {
  /**
   * An array of keys for child issues.
   * @type {string[]}
   */
  childIssueKeys: string[];
}

/**
 * Specific properties for Subtask issues.
 */
export interface SubtaskSpecifics {
  /**
   * The key of the parent issue.
   * @type {string}
   */
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
