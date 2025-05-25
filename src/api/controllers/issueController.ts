import { Request, Response } from 'express';
import { issueService } from '../../services/issueService';

/**
 * Controller function to handle the creation of an issue.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { summary, description } = req.body;
    const newIssue = await issueService.createIssue({ summary, description });
    res.status(201).json(newIssue); // 201 Created
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Failed to create issue', error: error.message }); // 500 Internal Server Error
  }
};
