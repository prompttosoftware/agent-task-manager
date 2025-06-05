// src/api/controllers/issueController.ts

import { Request, Response } from 'express';

export const createIssue = (req: Request, res: Response) => {
  // TODO: Implement issue creation logic here
  res.status(201).json({ message: 'Issue created successfully' });
};
