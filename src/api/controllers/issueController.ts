// src/api/controllers/issueController.ts
import { Request, Response } from 'express';
import { DatabaseService } from '../../src/services/databaseService';
import { JsonTransformer } from '../../src/utils/jsonTransformer';

export class IssueController {
    private databaseService: DatabaseService;
    private jsonTransformer: JsonTransformer;

    constructor(databaseService: DatabaseService, jsonTransformer: JsonTransformer) {
        this.databaseService = databaseService;
        this.jsonTransformer = jsonTransformer;
    }

    async createIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueData = req.body;
            const newIssue = await this.databaseService.createIssue(issueData);
            res.status(201).json(this.jsonTransformer.transform(newIssue));
        } catch (error: any) {
            console.error("Error creating issue:", error);
            res.status(500).json({ message: error.message || 'Failed to create issue' });
        }
    }

    async getIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const issue = await this.databaseService.getIssue(issueKey);
            if (!issue) {
                res.status(404).json({ message: 'Issue not found' });
                return;
            }
            res.status(200).json(this.jsonTransformer.transform(issue));
        } catch (error: any) {
            console.error("Error getting issue:", error);
            res.status(500).json({ message: error.message || 'Failed to get issue' });
        }
    }

    async deleteIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            await this.databaseService.deleteIssue(issueKey);
            res.status(204).send(); // No content on successful delete
        } catch (error: any) {
            console.error("Error deleting issue:", error);
            res.status(500).json({ message: error.message || 'Failed to delete issue' });
        }
    }
}
