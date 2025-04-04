// src/api/routes/board.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import * as boardController from '../controllers/board.controller';

const router = Router();

// GET /api/boards/:boardId
router.get('/:boardId', boardController.getBoard);

// GET /api/boards
router.get('/', boardController.listBoards);

// POST /api/boards
router.post('/', boardController.createBoard);

// PUT /api/boards/:boardId
router.put('/:boardId', boardController.updateBoard);

// DELETE /api/boards/:boardId
router.delete('/:boardId', boardController.deleteBoard);

export default router;