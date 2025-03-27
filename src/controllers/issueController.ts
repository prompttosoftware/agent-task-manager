import { Request, Response } from 'express';
import { getIssuesForBoardService } from '../services/issueService';

export const getIssuesForBoardController = async (req: Request, res: Response) => {
  const boardId = parseInt(req.params.boardId, 10);

  try {
    const issues = await getIssuesForBoardService(boardId);
    res.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
};
