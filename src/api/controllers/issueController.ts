import { Request, Response } from 'express';

/**
 * Handles the creation of a new issue.
 * Expects 'title' and 'description' in the request body.
 * Validates that title and description are non-empty strings.
 *
 * @param {Request} req - The Express Request object. Expected body: { title: string, description: string }.
 * @param {Response} res - The Express Response object.
 * @returns {void} Sends a JSON response:
 *   - Status 200: { message: 'Issue created successfully' } on success.
 *   - Status 400: { message: 'Invalid input: title and description are required and must be non-empty strings.' } on validation failure.
 */
export const createIssue = (req: Request, res: Response) => {
  const { title, description } = req.body;

  // Check for missing or invalid title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ message: 'Invalid input: title and description are required and must be non-empty strings.' });
  }

  // Check for missing or invalid description
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return res.status(400).json({ message: 'Invalid input: title and description are required and must be non-empty strings.' });
  }

  // If both are valid, proceed
  // In a real application, this would interact with a database or external service.
  // For now, we'll just return a success message.
  return res.status(200).json({ message: 'Issue created successfully' });
};
