// src/data/board.repository.ts
import { db } from '../data/db';
import { Board } from '../types/board';

export const createBoard = async (boardData: Omit<Board, 'id'>): Promise<Board> => {
  try {
    const newBoard = await db.Board.create(boardData);
    return newBoard.toJSON() as Board;
  } catch (error: any) {
    console.error('Error creating board in repository:', error);
    throw new Error('Failed to create board in repository');
  }
};

export const getBoardById = async (id: number): Promise<Board | null> => {
  try {
    const board = await db.Board.findByPk(id);
    if (board) {
      return board.toJSON() as Board;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching board by ID from repository:', error);
    throw new Error('Failed to fetch board by ID from repository');
  }
};

export const getAllBoards = async (): Promise<Board[]> => {
  try {
    const boards = await db.Board.findAll();
    return boards.map((board) => board.toJSON() as Board);
  } catch (error: any) {
    console.error('Error fetching all boards from repository:', error);
    throw new Error('Failed to fetch all boards from repository');
  }
};

export const updateBoard = async (id: number, boardData: Partial<Board>): Promise<Board | null> => {
  try {
    const board = await db.Board.findByPk(id);
    if (!board) {
      return null;
    }

    await board.update(boardData);
    return board.toJSON() as Board;
  } catch (error: any) {
    console.error('Error updating board in repository:', error);
    throw new Error('Failed to update board in repository');
  }
};

export const deleteBoard = async (id: number): Promise<boolean> => {
  try {
    const board = await db.Board.findByPk(id);
    if (!board) {
      return false;
    }

    await board.destroy();
    return true;
  } catch (error: any) {
    console.error('Error deleting board from repository:', error);
    throw new Error('Failed to delete board from repository');
  }
};
