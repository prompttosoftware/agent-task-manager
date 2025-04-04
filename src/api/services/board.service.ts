import { Board } from '../types/board';
import { db } from '../../src/db/database';

export class BoardService {

  async createBoard(boardData: Board): Promise<Board> {
    try {
      const result = await db.query(
        'INSERT INTO boards (name, description) VALUES ($1, $2) RETURNING *', 
        [boardData.name, boardData.description]
      );
      return result.rows[0];
    } catch (error: any) {
      console.error('Error creating board in service:', error);
      throw new Error(error.message || 'Failed to create board in database');
    }
  }

  async getBoards(): Promise<Board[]> {
    try {
      const result = await db.query('SELECT * FROM boards');
      return result.rows;
    } catch (error: any) {
      console.error('Error getting boards in service:', error);
      throw new Error(error.message || 'Failed to get boards from database');
    }
  }

  async getBoardById(boardId: number): Promise<Board | undefined> {
    try {
      const result = await db.query('SELECT * FROM boards WHERE id = $1', [boardId]);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error: any) {
      console.error('Error getting board by ID in service:', error);
      throw new Error(error.message || 'Failed to get board from database');
    }
  }
}
