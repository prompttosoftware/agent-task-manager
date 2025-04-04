import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';

const router = Router();
const boardController = new BoardController();

router.post('/boards', boardController.createBoard);
router.get('/boards', boardController.getBoards);

export default router;
