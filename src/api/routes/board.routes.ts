import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';

const router = Router();
const boardController = new BoardController();

router.get('/boards', boardController.getBoards.bind(boardController));

export default router;
