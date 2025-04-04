export interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  assignee: string | null;
  reporter: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}
