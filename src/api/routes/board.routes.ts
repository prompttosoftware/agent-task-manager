// src/api/routes/board.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import * as boardController from '../controllers/board.controller';

const router = Router();

// GET /api/boards/:boardId
// router.get('/:boardId', boardController.getBoard);

// DELETE /api/boards/:boardId
router.delete('/:boardId', [param('boardId').isInt().withMessage('Invalid board ID')], boardController.deleteBoard);

export default router;