/**
 * Represents the common properties shared by all issue types, such as Task, Story, Epic, Bug, or Subtask.
 */
export interface BaseIssue {
  /**
   * Unique identifier for the issue.
   * @example "a1b2c3d4-e5f6-7890-1234-567890abcdef"
   */
  id: string; // UUID
  /**
   * Human-readable key for the issue, often used in UI.
   * @example "PROJ-123"
   */
  key: string;
  /**
   * The type of issue.
   */
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  /**
   * A brief summary or title of the issue.
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
   * The timestamp when the issue was created.
   * @example "2023-10-26T10:00:00.000Z"
   */
  createdAt: string; // ISO8601
  /**
   * The timestamp when the issue was last updated.
   * @example "2023-10-26T10:00:00.000Z"
   */
  updatedAt: string; // ISO8601
}
