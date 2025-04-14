import express from 'express';
import { createBoard, deleteBoard } from '../api/controllers/board.controller';
import { validateCreateBoard } from '../api/validators/board.validator';

const router = express.Router();

router.post('/boards', validateCreateBoard, createBoard);
router.delete('/boards/:boardId', deleteBoard);

export default router;