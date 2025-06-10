import { Request, Response } from 'express';

export class IssueController {
  async createIssue(req: Request, res: Response) {
    console.log('createIssue called');
    res.status(201).json({ success: true, message: 'Issue created' });
  }

  async getIssue(req: Request, res: Response) {
    console.log('getIssue called');
    res.status(200).json({ success: true, data: { id: req.params.id, message: 'Issue retrieved' } });
  }

  async deleteIssue(req: Request, res: Response) {
    console.log('deleteIssue called');
    res.status(200).json({ success: true, message: 'Issue deleted' });
  }
}
