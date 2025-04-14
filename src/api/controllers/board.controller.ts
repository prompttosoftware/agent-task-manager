import { Request, Response } from 'express';
import { getAllBoards } from '../services/board.service';

export const getBoards = async (req: Request, res: Response) => {
  try {
    const boards = await getAllBoards();
    res.json(boards);
  } catch (error: any) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
};
