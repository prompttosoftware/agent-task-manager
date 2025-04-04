import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { Board } from '../models/board';
import { BoardService } from '../services/board.service';

export class BoardController {
  private boardService: BoardService;

  constructor() {
    this.boardService = new BoardService();
  }

  async createBoard(req: Request, res: Response) {
    try {
      const boardData: Board = req.body;
      const board = new Board();
      board.name = boardData.name;
      board.description = boardData.description;

      const errors = await validate(board);
      if (errors.length > 0) {
        return res.status(400).json({ errors: errors.map(err => err.constraints) });
      }

      const newBoard = await this.boardService.createBoard(boardData);
      res.status(201).json(newBoard);
    } catch (error: any) {
      console.error('Error creating board:', error);
      res.status(500).json({ message: error.message || 'Failed to create board', details: error });
    }
  }

  async getBoards(req: Request, res: Response) {
    try {
      const boards = await this.boardService.getBoards();
      res.status(200).json(boards);
    } catch (error: any) {
      console.error('Error getting boards:', error);
      res.status(500).json({ message: error.message || 'Failed to get boards', details: error });
    }
  }
}
