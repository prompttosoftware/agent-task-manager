// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { findIssues as findIssuesService } from '../services/issue.service';
import { createIssue as createIssueService, updateIssue as updateIssueService } from '../services/issue.service';
import { WebhookService } from '../services/webhook.service';
import Database from '../../src/db/database';

const db = new Database('./data/task_manager.db');
const webhookService = new WebhookService(db);

export const findIssues = async (req: Request, res: Response) => {
  try {
    const { keywords, status, assignee } = req.query;
    const searchResults = await findIssuesService(keywords as string | undefined, status as string | undefined, assignee as string | undefined);
    res.status(200).json(searchResults);
  } catch (error: any) {
    console.error('Error searching issues:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const createIssue = async (req: Request, res: Response) => {
  try {
    const newIssueData = req.body;
    const createdIssue = await createIssueService(newIssueData);

    // Trigger webhook for issue created event
    await webhookService.processWebhookEvent({ event: 'issue.created', issue: createdIssue });

    res.status(201).json(createdIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(400).json({ message: error.message || 'Invalid request' });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
    try {
        const { issueKey } = req.params;
        const updateData = req.body;
        const updatedIssue = await updateIssueService(issueKey, updateData);

        // Trigger webhook for issue updated event
        await webhookService.processWebhookEvent({ event: 'issue.updated', issue: updatedIssue });

        res.status(200).json(updatedIssue);
    } catch (error: any) {
        console.error('Error updating issue:', error);
        res.status(400).json({ message: error.message || 'Invalid request' });
    }
};
