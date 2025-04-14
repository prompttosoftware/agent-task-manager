import { Board } from '../types/board.d';
import { getBoards as getBoardsFromRepo } from '../data/board.repository';

export const getAllBoards = async (): Promise<Board[]> => {
  try {
    const boards = await getBoardsFromRepo();
    return boards;
  } catch (error: any) {
    console.error('Error in getAllBoards service:', error);
    throw new Error('Failed to fetch boards from service');
  }
};
