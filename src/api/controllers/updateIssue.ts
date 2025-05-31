import { Request, Response } from 'express';
import { DbSchema } from '../../models';
import { loadDatabase, saveDatabase } from '../../dataStore';

// Define allowed values for statuses for validation within this controller
const allowedStatuses = ["Todo", "In Progress", "Done"];

/**
 * Updates an existing issue.
 * @param {Request} req - The Express request object.  The request body should contain the updated issue data.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 * Responses:
 * - 200 OK: Successfully updated the issue. Returns the updated issue object.
 * - 400 Bad Request: If the request body is invalid or missing required fields, or attempts to update forbidden fields like `id` or `key`. Returns an appropriate error message in the validation format.
 * - 404 Not Found: If the issue to update is not found. Returns `{ message: 'Issue not found' }`.
 * - 500 Internal Server Error: An error occurred on the server side. Returns `{ message: 'Internal server error' }`.
 */
export const updateIssueEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.status !== undefined && !allowedStatuses.includes(updateData.status)) {
         res.status(400).json({ errorMessages: [`Invalid status: "${updateData.status}". Must be one of ${allowedStatuses.join(', ')}.`] , errors: {}});
         return;
    }

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

    if (updateData.key !== undefined || updateData.id !== undefined || updateData.issueType !== undefined) {
      const forbiddenFields = ['key', 'id', 'issueType'].filter(field => updateData[field] !== undefined);
      res.status(400).json({ errorMessages: [`Cannot update forbidden fields: ${forbiddenFields.join(', ')}`] , errors: {}});
      return;
    }

    db.issues[issueIndex] = { ...db.issues[issueIndex], ...updateData, updatedAt: new Date().toISOString() };
    try {
      await saveDatabase(db); // Direct DB access - TODO: Refactor to use service
    } catch (error) {
      console.error('Error saving database:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
    res.status(200).json(db.issues[issueIndex]);

  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
