// src/api/routes/board.routes.ts
import express from 'express';
import { BoardController } from '../controllers/board.controller';

const router = express.Router();

export function boardRoutes(boardController: BoardController) {
  router.get('/:boardId', boardController.getBoard.bind(boardController));
  router.get('/', boardController.listBoards.bind(boardController));
  router.post('/', boardController.createBoard.bind(boardController));
  router.put('/:boardId', boardController.updateBoard.bind(boardController));
  router.delete('/:boardId', boardController.deleteBoard.bind(boardController));

  return router;
}
