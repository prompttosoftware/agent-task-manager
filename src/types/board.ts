export enum BoardStatusCategory {
  open = 'open',
  indeterminate = 'indeterminate',
  done = 'done',
}

export interface BoardStatus {
  id: string | number;
  name: string;
  category: BoardStatusCategory;
}

export interface Board {
  id: string | number;
  name: string;
  statuses: BoardStatus[];
}

export interface Issue {
  id: string;
  key: string;
  summary: string;
  status: BoardStatus;
  boardId: number;
}
