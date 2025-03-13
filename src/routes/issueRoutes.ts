// src/routes/issueRoutes.ts
import express from 'express';
import * as issueService from '../services/issueService';

const router = express.Router();

router.post('/', (req, res) => { // create issue
    try {
        const issue = issueService.createIssue(req.body);
        res.status(201).json(issue);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:key', (req, res) => { // get issue by key
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

router.get('/', (req, res) => { // get all issues
    try {
        const issues = issueService.getAllIssues();
        res.json(issues);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:key', (req, res) => { // update issue
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

router.delete('/:key', (req, res) => { // delete issue
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

router.post('/issuelink', async (req, res) => {
    try {
        const { inwardLink, outwardLink } = req.body;
        await issueService.linkIssues(inwardLink, outwardLink);
        res.status(201).send(); // or metadata if needed
    } catch (error: any) {
        if (error.message === 'Issue not found') {
            res.status(404).json({ message: 'Issue not found' });
        } else if (error.message === 'Invalid issue keys') {
            res.status(400).json({ message: 'Bad Request: Invalid issue keys' });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
});

export default router;