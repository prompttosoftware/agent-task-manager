import { Board } from '../types/board.d';
import { db } from './db';

export const getBoards = async (): Promise<Board[]> => {
  try {
    // Assuming 'boards' is the table name and you have a Board model/interface
    const boards: Board[] = await db.query('SELECT * FROM boards');
    return boards;
  } catch (error: any) {
    console.error('Error fetching boards from repository:', error);
    throw new Error('Failed to fetch boards from repository');
  }
};
