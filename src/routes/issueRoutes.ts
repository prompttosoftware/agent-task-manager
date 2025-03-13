// src/routes/issueRoutes.ts
import express from 'express';
import * as issueService from '../services/issueService';

const router = express.Router();

router.post('/', (req, res) => {
    try {
        const issue = issueService.createIssue(req.body);
        res.status(201).json(issue);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:key', (req, res) => {
    try {
        const issue = issueService.getIssueByKey(req.params.key);
        if (issue) {
            res.json(issue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', (req, res) => {
    try {
        const issues = issueService.getAllIssues();
        res.json(issues);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:key', (req, res) => {
    try {
        const issue = issueService.updateIssue(req.params.key, req.body);
        if (issue) {
            res.json(issue);
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:key', (req, res) => {
    try {
        const success = issueService.deleteIssue(req.params.key);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Issue not found' });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;