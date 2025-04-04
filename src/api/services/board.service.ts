import { Board } from '../models/board';
import { db } from '../../src/api/db/database';

export class BoardService {
  async createBoard(boardData: { name: string; description: string }): Promise<Board> {
    try {
      const result = await db.query(
        'INSERT INTO boards (name, description) VALUES ($1, $2) RETURNING id, name, description', // Returning the inserted data
        [boardData.name, boardData.description]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to create board');
      }

      const createdBoard = result.rows[0];
      return createdBoard;
    } catch (error: any) {
      console.error('Error in createBoard service:', error);
      throw new Error(error.message || 'Failed to create board in the database');
    }
  }
}