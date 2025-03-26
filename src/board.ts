export interface Board {
  id: string | number;
  name: string;
  statuses: BoardStatus[];
}

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
