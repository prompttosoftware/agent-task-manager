// src/controllers/issueController.ts
import { Request, Response } from 'express';
import * as issueService from '../services/issueService';

export async function getIssueTransitions(req: Request, res: Response): Promise<void> {
  const { issueKey } = req.params;

  try {
    const transitions = await issueService.getIssueTransitions(issueKey);
    res.status(200).json({ transitions });
  } catch (error: any) {
    if (error.message === 'Issue not found') {
      res.status(404).json({ message: 'Issue not found' });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
