/**
 * Generates a unique issue key.
 * @param issueType The type of the issue (e.g., "Task", "Epic").
 * @param counter The current global counter.
 * @returns The generated issue key.
 * @throws Error if the issue type is unknown.
 */
export function generateIssueKey(issueType: string, counter: number): string {
  const typePrefix = {
    Task: "TASK",
    Story: "STOR",
    Epic: "EPIC",
    Bug: "BUG",
    Subtask: "SUBT",
  }[issueType];

  if (!typePrefix) {
    throw new Error(`Unknown issue type: ${issueType}`);
  }

  return `${typePrefix}-${counter}`;
}
