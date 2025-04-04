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

  async getBoardById(req: Request, res: Response) {
    const boardId = parseInt(req.params.boardId, 10);

    if (isNaN(boardId)) {
      return res.status(400).json({ message: 'Invalid boardId' });
    }

    try {
      const board = await this.boardService.getBoardById(boardId);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      res.status(200).json(board);
    } catch (error: any) {
      console.error('Error getting board by id in controller:', error);
      res.status(500).json({ message: error.message || 'Failed to get board' });
    }
  }
}
