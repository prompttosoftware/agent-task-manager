import { Board } from '../types/board';

// In-memory database (replace with a real database like PostgreSQL, MongoDB, etc.)
let boards: Board[] = [];

export const getBoards = () => boards;

export const setBoards = (newBoards: Board[]) => {
  boards = newBoards;
};
