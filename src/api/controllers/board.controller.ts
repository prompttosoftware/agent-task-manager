import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';

export class BoardController {
  private boardService: BoardService;

  constructor() {
    this.boardService = new BoardService();
  }

  async getBoards(req: Request, res: Response) {
    try {
      const boards = await this.boardService.getBoards();
      res.status(200).json(boards);
    } catch (error: any) {
      console.error('Error getting boards in controller:', error);
      res.status(500).json({ message: error.message || 'Failed to get boards' });
    }
  }
}