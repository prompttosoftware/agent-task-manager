import { Router } from 'express';
import { BoardController } from '../controllers/board.controller';
import { boardIdValidator } from '../validators/board.validator';

export class BoardRoutes {
  private readonly router: Router;
  private readonly boardController: BoardController;

  constructor(boardController: BoardController) {
    this.boardController = boardController;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.get('/:boardId', boardIdValidator, this.boardController.getBoardById.bind(this.boardController));
  }

  getRouter(): Router {
    return this.router;
  }
}
