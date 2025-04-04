import express from 'express';
import { BoardController } from '../controllers/board.controller';

const router = express.Router();
const boardController = new BoardController();

router.post('/boards', boardController.createBoard);

export default router;
