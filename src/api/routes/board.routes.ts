import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';

const router = Router();
const boardController = new BoardController();

// POST /api/boards - Create a new board
router.post('/', boardController.createBoard);

export default router;
