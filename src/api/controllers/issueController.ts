import { Request, Response } from 'express';
import { IssueService } from '../../services/issueService';
import { AnyIssue, IssueType, Subtask, CreateIssueInput } from '../../models/issue';
import { Database } from '../../db/database';

/**
 * Handles the HTTP request to create a new issue.
 * Validates the request body and uses the IssueService to create the issue in the database.
 *
 * @param req - The Express Request object, expected to contain issue data in `req.body.fields`.
 * @param res - The Express Response object used to send the response back to the client.
 * @returns A JSON response containing the created issue (status 201) or an error message (status 400 or 500).
 */
export const createIssue = async (req: Request, res: Response) => {
  try {
    const { fields } = req.body;

    if (!fields) {
      return res.status(400).json({ error: 'Missing required field: fields' });
    }

    if (!fields.summary) {
      return res.status(400).json({ error: 'Missing required field: fields.summary' });
    }

    if (!fields.issuetype || !fields.issuetype.name) {
      return res.status(400).json({ error: 'Missing required field: fields.issuetype.name' });
    }

    if (!fields.status) {
      return res.status(400).json({ error: 'Missing required field: fields.status' });
    }

    const issueType = fields.issuetype.name.toUpperCase() as IssueType;

    if (!['TASK', 'STOR', 'EPIC', 'BUG', 'SUBT'].includes(issueType)) {
      return res.status(400).json({ error: 'Invalid issue type' });
    }
    let parentIssueKey: string | undefined = undefined;

    if (issueType === 'SUBT') {
      if (!fields.parentIssueKey) {
        return res.status(400).json({ error: 'Missing required field: fields.parentIssueKey for subtask' });
      }
      parentIssueKey = fields.parentIssueKey;
    }

    let createIssueInput: CreateIssueInput;

    switch (issueType) {
      case 'TASK':
        createIssueInput = {
          issueType: 'TASK',
          summary: fields.summary,
          description: fields.description,
          status: fields.status,
        };
        break;
      case 'STOR':
        createIssueInput = {
          issueType: 'STOR',
          summary: fields.summary,
          description: fields.description,
          status: fields.status,
        };
        break;
      case 'EPIC':
        createIssueInput = {
          issueType: 'EPIC',
          summary: fields.summary,
          description: fields.description,
          status: fields.status,
        };
        break;
      case 'BUG':
        createIssueInput = {
          issueType: 'BUG',
          summary: fields.summary,
          description: fields.description,
          status: fields.status,
        };
        break;
      case 'SUBT':
        createIssueInput = {
          issueType: 'SUBT',
          summary: fields.summary,
          description: fields.description,
          status: fields.status,
          parentIssueKey: parentIssueKey!,
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid issue type' }); // Redundant, but good for safety
    }

    const db = new Database();
    const issueService = new IssueService(db);
    const createdIssue = await issueService.createIssue(createIssueInput);

    if (Array.isArray(createdIssue)) {
      return res.status(400).json({ errors: createdIssue });
    }

    res.status(201).json(createdIssue);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create issue' });
  }
};
