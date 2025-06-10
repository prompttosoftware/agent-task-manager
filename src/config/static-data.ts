// src/config/static-data.ts

export enum IssueStatus {
  ToDo = 11,
  InProgress = 21,
  Done = 31,
}

export enum IssueType {
  Bug = 1,
  Story = 2,
  Task = 3,
  SubTask = 4,
  Epic = 5,
}

export enum IssueLinkType {
  Blocks = 1000,
  Relates = 1001,
}
