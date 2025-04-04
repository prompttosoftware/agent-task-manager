// src/api/controllers/board.controller.ts

import { Request, Response } from 'express';
import { validationResult, param, body } from 'express-validator';
import { BoardService } from '../services/board.service';
import { Board, BoardCreateDto, BoardUpdateDto } from '../types/board.d';
import { StatusCodes } from 'http-status-codes';
import { HttpException } from '../../exceptions/HttpException';

const boardService = new BoardService(); // Instantiate the service

export const getBoard = async (req: Request, res: Response) => {
  // GET /api/boards/:boardId
  try {
    await param('boardId').isString().withMessage('Invalid board ID').run(req); // Validate as string, since it's an id
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }

    const boardId = req.params.boardId;
    const board = await boardService.getBoard(boardId);
    if (!board) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found' });
    }
    res.status(StatusCodes.OK).json(board);
  } catch (error: any) {
    console.error('Error getting board:', error);
    if (error instanceof HttpException) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to get board: ' + (error.message || 'Internal server error') });
  }
};

export const listBoards = async (req: Request, res: Response) => {
  // GET /api/boards
  try {
    const boards = await boardService.listBoards();
    res.status(StatusCodes.OK).json(boards);
  } catch (error: any) {
    console.error('Error listing boards:', error);
    if (error instanceof HttpException) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to list boards: ' + (error.message || 'Internal server error') });
  }
};

export const createBoard = async (req: Request, res: Response) => {
  // POST /api/boards
  try {
    // Validate the request body
    await body('name').isString().notEmpty().withMessage('Name is required').run(req);
    await body('description').optional().isString().run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }

    const boardData: BoardCreateDto = req.body;
    const createdBoard = await boardService.createBoard(boardData);
    res.status(StatusCodes.CREATED).json(createdBoard);
  } catch (error: any) {
    console.error('Error creating board:', error);
    if (error instanceof HttpException) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create board: ' + (error.message || 'Internal server error') });
  }
};

export const updateBoard = async (req: Request, res: Response) => {
  // PUT /api/boards/:boardId
  try {
    await param('boardId').isString().withMessage('Invalid board ID').run(req); // Validate as string, since it's an id
    // Validate the request body
    await body('name').optional().isString().withMessage('Name must be a string').run(req);
    await body('description').optional().isString().withMessage('Description must be a string').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }

    const boardId = req.params.boardId;
    const boardData: BoardUpdateDto = req.body;
    const board = await boardService.updateBoard(boardId, boardData);

    if (!board) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found' });
    }
    res.status(StatusCodes.OK).json(board);
  } catch (error: any) {
    console.error('Error updating board:', error);
    if (error instanceof HttpException) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to update board: ' + (error.message || 'Internal server error') });
  }
};

export const deleteBoard = async (req: Request, res: Response) => {
  // DELETE /api/boards/:boardId
  try {
    await param('boardId').isString().withMessage('Invalid board ID').run(req); // Validate as string, since it's an id

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
    }

    const boardId = req.params.boardId;
    await boardService.deleteBoard(boardId);
    res.status(StatusCodes.NO_CONTENT).send(); // No Content on success
  } catch (error: any) {
    console.error('Error deleting board:', error);
    if (error instanceof HttpException) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Failed to delete board: ' + (error.message || 'Internal server error') });
  }
};