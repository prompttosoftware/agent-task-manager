import express from 'express';
import { createBoard, deleteBoard, getBoard } from '../api/controllers/board.controller';
import { validateCreateBoard, validateBoardId } from '../api/validators/board.validator';

const router = express.Router();

router.post('/boards', validateCreateBoard, createBoard);
router.delete('/boards/:boardId', validateBoardId, deleteBoard);
router.get('/boards/:boardId', validateBoardId, getBoard);

export default router;