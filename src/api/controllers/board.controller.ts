import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { validationResult } from 'express-validator';

export class BoardController {
  private readonly boardService: BoardService;

  constructor(boardService: BoardService) {
    this.boardService = boardService;
  }

  async getBoardById(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { boardId } = req.params;

    try {
      const board = await this.boardService.getBoardById(boardId);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      res.status(200).json(board);
    } catch (error: any) {
      console.error('Error fetching board:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
