// src/types/issue.ts

export interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    [key: string]: any; // Allow for other fields
  };
  // Add other relevant fields as needed based on issue.service.ts and issue.controller.ts
}
