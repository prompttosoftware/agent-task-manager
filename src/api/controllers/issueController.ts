import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Task } from '../../models/issue'; // Import the Task interface
import { DbSchema } from '../../models/issue';
import { Database } from '../../db/database';
import { TaskService } from '../../services/task.service';

/**
 * Handles the creation of a new issue.
 * @param req The request object.  Expects a JSON body with `summary`, `description` (optional), `issueType`, and `status`.
 * @param res The response object.  Returns the created issue and a 201 status code on success, or a 400/500 on error.
 */
export const createIssue = async (req: Request, res: Response) => { // Make function async
  try {
    console.log('createIssue: Received request body:', req.body); // Log request body
    console.log('createIssue: Request headers:', req.headers); // Log request headers
    const { summary, description, issueType, status, parentIssueKey } = req.body; // Destructure to get required values, including parentIssueKey

    // Validate required fields
    if (!summary) {
      console.warn('createIssue: Missing required field: summary');
      return res.status(400).json({ error: 'Missing required field: summary' });
    }
    if (!issueType) {
      console.warn('createIssue: Missing required field: issueType');
      return res.status(400).json({ error: 'Missing required field: issueType' });
    }
    if (!status) {
      console.warn('createIssue: Missing required field: status');
      return res.status(400).json({ error: 'Missing required field: status' });
    }

    // Validate issueType value
    const validIssueTypes = ['TASK', 'STOR', 'EPIC', 'BUG', 'SUBT'];
    if (!validIssueTypes.includes(issueType)) {
        console.warn(`createIssue: Invalid issueType: ${issueType}`);
        return res.status(400).json({ error: `Invalid issueType. Must be one of: ${validIssueTypes.join(', ')}` });
    }

    // Check for parentIssueKey if issueType is SUBT
    if (issueType === 'SUBT' && !parentIssueKey) {
        console.warn('createIssue: Missing required field: parentIssueKey for subtask');
        return res.status(400).json({ error: 'Missing required field: parentIssueKey for subtask' });
    }

    // Create new Database instance and wait for it to load
    const db = new Database();
    await db.ready;

    // Instantiate TaskService
    const taskService = new TaskService(db);

    console.log('createIssue: Calling taskService.createTask...'); // Log before createTask
    // Use summary as title and pass description, type, status, and parentIssueKey (if provided)
    const createdIssue = await taskService.createTask({
        title: summary,
        description: description,
        issueType: issueType,
        status: status,
        parentIssueKey: parentIssueKey // Pass parentIssueKey to createTask
    });
    console.log('createIssue: taskService.createTask completed.'); // Log after createTask

    console.log('createIssue: Responding with new issue.', { issueKey: createdIssue.key, issueId: createdIssue.id, contentType: req.headers['content-type'] }); // Log before sending response, include Content-Type
    console.log('createIssue: Response headers before setting:', res.getHeaders());
    res.setHeader('Content-Type', 'application/json'); // Ensure Content-Type is set
    console.log('createIssue: Response headers after setting:', res.getHeaders());
    res.status(201).json(createdIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.setHeader('Content-Type', 'application/json'); // Ensure Content-Type is set for error response
    res.status(500).json({ error: 'Failed to create issue', details: error.message });
  }
};
