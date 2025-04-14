// src/api/routes/board.routes.ts
import { Router } from 'express';
import { BoardController } from '../api/controllers/board.controller';
import { BoardService } from '../api/services/board.service';
import { BoardRepository } from '../data/board.repository';

const router = Router();

const boardRepository = new BoardRepository(); // Assuming a default constructor or dependency injection setup.
const boardService = new BoardService(boardRepository);
const boardController = new BoardController(boardService);

router.get('/boards/:boardId', boardController.getBoard.bind(boardController));

export default router;