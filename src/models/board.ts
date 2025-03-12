// src/models/board.ts

import { Issue } from './issue';

export interface Board {
  id: number;
  name: string;
  issues: Issue[];
  columns: string[];
}
