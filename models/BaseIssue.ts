/**
 * Represents the base structure of an issue.
 */

/**
 * Defines the possible types for an issue.
 */
export type IssueType = "Task" | "Story" | "Epic" | "Bug" | "Subtask";

/**
 * Defines the possible statuses for an issue.
 */
export type IssueStatus = "Todo" | "In Progress" | "Done";

/**
 * Specific properties for an Epic issue type.
 */
export interface EpicSpecifics {
  childIssueKeys: string[];
}

/**
 * Specific properties for a Subtask issue type.
 */
export interface SubtaskSpecifics {
  parentIssueKey: string;
}

/**
 * Represents the base properties for an issue entity.
 * This interface can be extended for more specific issue types or additional fields.
 */
export interface BaseIssue {
  /**
   * Unique identifier for the issue, typically a UUID.
   */
  id: string;

  /**
   * A short, unique key for the issue (e.g., "PROJ-123").
   */
  key: string;

  /**
   * The type of the issue (e.g., "Story", "Bug").
   */
  issueType: IssueType;

  /**
   * A concise summary of the issue.
   */
  summary: string;

  /**
   * An optional detailed description of the issue.
   */
  description?: string;

  /**
   * The current status of the issue in its workflow.
   */
  status: IssueStatus;

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
 * Represents a concrete Task issue type.
 */
export interface Task extends BaseIssue {
  issueType: "Task";
}

/**
 * Represents a concrete Story issue type.
 */
export interface Story extends BaseIssue {
  issueType: "Story";
}

/**
 * Represents a concrete Bug issue type.
 */
export interface Bug extends BaseIssue {
  issueType: "Bug";
}

/**
 * Represents a concrete Epic issue type, including Epic-specific properties.
 */
export interface Epic extends BaseIssue, EpicSpecifics {
  issueType: "Epic";
}

/**
 * Represents a concrete Subtask issue type, including Subtask-specific properties.
 */
export interface Subtask extends BaseIssue, SubtaskSpecifics {
  issueType: "Subtask";
}

/**
 * A union type representing any of the concrete issue types.
 */
export type AnyIssue = Task | Story | Epic | Bug | Subtask;
