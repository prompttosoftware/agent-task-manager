// src/models/board.ts

import { Issue } from './issue';

export interface Board {
  id: string;
  name: string;
  issues: Issue[];
  // Add other relevant fields like columns, etc.
}
