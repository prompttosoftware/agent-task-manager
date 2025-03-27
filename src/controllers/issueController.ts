import { Request, Response } from 'express';
import { getIssuesForBoardService } from '../services/issueService';

export const getIssuesForBoardController = async (req: Request, res: Response) => {
    try {
        const boardId = req.params.boardId;
        const issues = await getIssuesForBoardService(boardId);
        res.status(200).json(issues);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
};
