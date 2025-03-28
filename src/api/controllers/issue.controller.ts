// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { findIssues as findIssuesService } from '../services/issue.service';

export const findIssues = async (req: Request, res: Response) => {
  try {
    const { keywords, status, assignee } = req.query;
    const searchResults = await findIssuesService(keywords as string | undefined, status as string | undefined, assignee as string | undefined);
    res.status(200).json(searchResults);
  } catch (error: any) {
    console.error('Error searching issues:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
