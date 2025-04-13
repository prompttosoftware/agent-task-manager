// src/api/services/board.service.ts
import { Board } from '../types/board.d.ts';
import { v4 as uuidv4 } from 'uuid';

// Simulate a database (replace with your actual database interaction)
const boards: { [id: string]: Board } = {};

export class BoardService {

  /**
   * Retrieves a board by its ID.
   * @param id The ID of the board to retrieve.
   * @returns A promise that resolves to the board, or null if not found.
   * @throws Error if there's an issue accessing the database.
   */
  async getBoardById(id: string): Promise<Board | null> {
    try {
      // Simulate database query
      const board = boards[id];
      return board || null;
    } catch (error: any) {
      console.error(`Error getting board with id ${id}:`, error);
      throw new Error(`Failed to get board: ${error.message}`);
    }
  }

  /**
   * Lists all boards.
   * @returns A promise that resolves to an array of boards.
   * @throws Error if there's an issue accessing the database.
   */
  async listBoards(): Promise<Board[]> {
    try {
      // Simulate database query
      return Object.values(boards);
    } catch (error: any) {
      console.error('Error listing boards:', error);
      throw new Error(`Failed to list boards: ${error.message}`);
    }
  }

  /**
   * Creates a new board.
   * @param boardData The data for the new board.
   * @returns A promise that resolves to the newly created board.
   * @throws Error if there's an issue creating the board in the database.
   */
  async createBoard(boardData: Omit<Board, 'id'>): Promise<Board> {
    try {
      const id = uuidv4();
      const newBoard: Board = { id, ...boardData };
      boards[id] = newBoard;

      return newBoard;
    } catch (error: any) {
      console.error('Error creating board:', error);
      throw new Error(`Failed to create board: ${error.message}`);
    }
  }

  /**
   * Updates an existing board.
   * @param id The ID of the board to update.
   * @param boardData The data to update the board with.
   * @returns A promise that resolves to the updated board, or null if not found.
   * @throws Error if there's an issue updating the board in the database.
   */
  async updateBoard(id: string, boardData: Partial<Omit<Board, 'id'>>): Promise<Board | null> {
    try {
      if (!boards[id]) {
        return null; // Board not found
      }

      const existingBoard = boards[id];
      const updatedBoard: Board = { ...existingBoard, ...boardData };
      boards[id] = updatedBoard;

      return updatedBoard;
    } catch (error: any) {
      console.error(`Error updating board with id ${id}:`, error);
      throw new Error(`Failed to update board: ${error.message}`);
    }
  }

  /**
   * Deletes a board.
   * @param id The ID of the board to delete.
   * @returns A promise that resolves to void.
   * @throws Error if there's an issue deleting the board from the database.
   */
  async deleteBoard(id: string): Promise<boolean> {
    try {
      if (!boards[id]) {
        return false; // Board not found
      }
      delete boards[id];
      return true;
    } catch (error: any) {
      console.error(`Error deleting board with id ${id}:`, error);
      throw new Error(`Failed to delete board: ${error.message}`);
    }
  }
}
