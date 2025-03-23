export interface Issue {
  id: string;
  summary: string;
  description?: string;
  boardId: string | null;
}

export interface Board {
  id: string;
  name: string;
  issueIds: string[];
}
