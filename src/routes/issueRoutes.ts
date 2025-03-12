// src/routes/issueRoutes.ts
import express, { Request, Response } from 'express';
import { Issue } from '../models/issue';
import { IssueService } from '../services/issueService';

const router = express.Router();
const issueService = new IssueService();

router.post('/', async (req: Request, res: Response) => {
    try {
        const issue: Issue = req.body;
        const createdIssue = await issueService.createIssue(issue);
        res.status(201).json(createdIssue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating issue' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;
        const issue = await issueService.getIssue(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.status(200).json(issue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting issue' });
    }
});

router.get('/', async (req: Request, res: Response) => {
    try {
        const issues = await issueService.getAllIssues();
        res.status(200).json(issues);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error getting issues' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;
        const updates: Partial<Issue> = req.body;
        const updatedIssue = await issueService.updateIssue(issueId, updates);
        if (!updatedIssue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.status(200).json(updatedIssue);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating issue' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const issueId = req.params.id;
        const success = await issueService.deleteIssue(issueId);
        if (!success) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.status(204).send(); // No content on successful delete
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting issue' });
    }
});

export default router;
