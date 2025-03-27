import { Request, Response } from 'express';
import { listBoardsService } from '../services/boardService';

export const listBoardsController = async (req: Request, res: Response) => {
  try {
    const boards = await listBoardsService();
    res.json(boards);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
