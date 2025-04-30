import { Request, Response } from 'express';
import { IssueService } from '../../services/IssueService';

export class IssueController {
    private issueService: IssueService;

    constructor(issueService: IssueService) {
        this.issueService = issueService;
    }

    async createIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueData = req.body;
            const newIssue = await this.issueService.createIssue(issueData);
            res.status(201).json(newIssue);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create issue' });
        }
    }

    async getIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueId = req.params.issueIdOrKey; // Changed to issueIdOrKey to match route
            const issue = await this.issueService.getIssue(issueId);

            if (issue) {
                res.status(200).json(issue);
            } else {
                res.status(404).json({ message: 'Issue not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to get issue' });
        }
    }

    async updateIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueId = req.params.issueIdOrKey;  // Changed to issueIdOrKey to match route
            const issueData = req.body;
            const updatedIssue = await this.issueService.updateIssue(issueId, issueData);

            if (updatedIssue) {
                res.status(200).json(updatedIssue);
            } else {
                res.status(404).json({ message: 'Issue not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update issue' });
        }
    }

    async deleteIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueId = req.params.issueIdOrKey;  // Changed to issueIdOrKey to match route
            const deleted = await this.issueService.deleteIssue(issueId);

            if (deleted) {
                res.status(204).send();
            } else {
                res.status(404).json({ message: 'Issue not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete issue' });
        }
    }

    async addAttachment(req: Request, res: Response): Promise<void> {
        try {
            const issueId = parseInt(req.params.id, 10);
            // Assuming you're using middleware like multer to handle file uploads
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            const attachmentMetadata = {