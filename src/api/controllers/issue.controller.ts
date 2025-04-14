// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { IssueService } from '../../src/services/issue.service';
import { Issue } from '../../src/types/issue.d';
import { BoardService } from '../../src/services/board.service';
import { WebhookService } from '../services/webhook.service';

export class IssueController {
    private issueService: IssueService;
    private boardService: BoardService;
    private webhookService: WebhookService;

    constructor(issueService: IssueService, boardService: BoardService, webhookService: WebhookService) {
        this.issueService = issueService;
        this.boardService = boardService;
        this.webhookService = webhookService;
    }

    async getIssue(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const issue: Issue | undefined = await this.issueService.getIssue(id);
            if (!issue) {
                return res.status(404).json({ message: 'Issue not found' });
            }
            res.json(issue);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async updateIssue(req: Request, res: Response) {
        const { issueKey } = req.params;
        const updateData = req.body;
        try {
            const updatedIssue = await this.issueService.updateIssue(issueKey, updateData);
            if (!updatedIssue) {
                return res.status(404).json({ message: 'Issue not found' });
            }

            // Trigger webhook for issue updated event
            await this.webhookService.triggerWebhook('issue_updated', updatedIssue);

            res.json(updatedIssue);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
