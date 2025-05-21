import { Request, Response } from 'express';

/**
 * Handles the creation of a new issue.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createIssue = (req: Request, res: Response): void => {
  console.log('createIssue function called');

  const { fields } = req.body;

  if (!fields?.project?.key) {
    return res.status(400).json({ error: 'Project key is required' });
  }

  if (!fields?.issuetype?.id) {
    return res.status(400).json({ error: 'Issue type ID is required' });
  }

  if (!fields?.summary) {
    return res.status(400).json({ error: 'Summary is required' });
  }

  console.log('Request body:', req.body);
  res.status(201).json({ message: 'Issue creation request received' });
};
