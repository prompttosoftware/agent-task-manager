/**
 * Defines properties specific to Subtask issues.
 */
export interface SubtaskSpecifics {
  /**
   * The issue key of the parent task, story, bug, or epic this subtask belongs to.
   */
  parentIssueKey: string;
}
