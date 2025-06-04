import { Request, Response } from 'express';

export class IssueController {
  constructor() {
  }

  /**
   * Handles fetching all issues.
   * @param req - The Express request object.
   * @param res - The Express response object.
   */
  public async getAllIssues(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({ message: 'Issues fetched successfully!' });

    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
