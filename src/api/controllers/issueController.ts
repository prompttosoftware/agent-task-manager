import { Request, Response } from 'express';
import { createIssue as createIssueService } from '../../services/issueService';
import { IssueType } from '../../models/issue';

const ALLOWED_ISSUE_TYPES = ['Bug', 'Story', 'Task', 'Epic', 'Subtask'];

/**
 * Handles the creation of a new issue.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  const { fields } = req.body;

  if (!fields) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  if (!fields.project?.key) {
    return res.status(400).json({ error: 'Project key is required' });
  }

  if (!fields.issuetype?.name) {
    return res.status(400).json({ error: 'Issue type name is required' });
  }

  if (!ALLOWED_ISSUE_TYPES.includes(fields.issuetype.name)) {
    return res.status(400).json({ error: 'Invalid issue type' });
  }

  if (!fields.summary) {
    return res.status(400).json({ error: 'Summary is required' });
  }

  try {
    const createdIssue = await createIssueService({
      projectKey: fields.project.key,
      issueTypeName: fields.issuetype.name as IssueType,
      summary: fields.summary,
      description: fields.description,
      parentKey: fields.parent?.key,
    });
    res.status(201).json({
      id: createdIssue.id,
      key: createdIssue.key,
      self: createdIssue.self,
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
};
