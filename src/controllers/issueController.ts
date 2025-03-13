// src/controllers/issueController.ts
import { Request, Response } from 'express';
import { getIssueService } from '../services/issueService';

export async function getIssue(req: Request, res: Response) {
  const issueNumber = req.params.issueNumber;
  const fieldsParam = req.query.fields as string | undefined;

  try {
    const issue = await getIssueService(issueNumber, fieldsParam);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.status(200).json(issue);
  } catch (error: any) {
    if (error.message === 'Invalid issue number format') {
      return res.status(400).json({ message: 'Bad Request: Invalid issue number format' });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
