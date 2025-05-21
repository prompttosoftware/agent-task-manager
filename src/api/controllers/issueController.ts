import { Request, Response } from 'express';
import { createIssue as createIssueService } from '../../services/issueService';

/**
 * Handles the creation of a new issue.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  const { fields } = req.body;

  if (!fields?.project?.key) {
    return res.status(400).json({ error: 'Project key is required' });
  }

  if (!fields?.issuetype?.id) {
    return res.status(400).json({ error: 'Issue type ID is required' });
  }

  if (!fields?.summary) {
    return res.status(400).json({ error: 'Summary is required' });
  }

  try {
    const createdIssue = await createIssueService({
      projectKey: fields.project.key,
      issueTypeId: fields.issuetype.id,
      summary: fields.summary,
      description: fields.description,
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
