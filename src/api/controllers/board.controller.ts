// src/api/controllers/board.controller.ts

import { Request, Response } from 'express';
import { validationResult, param, body } from 'express-validator';
import * as boardService from '../services/board.service';
import { Board } from '../types/board.d';

export const getBoard = async (req: Request, res: Response) => { // GET /api/boards/:boardId
    try {
      await param('boardId').isInt().withMessage('Invalid board ID').run(req);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }

      const boardId = parseInt(req.params.boardId, 10);
      const board = await boardService.getBoard(boardId); // Assuming a service exists
        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        res.status(200).json(board);
    } catch (error: any) {
        console.error('Error getting board:', error);
        res.status(500).json({ message: 'Failed to get board: ' + (error.message || 'Internal server error') });
    }
};

export const deleteBoard = async (req: Request, res: Response) => { // DELETE /api/boards/:boardId
    await param('boardId').isInt().withMessage('Invalid board ID').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    } 

    try {
        const boardId = parseInt(req.params.boardId, 10);
        await boardService.deleteBoard(boardId);
        res.status(204).send(); // No Content on success
    } catch (error: any) {
        console.error('Error deleting board:', error);
        if (error.message === 'Board not found') { // Assuming service throws this error
            return res.status(404).json({ message: 'Board not found' });
        }
        res.status(500).json({ message: 'Failed to delete board: ' + (error.message || 'Internal server error') });
    }
};

export const createBoard = async (req: Request, res: Response) => { // POST /api/boards
    try {
        // Validate the request body
        // Assuming a Board type with properties like name, description
        await body('name').notEmpty().withMessage('Name is required').run(req);
        await body('description').optional().isString().run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const newBoard: Board = req.body;
        const createdBoard = await boardService.createBoard(newBoard);
        res.status(201).json(createdBoard);
    } catch (error: any) {
        console.error('Error creating board:', error);
        res.status(500).json({ message: 'Failed to create board: ' + (error.message || 'Internal server error') });
    }
};

export const updateBoard = async (req: Request, res: Response) => { // PUT /api/boards/:boardId
    try {
      await param('boardId').isInt().withMessage('Invalid board ID').run(req);
        // Validate the request body
        await body('name').optional().isString().run(req);
        await body('description').optional().isString().run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const boardId = parseInt(req.params.boardId, 10);
        const updatedBoard: Partial<Board> = req.body;
        const board = await boardService.updateBoard(boardId, updatedBoard);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }
        res.status(200).json(board);
    } catch (error: any) {
        console.error('Error updating board:', error);
        res.status(500).json({ message: 'Failed to update board: ' + (error.message || 'Internal server error') });
    }
};
