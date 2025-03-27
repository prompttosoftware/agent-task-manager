import { Board } from '../types';

// In-memory storage for boards
let boards: Board[] = [
  { id: '1', name: 'Board 1', description: 'First board' },
  { id: '2', name: 'Board 2', description: 'Second board' }
];

export const listBoardsService = async (): Promise<Board[]> => {
  return boards;
};
