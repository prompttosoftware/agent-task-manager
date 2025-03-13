// src/controllers/issueController.ts
import { Request, Response } from 'express';
import * as issueService from '../services/issueService';
import { WebhookService } from '../services/webhookService';

const webhookService = new WebhookService();

export const createIssue = async (req: Request, res: Response) => {
    try {
        const issue = await issueService.createIssue(req.body);
        webhookService.triggerWebhook('issue_created', issue);
        res.status(201).json(issue);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getIssueByKey = async (req: Request, res: Response) => {
    try {
        const issue = await issueService.getIssueByKey(req.params.key);
        if (issue) {
            res.json(issue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllIssues = async (req: Request, res: Response) => {
    try {
        const issues = await issueService.getAllIssues();
        res.json(issues);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateIssue = async (req: Request, res: Response) => {
    try {
        const issue = await issueService.updateIssue(req.params.key, req.body);
        if (issue) {
            webhookService.triggerWebhook('issue_updated', issue);
            res.json(issue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteIssue = async (req: Request, res: Response) => {
    try {
        const issue = await issueService.getIssueByKey(req.params.key);
        const success = await issueService.deleteIssue(req.params.key);
        if (success && issue) {
          webhookService.triggerWebhook('issue_deleted', issue);
          res.status(204).send();
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
