/**
 * Generates an issue key based on issue type and a counter.
 * The format is 'ISSUE_TYPE_PREFIX-COUNTER'.
 *
 * @param counter - The sequential number for the key.
 * @param issueType - The type of the issue (e.g., 'Task', 'Story', 'Bug', 'Epic', 'Subtask').
 *                    It is assumed that this will be one of the normalized, expected types.
 * @returns A string formatted as 'ISSUE_TYPE_PREFIX-COUNTER'.
 */
export function generateIssueKey(counter: number, issueType: string): string {
  const prefixMap: { [key: string]: string } = {
    Task: 'TASK',
    Story: 'STOR',
    Bug: 'BUG',
    Epic: 'EPIC',
    Subtask: 'SUBT',
  };

  // The issueType is expected to be one of the keys in prefixMap due to
  // upstream normalization (e.g., by the calling service).
  const prefix = prefixMap[issueType];

  return `${prefix}-${counter}`;
}
