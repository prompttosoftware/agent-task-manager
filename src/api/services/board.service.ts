import { Board } from '../types/board';
import { db } from '../../src/db/database'; // Assuming you have a database connection setup

export class BoardService {
  async createBoard(boardData: Board): Promise<Board> {
    try {
      const result = await db.prepare(
        `INSERT INTO boards (name, description) VALUES (?, ?)`
      ).run(boardData.name, boardData.description);

      const newBoard: Board = {
        id: result.lastInsertRowid,
        name: boardData.name,
        description: boardData.description,
      };

      return newBoard;
    } catch (error: any) {
      console.error('Error creating board in service:', error);
      throw new Error(`Failed to create board: ${error.message}`);
    }
  }

  async getBoards(): Promise<Board[]> {
    try {
      const rows = db.prepare('SELECT id, name, description FROM boards').all() as Board[];
      return rows;
    } catch (error: any) {
      console.error('Error getting boards in service:', error);
      throw new Error(`Failed to get boards: ${error.message}`);
    }
  }
}
