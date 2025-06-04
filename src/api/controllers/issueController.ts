import { Request, Response } from 'express';

/**
 * Placeholder controller function to create an issue.
 * This logs a message and sends a 201 response.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  console.log('Placeholder: createIssue controller called');

  // Generate mock data for now
  const mockIssueResponse = {
    id: '10000', // Mock ID
    key: 'PROJ-1', // Mock Key
    self: 'http://localhost:3000/rest/api/2/issue/10000' // Mock URL
  };

  res.status(201).json(mockIssueResponse);
};
