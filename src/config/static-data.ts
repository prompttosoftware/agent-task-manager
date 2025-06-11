// src/config/static-data.ts

/**
 * Issue Statuses
 * 11: To Do
 * 21: In Progress
 * 31: Done
 */
export enum IssueStatus {
  ToDo = 11,
  InProgress = 21,
  Done = 31,
}

/**
 * Issue Types
 * 1: Bug
 * 2: Story
 * 3: Task
 * 4: Sub-task
 * 5: Epic
 */
export enum IssueType {
  Bug = 1,
  Story = 2,
  Task = 3,
  SubTask = 4,
  Epic = 5,
}

/**
 * Issue Link Types
 * 1000: Blocks
 * 1001: Relates
 */
export enum IssueLinkType {
  Blocks = 1000,
  Relates = 1001,
}
