/**
 * Specific properties for Epic issues.
 */
export interface EpicSpecifics {
  /**
   * An array of keys for child issues.
   */
  childIssueKeys: string[];
}

/**
 * Specific properties for Subtask issues.
 */
export interface SubtaskSpecifics {
  /**
   * The key of the parent issue.
   */
  parentIssueKey: string;
}
        
/**
 * Represents the base properties of an issue.
 *
 * @interface BaseIssue
 */
export interface BaseIssue {
  /**
   * Unique identifier for the issue, typically a UUID.
   */
  id: string;

  /**
   * The unique key of the issue (e.g., PROJ-123).
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
   * The current status of the issue in its workflow.
   */
  status: "Todo" | "In Progress" | "Done";

  /**
   * The timestamp when the issue was created, in ISO 8601 format.
   */
  createdAt: string;

  /**
   * The timestamp when the issue was last updated, in ISO 8601 format.
   */
  updatedAt: string;
}

/**
 * Represents a Task issue, extending BaseIssue.
 */
export interface Task extends BaseIssue {}

/**
 * Represents a Story issue, extending BaseIssue.
 */
export interface Story extends BaseIssue {}

/**
 * Represents a Bug issue, extending BaseIssue.
 */
export interface Bug extends BaseIssue {}

/**
 * Represents an Epic issue, extending BaseIssue and EpicSpecifics.
 */
export interface Epic extends BaseIssue, EpicSpecifics {}

/**
 * Represents a Subtask issue, extending BaseIssue and SubtaskSpecifics.
 */
export interface Subtask extends BaseIssue, SubtaskSpecifics {}

/**
 * A union type representing any possible issue type.
 */
export type AnyIssue = Task | Story | Epic | Bug | Subtask;
