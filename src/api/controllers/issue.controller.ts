// src/api/controllers/issue.controller.ts

import { Request, Response } from 'express';
import * as issueService from '../api/services/issue.service';
import { IssueUpdate } from '../types/issue.d';

export async function createIssue(req: Request, res: Response) {
    const start = Date.now();
    try {
        const issue = await issueService.createIssue(req.body);
        const end = Date.now();
        console.log(`createIssue took ${end - start}ms`);
        res.status(201).json(issue);
    } catch (error: any) {
        const end = Date.now();
        console.log(`createIssue took ${end - start}ms`);
        res.status(500).json({ message: error.message });
    }
}

export async function getIssue(req: Request, res: Response) {
    const start = Date.now();
    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            const end = Date.now();
            console.log(`getIssue (invalid id) took ${end - start}ms`);
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        const issue = await issueService.getIssue(issueId);
        const end = Date.now();
        console.log(`getIssue took ${end - start}ms`);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.json(issue);
    } catch (error: any) {
        const end = Date.now();
        console.log(`getIssue took ${end - start}ms`);
        res.status(500).json({ message: error.message });
    }
}

export async function updateIssue(req: Request, res: Response) {
    const start = Date.now();
    try {
        const issueId = parseInt(req.params.issueKey, 10); // Changed to issueKey
        if (isNaN(issueId)) {
            const end = Date.now();
            console.log(`updateIssue (invalid id) took ${end - start}ms`);
            return res.status(400).json({ message: 'Invalid issue ID' });
        }

        const updateData: IssueUpdate = req.body; // Type assertion

        const updated = await issueService.updateIssue(issueId, updateData);
        const end = Date.now();
        console.log(`updateIssue took ${end - start}ms`);
        if (updated.changes === 0) {
            return res.status(404).json({ message: 'Issue not found or no changes' });
        }
        res.json({ message: 'Issue updated' });
    } catch (error: any) {
        const end = Date.now();
        console.log(`updateIssue took ${end - start}ms`);
        res.status(500).json({ message: error.message });
    }
}

export async function deleteIssue(req: Request, res: Response) {
    const start = Date.now();
    try {
        const issueId = parseInt(req.params.id, 10);
        if (isNaN(issueId)) {
            const end = Date.now();
            console.log(`deleteIssue (invalid id) took ${end - start}ms`);
            return res.status(400).json({ message: 'Invalid issue ID' });
        }
        await issueService.deleteIssue(issueId);
        const end = Date.now();
        console.log(`deleteIssue took ${end - start}ms`);
        res.status(204).send(); // No content
    } catch (error: any) {
        const end = Date.now();
        console.log(`deleteIssue took ${end - start}ms`);
        res.status(500).json({ message: error.message });
    }
}

export async function transitionIssue(req: Request, res: Response) {
    // Implement the transition logic here
    const issueKey = req.params.issueKey;
    const transitionData = req.body;

    try {
      // Assuming you have a service function to handle the transition
      await issueService.transitionIssue(issueKey, transitionData);
      res.status(200).json({ message: 'Issue transitioned successfully' });
    } catch (error: any) {
      console.error("Transition failed:", error);
      res.status(500).json({ message: error.message || 'Failed to transition issue' });
    }
  }
