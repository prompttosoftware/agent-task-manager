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

export const deleteBoard = async (boardId: string): Promise<void> => {
  try {
    await boardRepository.deleteBoard(boardId);
  } catch (error: any) {
    console.error('Error deleting board:', error);
    throw new Error('Failed to delete board');
  }
};

export const getBoard = async (boardId: string): Promise<Board | null> => {
  try {
    const board = await boardRepository.getBoard(boardId);
    return board;
  } catch (error: any) {
    console.error('Error getting board:', error);
    throw new Error('Failed to get board');
  }
};
