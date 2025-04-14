// src/api/controllers/board.controller.ts
import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { Board } from '../types/board.d';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { BoardIdParam } from '../validators/board.validator';

export class BoardController {
    private boardService: BoardService;

    constructor(boardService: BoardService) {
        this.boardService = boardService;
    }

    async getBoard(req: Request, res: Response) {
        const { boardId } = req.params;

        // Input validation
        const boardIdParam = plainToClass(BoardIdParam, { boardId });
        const validationErrors = await validate(boardIdParam);

        if (validationErrors.length > 0) {
            return res.status(400).json({ errors: validationErrors.map(err => err.constraints) });
        }

        try {
            const board: Board | undefined = await this.boardService.getBoard(boardId);
            if (!board) {
                return res.status(404).json({ message: 'Board not found' });
            }
            res.json(board);
        } catch (error: any) {
            console.error('Error fetching board:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
