import { Request, Response } from 'express';
import { DbSchema } from '../../models';
import { loadDatabase, saveDatabase } from '../../dataStore';

/**
 * Deletes an issue.
 * @param {Request} req - The Express request object. The request must include the issue ID as a route parameter.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 * Responses:
 * - 204 No Content: Successfully deleted the issue.
 * - 404 Not Found: Issue not found. Returns `{ message: 'Issue not found' }`.
 * - 500 Internal Server Error: An error occurred on the server side. Returns `{ message: 'Internal server error' }`.
 */
export const deleteIssueEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let db: DbSchema;
    try {
      db = await loadDatabase(); // Direct DB access - TODO: Refactor to use service
    } catch (error) {
      console.error('Error loading database:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    const issueIndex = db.issues.findIndex(issue => issue.id === id);
    if (issueIndex === -1) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
    db.issues.splice(issueIndex, 1);
    try {
      await saveDatabase(db); // Direct DB access - TODO: Refactor to use service
    } catch (error) {
      console.error('Error saving database:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
