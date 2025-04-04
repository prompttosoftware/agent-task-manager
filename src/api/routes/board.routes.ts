// src/api/routes/board.routes.ts
import { Router } from 'express';
import { param } from 'express-validator';
import * as boardController from '../controllers/board.controller';
import { validationMiddleware } from '../middleware/validation.middleware';
import { BoardCreateDto, BoardUpdateDto } from '../types/board.d';

const router = Router();

// GET /api/boards/:boardId
router.get('/:boardId', boardController.getBoard);

// GET /api/boards
router.get('/', boardController.listBoards);

// POST /api/boards
router.post('/', validationMiddleware(BoardCreateDto), boardController.createBoard);

// PUT /api/boards/:boardId
router.put('/:boardId', param('boardId').isString().withMessage('Invalid board ID'), validationMiddleware(BoardUpdateDto), boardController.updateBoard);

// DELETE /api/boards/:boardId
router.delete('/:boardId', param('boardId').isString().withMessage('Invalid board ID'), boardController.deleteBoard);

export default router;