// src/models/api/issueResponse.ts

/**
 * Defines the structure for issue data returned by the API.
 */
export interface IssueResponse {
  /**
   * The unique identifier of the issue (e.g., MongoDB ObjectID as string).
   */
  _id: string;

  /**
   * The human-readable key of the issue (e.g., "PROJ-123").
   */
  key: string;

  /**
   * The type of the issue (e.g., "Epic", "Story", "Bug").
   */
  issuetype: string;

  /**
   * A short summary or title of the issue.
   */
  summary: string;

  /**
   * A detailed description of the issue.
   */
  description: string;
}