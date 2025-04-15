import { db } from '../data/db';
import { Board } from '../types/board';

export interface BoardRepository {
  createBoard(boardData: Omit<Board, 'id'>): Promise<Board>;
  getBoardById(id: number): Promise<Board | undefined>;
  getAllBoards(): Promise<Board[]>;
  updateBoard(id: number, boardData: Partial<Board>): Promise<Board | undefined>;
  deleteBoard(id: number): Promise<void>;
}

export class BoardRepositoryImpl implements BoardRepository {
  async createBoard(boardData: Omit<Board, 'id'>): Promise<Board> {
    const id = db.boards.length + 1;
    const newBoard: Board = {
      id,
      ...boardData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.boards.push(newBoard;
    return newBoard;
  }

  async getBoardById(id: number): Promise<Board | undefined> {
    return db.boards.find((board) => board.id === id);
  }

  async getAllBoards(): Promise<Board[]> {
    return db.boards;
  }

  async updateBoard(id: number, boardData: Partial<Board>): Promise<Board | undefined> {
    const boardIndex = db.boards.findIndex((board) => board.id === id);
    if (boardIndex === -1) {
      return undefined;
    }
    db.boards[boardIndex] = {
      ...db.boards[boardIndex],
      ...boardData,
      updatedAt: new Date(),
    };
    return db.boards[boardIndex];
  }

  async deleteBoard(id: number): Promise<void> {
    db.boards = db.boards.filter((board) => board.id !== id);
  }
}

// export const BoardRepository = new BoardRepositoryImpl();
