// src/controllers/boardController.ts
import { Request, Response } from 'express';
import { getIssuesForBoardService } from '../services/boardService';
import { listBoardsService } from '../services/boardService';

export const getIssuesForBoardController = async (req: Request, res: Response) => { 
  try {
    const { boardId } = req.params;
    const issues = await getIssuesForBoardService(boardId);
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listBoardsController = async (req: Request, res: Response) => {
    try {
        const boards = await listBoardsService();
        res.json(boards);
    } catch (error) {
        console.error('Error fetching boards:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
