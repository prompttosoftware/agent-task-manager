import { CreateBoardData, Board } from '../types/board';
import * as boardRepository from '../data/board.repository';

export const createBoard = async (boardData: CreateBoardData): Promise<Board> => {
  try {
    // Use the actual repository to create the board
    const newBoard: Board = await boardRepository.createBoard(boardData);
    return newBoard;
  } catch (error: any) {
    console.error('Error creating board:', error);
    throw new Error('Failed to create board');
  }
};
