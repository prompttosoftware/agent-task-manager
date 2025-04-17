import { Request, Response, NextFunction } from 'express';
import { issueKeyService } from '../../services/issueKeyService';
import { databaseService } from '../../services/databaseService';
import { jsonTransformer } from '../../utils/jsonTransformer';
import { Status } from '../../models/status';
import { webhookService } from '../../services/webhookService';

export const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueData = req.body;

    // Validate request body (basic validation - add more as needed)
    if (!issueData || typeof issueData !== 'object' || !issueData.summary) {
      return res.status(400).json({ error: 'Invalid request body.  Must include a summary.' });
    }

    const issueKey = await issueKeyService.generateIssueKey();

    const newIssue = await databaseService.createIssue({
      key: issueKey,
      summary: issueData.summary,
      description: issueData.description || '', // Optional description
      statusId: 11, // Default status: To Do
    });

    // Trigger webhook
    await webhookService.triggerIssueCreated(newIssue);

    const transformedIssue = jsonTransformer.transformIssue(newIssue);

    res.status(201).json(transformedIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    // Specific error handling for database errors
    if (error.message.includes('SQLITE_CONSTRAINT')) {
      return res.status(400).json({ error: 'Database constraint violation.  Check your data.' });
    }
    res.status(500).json({ error: 'Failed to create issue' });
  }
};

export const getIssue = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('getIssue endpoint');
};

export const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('updateIssue endpoint');
};

export const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('deleteIssue endpoint');
};

export const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('getAllIssues endpoint');
};

export const createWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('createWebhookEndpoint endpoint');
};

export const deleteWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('deleteWebhookEndpoint endpoint');
};

export const linkIssues = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('linkIssues endpoint');
};
