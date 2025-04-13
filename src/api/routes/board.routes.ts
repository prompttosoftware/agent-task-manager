import express from 'express';
import { getBoard, getAllBoards, createBoard, updateBoard, deleteBoard } from '../api/controllers/board.controller';

const router = express.Router();

// GET /boards/:boardId
router.get('/:boardId', getBoard);

// GET /boards
router.get('/', getAllBoards);

// POST /boards
router.post('/', createBoard);

// PUT /boards/:boardId
router.put('/:boardId', updateBoard);

// DELETE /boards/:boardId
router.delete('/:boardId', deleteBoard);

export default router;
