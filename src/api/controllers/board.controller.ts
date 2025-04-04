import { Request, Response } from 'express';
import { BoardService } from '../services/board.service';
import { ApiResponse, HttpCode, HttpStatus } from '@nestjs/common';
import { Board } from '../types/board';
import { Controller, Get } from '@nestjs/common';

@Controller('/api/boards')
export class BoardController {
  private boardService: BoardService;

  constructor(boardService: BoardService) {
    this.boardService = boardService;
  }

  @Get()
  async getBoards(req: Request, res: Response): Promise<void> {
    try {
      const boards = await this.boardService.getAllBoards();
      res.status(200).json(boards);
    } catch (error: any) {
      console.error('Error fetching boards:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch boards' });
    }
  }
}
