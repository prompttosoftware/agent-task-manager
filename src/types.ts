export interface Board {
  id: string | number;
  name: string;
  statuses: BoardStatus[];
  issueIds: (string | number)[];
}

export interface BoardStatus {
  id: string | number;
  name: string;
  category: 'open' | 'indeterminate' | 'done';
}

export interface Issue {
  id: string | number;
  summary: string;
  description: string;
  boardId: string | number | null;
}
