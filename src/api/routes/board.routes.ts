// src/api/routes/board.routes.ts
import express, { Request, Response } from 'express';
import { getBoardById } from '../controllers/board.controller';

const router = express.Router();

// GET /api/boards/:boardId
router.get('/boards/:boardId', getBoardById);

export default router;
