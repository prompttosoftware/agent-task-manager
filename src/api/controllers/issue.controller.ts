// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { IssueService } from '../../src/services/issue.service';
import { Issue } from '../../src/types/issue.d';
import { BoardService } from '../../src/services/board.service';

export class IssueController {
    private issueService: IssueService;
    private boardService: BoardService;

    constructor(issueService: IssueService, boardService: BoardService) {
        this.issueService = issueService;
        this.boardService = boardService;
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
}