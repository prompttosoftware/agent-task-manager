import { Board, BoardCreate, BoardUpdate } from '../types/board';
import * as db from '../data/db';
import { v4 as uuidv4 } from 'uuid';

export interface BoardService {
  getBoard(boardId: string): Promise<Board | undefined>;
  getAllBoards(): Promise<Board[]>;
  createBoard(board: BoardCreate): Promise<Board>;
  updateBoard(boardId: string, board: BoardUpdate): Promise<Board | undefined>;
  deleteBoard(boardId: string): Promise<void>;
}

export class BoardServiceImpl implements BoardService {
  async getBoard(boardId: string): Promise<Board | undefined> {
    try {
      const board = db.getBoard(boardId);
      return board;
    } catch (error: any) {
      console.error('Error getting board:', error);
      throw new Error(error.message || 'Failed to get board');
    }
  }

  async getAllBoards(): Promise<Board[]> {
    try {
      return db.getAllBoards();
    } catch (error: any) {
      console.error('Error getting all boards:', error);
      throw new Error(error.message || 'Failed to get all boards');
    }
  }

  async createBoard(board: BoardCreate): Promise<Board> {
    try {
      const newBoard: Board = {
        id: uuidv4(),
        ...board,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.createBoard(newBoard);
      return newBoard;
    } catch (error: any) {
      console.error('Error creating board:', error);
      throw new Error(error.message || 'Failed to create board');
    }
  }

  async updateBoard(boardId: string, boardUpdate: BoardUpdate): Promise<Board | undefined> {
    try {
      const updatedBoard = await db.updateBoard(boardId, boardUpdate);
      return updatedBoard;
    } catch (error: any) {
      console.error('Error updating board:', error);
      throw new Error(error.message || 'Failed to update board');
    }
  }

  async deleteBoard(boardId: string): Promise<void> {
    try {
      await db.deleteBoard(boardId);
    } catch (error: any) {
      console.error('Error deleting board:', error);
      throw new Error(error.message || 'Failed to delete board');
    }
  }
}

export const boardService: BoardService = new BoardServiceImpl();