import { Request, Response } from 'express';
import { issueService } from '../services/issue.service';
import { attachmentService, UploadResult } from '../services/attachment.service';
import { validationResult } from 'express-validator';

export const issueController = {
  async getIssue(req: Request, res: Response) {
    try {
      const issueKey = req.params.issueKey;
      const issue = await issueService.getIssue(issueKey);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.json(issue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  async addAttachment(req: Request, res: Response) {
    try {
      const issueKey = req.params.issueKey;

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
      }

      const files = Array.isArray(req.files.attachments) ? req.files.attachments : [req.files.attachments];
      const issue = await issueService.getIssue(issueKey);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      const issueId = issue.id;
      const uploadResults: UploadResult[] = await attachmentService.uploadAttachments(issueId, files);

      res.status(200).json(uploadResults);
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      res.status(500).json({ message: error.message });
    }
  }
};
