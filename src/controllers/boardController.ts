import { Request, Response } from 'express';
import * as boardService from '../services/boardService';

export const listBoards = async (req: Request, res: Response) => {
  try {
    const boards = await boardService.listBoards();
    res.status(200).json(boards);
  } catch (error) {
    console.error('Error listing boards:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
