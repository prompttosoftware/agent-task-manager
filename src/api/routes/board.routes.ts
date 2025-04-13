// src/api/routes/board.routes.ts
import express from 'express';
import { BoardController } from '../controllers/board.controller';
import validate from '../middleware/validation.middleware';
import { boardSchema } from '../validators/board.validator';

const router = express.Router();

export function boardRoutes(boardController: BoardController) {
  router.get('/:boardId', validate([{ field: 'params.boardId', schema: boardSchema.pick({ id: true }) }]), boardController.getBoard.bind(boardController));
  router.get('/', boardController.listBoards.bind(boardController));
  router.post('/', validate([{ field: 'body', schema: boardSchema.omit({ id: true }) }]), boardController.createBoard.bind(boardController));
  router.put('/:boardId', validate([{ field: 'params.boardId', schema: boardSchema.pick({ id: true }) }, { field: 'body', schema: boardSchema.omit({ id: true }).partial() }]), boardController.updateBoard.bind(boardController));
  router.delete('/:boardId', validate([{ field: 'params.boardId', schema: boardSchema.pick({ id: true }) }]), boardController.deleteBoard.bind(boardController));

  return router;
}
