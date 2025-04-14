export interface Issue {
  id: string;
  title: string;
  description: string;
  assignee: string;
  reporter: string;
  status: IssueStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum IssueStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Resolved = 'Resolved',
  Closed = 'Closed',
}
