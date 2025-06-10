// src/config/static-data.ts

// Statuses
export enum Status {
  ToDo = 11,
  InProgress = 21,
  Done = 31,
}

// Issue Types
export enum IssueType {
  Bug = 1,
  Story = 2,
  Task = 3,
  SubTask = 4,
  Epic = 5,
}

// Issue Link Types
export enum IssueLinkType {
  Blocks = 1000,
  Relates = 1001,
}
