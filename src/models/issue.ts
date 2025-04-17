// src/models/issue.ts

export interface Issue {
  id: number;
  title: string;
  epic_name?: string;
  epic_id?: number;
  parent_id?: number;
  // Add other issue fields here as needed
}
