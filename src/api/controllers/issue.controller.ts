// src/api/controllers/issue.controller.ts

import { Request, Response } from 'express';
import * as issueService from '../api/services/issue.service';

export async function createIssue(req: Request, res: Response) {
    try {
        const issue = await issueService.createIssue(req.body);
        res.status(201).json(issue);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function getIssue(req: Request, res: Response) {
    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        const issue = await issueService.getIssue(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.json(issue);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function updateIssue(req: Request, res: Response) {
    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        const updated = await issueService.updateIssue(issueId, req.body);
        if (updated.changes === 0) {
            return res.status(404).json({ message: 'Issue not found or no changes' });
        }
        res.json({ message: 'Issue updated' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export async function deleteIssue(req: Request, res: Response) {
    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        await issueService.deleteIssue(issueId);
        res.status(204).send(); // No content
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
