import { Board } from '../interfaces/board';

// In-memory storage for boards (replace with database in a real application)
let boards: Board[] = [];

export const listBoards = async (): Promise<Board[]> => {
  return boards;
};

// Add more service functions as needed, e.g., to create, update, or delete boards.