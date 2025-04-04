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
      // 1. Validate input (assuming you have a validation middleware or function)
      const boardData: Board = req.body;
      // Assuming you have a validation function like this:
      // const validationErrors = await validateBoard(boardData);
      // if (validationErrors.length > 0) {
      //   return res.status(400).json({ errors: validationErrors });
      // }

      // Example of using class-validator (requires setup in your Board model):
      const board = new Board();
      board.name = boardData.name;
      board.description = boardData.description;

      const errors = await validate(board);
      if (errors.length > 0) {
        return res.status(400).json({ errors: errors.map(err => err.constraints) }); // better error format
      }

      // 2. Call the service to create the board
      const newBoard = await this.boardService.createBoard(boardData);

      // 3. Return the created board
      res.status(201).json(newBoard);
    } catch (error: any) {
      // 4. Handle errors
      console.error('Error creating board:', error);
      res.status(500).json({ message: error.message || 'Failed to create board', details: error });
    }
  }
}
