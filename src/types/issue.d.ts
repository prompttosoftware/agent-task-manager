// Define issue related types here

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  // Add other relevant fields here based on your issue schema
}
