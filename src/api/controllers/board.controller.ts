// src/api/controllers/board.controller.ts
import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { validationResult } from 'express-validator';
import { Board } from '../types/board.d.ts';
import { createBoardValidator, updateBoardValidator } from '../validators/board.validator';

export class BoardController {
    private boardService: BoardService;

    constructor(boardService: BoardService) {
        this.boardService = boardService;
    }

    async getBoard(req: Request, res: Response): Promise<void> {
        try {
            const boardId = req.params.boardId;
            const board: Board | null = await this.boardService.getBoardById(boardId);

            if (!board) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }

            res.status(200).json(board);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Failed to retrieve board', error: error.message });
        }
    }

    async listBoards(req: Request, res: Response): Promise<void> {
        try {
            const boards: Board[] = await this.boardService.listBoards();
            res.status(200).json(boards);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Failed to list boards', error: error.message });
        }
    }

    async createBoard(req: Request, res: Response): Promise<void> {
        try {
            await Promise.all(createBoardValidator.map(validation => validation.run(req)));
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, description } = req.body;
            const newBoard: Board = await this.boardService.createBoard({ name, description });
            res.status(201).json(newBoard);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create board', error: error.message });
        }
    }

    async updateBoard(req: Request, res: Response): Promise<void> {
        try {
            await Promise.all(updateBoardValidator.map(validation => validation.run(req)));
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const boardId = req.params.boardId;
            const { name, description } = req.body;
            const updatedBoard: Board | null = await this.boardService.updateBoard(boardId, { name, description });

            if (!updatedBoard) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }

            res.status(200).json(updatedBoard);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update board', error: error.message });
        }
    }

    async deleteBoard(req: Request, res: Response): Promise<void> {
        try {
            const boardId = req.params.boardId;
            const deleted: boolean = await this.boardService.deleteBoard(boardId);

            if (!deleted) {
                res.status(404).json({ message: 'Board not found' });
                return;
            }

            res.status(204).send(); // No content
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: 'Failed to delete board', error: error.message });
        }
    }
}
