import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { validate } from 'class-validator';
import { Board } from '../models/board';

export class BoardController {
  private boardService: BoardService;

  constructor() {
    this.boardService = new BoardService();
  }

  async createBoard(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      // Input validation using class-validator
      const board = new Board();
      board.name = name;
      board.description = description;
      const errors = await validate(board);

      if (errors.length > 0) {
        return res.status(400).json({ errors: errors.map(err => err.constraints) });
      }

      const newBoard = await this.boardService.createBoard({ name, description });
      res.status(201).json(newBoard);
    } catch (error: any) {
      console.error('Error creating board:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  }
}
