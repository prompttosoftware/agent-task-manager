// src/config.ts

export const DEFAULT_ISSUE_TYPES = ['Task', 'Subtask', 'Story', 'Bug', 'Epic'];

export const ISSUE_TYPE_STORAGE = 'string'; // or 'lookup_table'

export const DEFAULT_TRANSITIONS = [
  { from: 'To Do', to: 'In Progress' },
  { from: 'In Progress', to: 'Done' },
  { from: 'To Do', to: 'Done' },
  { from: 'In Progress', to: 'To Do' },
];