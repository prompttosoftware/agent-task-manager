import express from 'express';
import { BoardController } from '../controllers/board.controller';

const router = express.Router();
const boardController = new BoardController();

router.get('/boards', boardController.getBoards);
router.get('/boards/:boardId', boardController.getBoardById);

export default router;
