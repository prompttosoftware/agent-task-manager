import express from 'express';
import { getBoards } from '../controllers/board.controller';

const router = express.Router();

router.get('/boards', getBoards);

export default router;
