import { Request, Response } from 'express';
import { issueService } from '../services/issueService';

export const issueController = {
  async linkIssue(req: Request, res: Response) {
    const { issueId } = req.params;
    const { linkedIssueId, linkType } = req.body;

    if (!issueId || !linkedIssueId || !linkType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
      await issueService.linkIssue(issueId, linkedIssueId, linkType);
      return res.status(200).json({ message: 'Issue linked successfully' });
    } catch (error: any) {
      console.error('Error linking issue:', error);
      return res.status(500).json({ error: error.message || 'Failed to link issue' });
    }
  }
};
