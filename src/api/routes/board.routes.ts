// src/api/routes/board.routes.ts

import express, { Router } from 'express';
import { createBoard, getBoardById, updateBoard, deleteBoard } from '../controllers/board.controller';

const router: Router = express.Router();

// POST /boards - Create a new board
router.post('/boards', createBoard);

// GET /boards/:id - Get a board by ID
router.get('/boards/:id', getBoardById);

// PUT /boards/:id - Update a board
router.put('/boards/:id', updateBoard);

// DELETE /boards/:id - Delete a board
router.delete('/boards/:id', deleteBoard);

export default router;