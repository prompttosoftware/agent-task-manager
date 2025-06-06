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
    const { fields } = req.body; // Expect Jira-like request body with 'fields' property

    // Validate that 'fields' exists
    if (!fields) {
      console.warn('createIssue: Validation failed: Missing required field: fields');
      return res.status(400).json({ error: 'Missing required field: fields' });
    }
    console.log('createIssue: Validation successful: fields exists.');

    const { summary, description, issuetype, status, parentIssueKey } = fields; // Destructure required values from 'fields', expecting 'issuetype' object

    // Validate required fields within 'fields'
    if (!summary) {
      console.warn('createIssue: Validation failed: fields.summary is required and cannot be empty');
      return res.status(400).json({ error: 'Required field fields.summary cannot be empty' });
    }
    console.log('createIssue: Validation successful: fields.summary exists.');

    // Validate issuetype object and its name property
    if (!issuetype) {
      console.warn('createIssue: Validation failed: Missing required field: fields.issuetype');
      return res.status(400).json({ error: 'Missing required field: fields.issuetype' });
    }
    console.log('createIssue: Validation successful: fields.issuetype exists.');

    if (!issuetype.name) {
        console.warn('createIssue: Validation failed: Missing required field: fields.issuetype.name');
        return res.status(400).json({ error: 'Missing required field: fields.issuetype.name' });
    }
    console.log('createIssue: Validation successful: fields.issuetype.name exists.');


    if (!status) {
      console.warn('createIssue: Validation failed: Missing required field: fields.status');
      return res.status(400).json({ error: 'Missing required field: fields.status' });
    }
    console.log('createIssue: Validation successful: fields.status exists.');

    // Validate issueType name value
    const validIssueTypes = ['TASK', 'STOR', 'EPIC', 'BUG', 'SUBT'];
    if (!validIssueTypes.includes(issuetype.name)) {
        console.warn(`createIssue: Validation failed: Invalid issueType: ${issuetype.name}. Allowed: ${validIssueTypes.join(', ')}`);
        return res.status(400).json({ error: `Invalid issueType. Must be one of: ${validIssueTypes.join(', ')}` });
    }
    console.log(`createIssue: Validation successful: issueType '${issuetype.name}' is valid.`);

    // Check for parentIssueKey if issueType is SUBT
    if (issuetype.name === 'SUBT') {
        console.log('createIssue: Issue type is SUBT, checking for parentIssueKey...');
        if (!parentIssueKey) {
            console.warn('createIssue: Validation failed: Missing required field: fields.parentIssueKey for subtask');
            return res.status(400).json({ error: 'Missing required field: fields.parentIssueKey for subtask' });
        }
        console.log('createIssue: Validation successful: fields.parentIssueKey exists for subtask.');
    } else {
         console.log(`createIssue: Issue type is ${issuetype.name}, parentIssueKey is not required.`);
    }


    // Create new Database instance and wait for it to load
    const db = new Database();
    await db.ready;

    // Instantiate TaskService
    const taskService = new TaskService(db);

    console.log('createIssue: Calling taskService.createTask...'); // Log before createTask
    console.log('createIssue: Calling taskService.createTask...'); // Log before createTask
    // Use summary as title and pass description, type, status, and parentIssueKey (if provided)
    const createdIssue = await taskService.createTask({
        title: summary,
        description: description,
        issueType: issuetype.name, // Use issuetype.name
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
