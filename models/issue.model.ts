import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the possible statuses for an issue.
 */
type IssueStatus = "Todo" | "In Progress" | "Done";

/**
 * Represents the base properties for all issue types.
 */
interface BaseIssue {
  /**
   * Unique identifier for the issue.
   */
  id: string; // UUID
  /**
   * A human-readable key for the issue, e.g., ISSUE-123.
   */
  key: string;
  /**
   * The type of the issue.
   */
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  /**
   * A short summary of the issue.
   */
  summary: string;
  /**
   * A detailed description of the issue (optional).
   */
  description?: string;
  /**
   * The current status of the issue.
   */
  status: IssueStatus;
  /**
   * The timestamp when the issue was created (ISO8601).
   */
  createdAt: string; // ISO8601
  /**
   * The timestamp when the issue was last updated (ISO8601).
   */
  updatedAt: string; // ISO8601
}

/**
 * Represents the specifics for an Epic issue.
 */
interface EpicSpecifics {
  /**
   * An array of keys for child issues.
   */
  childIssueKeys: string[];
}

/**
 * Represents the specifics for a Subtask issue.
 */
interface SubtaskSpecifics {
  /**
   * The key of the parent issue.
   */
  parentIssueKey: string;
}

/**
 * Represents a Task issue.
 */
interface Task extends BaseIssue {
  /**
   * The type of the issue.
   */
  issueType: "Task";
}

/**
 * Represents a Story issue.
 */
interface Story extends BaseIssue {
  /**
   * The type of the issue.
   */
  issueType: "Story";
}

/**
 * Represents a Bug issue.
 */
interface Bug extends BaseIssue {
  /**
   * The type of the issue.
   */
  issueType: "Bug";
}

/**
 * Represents an Epic issue.
 */
interface Epic extends BaseIssue, EpicSpecifics {
  /**
   * The type of the issue.
   */
  issueType: "Epic";
}

/**
 * Represents a Subtask issue.
 */
interface Subtask extends BaseIssue, SubtaskSpecifics {
  /**
   * The type of the issue.
   */
  issueType: "Subtask";
}


/**
 * Represents any type of issue.  A union of all issue types.
 */
type AnyIssue = Task | Story | Epic | Bug | Subtask;

/**
 * Represents the database schema.
 */
interface DbSchema {
  /**
   * An array of issues in the database.
   */
  issues: AnyIssue[];
  /**
   * A counter for generating unique issue keys.
   */
  issueKeyCounter: number;
}

export { BaseIssue, EpicSpecifics, SubtaskSpecifics, Task, Story, Bug, Epic, Subtask, AnyIssue, DbSchema, IssueStatus };
