// src/services/board.service.ts

import { Board } from '../types/board';
import { v4 as uuidv4 } from 'uuid';
import { Sequelize } from 'sequelize';

// Database configuration (replace with your actual database configuration)
const sequelize = new Sequelize('agent_task_manager', 'user', 'password', {
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
});

// Define the Board model
const BoardModel = sequelize.define<Board>('Board', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  ownerId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
});

/**
 * Creates a new board.
 * @param boardData - The data for the new board.  Should include name and ownerId.  Description is optional.
 * @returns The newly created board.
 * @throws Error if board creation fails or data is invalid.
 */
export const createBoard = async (boardData: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Promise<Board> => {
  try {
    // Data validation
    if (!boardData.name || boardData.name.trim() === '') {
      throw new Error('Board name is required.');
    }
    if (!boardData.ownerId || boardData.ownerId.trim() === '') {
      throw new Error('Owner ID is required.');
    }

    const newBoard = await BoardModel.create(boardData);
    return newBoard.toJSON() as Board;
  } catch (error: any) {
    console.error('Error creating board:', error);
    throw new Error(`Failed to create board: ${error.message}`);
  }
};

/**
 * Retrieves a board by its ID.
 * @param id - The ID of the board to retrieve.
 * @returns The board, or null if not found.
 * @throws Error if retrieval fails.
 */
export const getBoard = async (id: string): Promise<Board | null> => {
  try {
    if (!id) {
      throw new Error('Board ID is required.');
    }

    const board = await BoardModel.findByPk(id);
    return board ? (board.toJSON() as Board) : null;
  } catch (error: any) {
    console.error('Error getting board:', error);
    throw new Error(`Failed to get board: ${error.message}`);
  }
};

/**
 * Updates an existing board.
 * @param id - The ID of the board to update.
 * @param boardData - The data to update the board with.
 * @returns The updated board, or null if not found.
 * @throws Error if update fails or data is invalid.
 */
export const updateBoard = async (
  id: string,
  boardData: Partial<Omit<Board, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Board | null> => {
  try {
    if (!id) {
      throw new Error('Board ID is required.');
    }

    // Data validation (example: checking if name is provided)
    if (boardData.name && boardData.name.trim() === '') {
      throw new Error('Board name cannot be empty.');
    }

    const [updatedRows, [updatedBoard]] = await BoardModel.update(boardData, {
      where: { id },
      returning: true,
    });

    if (updatedRows === 0) {
      return null;
    }

    return updatedBoard?.toJSON() as Board || null;
  } catch (error: any) {
    console.error('Error updating board:', error);
    throw new Error(`Failed to update board: ${error.message}`);
  }
};

/**
 * Deletes a board by its ID.
 * @param id - The ID of the board to delete.
 * @returns True if the board was deleted, false otherwise.
 * @throws Error if deletion fails.
 */
export const deleteBoard = async (id: string): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('Board ID is required.');
    }

    const deletedRows = await BoardModel.destroy({ where: { id } });
    return deletedRows > 0;
  } catch (error: any) {
    console.error('Error deleting board:', error);
    throw new Error(`Failed to delete board: ${error.message}`);
  }
};

/**
 * Lists all boards.
 * @returns An array of all boards.
 * @throws Error if listing fails.
 */
export const listBoards = async (): Promise<Board[]> => {
  try {
    const boards = await BoardModel.findAll();
    return boards.map((board) => board.toJSON() as Board);
  } catch (error: any) {
    console.error('Error listing boards:', error);
    throw new Error(`Failed to list boards: ${error.message}`);
  }
};
