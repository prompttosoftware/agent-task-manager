// src/api/controllers/board.controller.ts

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as boardService from '../services/board.service';

export const getBoard = async (req: Request, res: Response) => {
    try {
        // Implement getBoard logic here
        const board = await boardService.getBoard(); // Assuming a service exists
        res.status(200).json(board);
    } catch (error: any) {
        console.error('Error getting board:', error);
        res.status(500).json({ message: 'Failed to get board: ' + (error.message || 'Internal server error') });
    }
};

export const deleteBoard = async (req: Request, res: Response) => {
    const boardId = req.params.boardId;

    // Input validation using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await boardService.deleteBoard(Number(boardId));
        res.status(204).send(); // No Content on success
    } catch (error: any) {
        console.error('Error deleting board:', error);
        if (error.message === 'Board not found') { // Assuming service throws this error
            return res.status(404).json({ message: 'Board not found' });
        }
        res.status(500).json({ message: 'Failed to delete board: ' + (error.message || 'Internal server error') });
    }
};