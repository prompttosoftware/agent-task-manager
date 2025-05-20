/**
 * Defines properties specific to Epic issues.
 */
export interface EpicSpecifics {
  /**
   * An array of strings representing the keys of issues linked as children to this epic.
   */
  childIssueKeys: string[];
}
