// src/api/services/board.service.ts
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import db from '../../db/database';
import { Board, BoardCreateDto, BoardUpdateDto } from '../../types/board.d';
import { StatusCodes } from 'http-status-codes';
import { HttpException } from '../../exceptions/HttpException';

export class BoardService {
  async getBoard(boardId: string): Promise<Board | null> {
    try {
      const row = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId) as Board | undefined;
      if (!row) {
        return null;
      }
      return row;
    } catch (error: any) {
      console.error('Error fetching board:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch board.');
    }
  }

  async listBoards(): Promise<Board[]> {
    try {
      const rows = db.prepare('SELECT * FROM boards').all() as Board[];
      return rows;
    } catch (error: any) {
      console.error('Error listing boards:', error);
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to list boards.');
    }
  }

  async createBoard(boardData: BoardCreateDto): Promise<Board> {
    try {
      const boardCreateDto = plainToClass(BoardCreateDto, boardData);
      await validateOrReject(boardCreateDto);

      const result = db.prepare('INSERT INTO boards (name, description) VALUES (?, ?)').run(
        boardCreateDto.name,
        boardCreateDto.description,
      );

      const createdBoard = {
        id: result.lastInsertRowid as string, // Assuming 'id' is a string in Board type.
        name: boardCreateDto.name,
        description: boardCreateDto.description,
      };

      return createdBoard as Board;
    } catch (error: any) {
      console.error('Error creating board:', error);
      if (Array.isArray(error) && error.length > 0 && error[0].constraints) {
        throw new HttpException(StatusCodes.BAD_REQUEST, Object.values(error[0].constraints).join(', '));
      }
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create board.');
    }
  }

  async updateBoard(boardId: string, boardData: BoardUpdateDto): Promise<Board | null> {
    try {
      const boardUpdateDto = plainToClass(BoardUpdateDto, boardData);
      await validateOrReject(boardUpdateDto);

      const existingBoard = await this.getBoard(boardId);
      if (!existingBoard) {
        return null;
      }

      const result = db.prepare('UPDATE boards SET name = ?, description = ? WHERE id = ?').run(
        boardUpdateDto.name !== undefined ? boardUpdateDto.name : existingBoard.name,
        boardUpdateDto.description !== undefined ? boardUpdateDto.description : existingBoard.description,
        boardId,
      );

      if (result.changes === 0) {
        return existingBoard; // Return the original board if no changes were made.
      }

      // Retrieve the updated board to return it.
      const updatedBoard = await this.getBoard(boardId);
      return updatedBoard;
    } catch (error: any) {
      console.error('Error updating board:', error);
      if (Array.isArray(error) && error.length > 0 && error[0].constraints) {
        throw new HttpException(StatusCodes.BAD_REQUEST, Object.values(error[0].constraints).join(', '));
      }
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update board.');
    }
  }

  async deleteBoard(boardId: string): Promise<void> {
    try {
      const result = db.prepare('DELETE FROM boards WHERE id = ?').run(boardId);
      if (result.changes === 0) {
        throw new HttpException(StatusCodes.NOT_FOUND, 'Board not found.');
      }
    } catch (error: any) {
      console.error('Error deleting board:', error);
      if (error instanceof HttpException) {
        throw error; // Re-throw the HttpException to maintain the correct status code.
      }
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete board.');
    }
  }
}