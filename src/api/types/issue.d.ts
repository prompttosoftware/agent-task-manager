export interface Issue {
  id: number;
  summary: string;
  description: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IssueCreateRequest {
  summary: string;
  description: string;
  status: string;
}

export interface IssueUpdateRequest {
  summary?: string;
  description?: string;
  status?: string;
}
