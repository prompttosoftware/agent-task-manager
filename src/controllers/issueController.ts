import { Request, Response } from 'express';
import { issueService } from '../services/issueService';
import { Readable } from 'stream';
import { Issue } from '../types/issue';

export const issueController = {
    async createIssue(req: Request, res: Response) {
        const issue: Issue = req.body;
        if (!issue.summary) {
            return res.status(400).json({ error: 'Issue summary is required' });
        }
        try {
            const newIssue = await issueService.createIssue(issue);
            return res.status(201).json(newIssue);
        } catch (error: any) {
            console.error('Error creating issue:', error);
            return res.status(500).json({ error: error.message || 'Failed to create issue' });
        }
    },

    async getIssue(req: Request, res: Response) {
        const { issueId } = req.params;
        if (!issueId) {
            return res.status(400).json({ error: 'Issue ID is required' });
        }

        try {
            const issue = await issueService.getIssue(issueId);
            if (!issue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
            return res.status(200).json(issue);
        } catch (error: any) {
            console.error('Error getting issue:', error);
            return res.status(500).json({ error: error.message || 'Failed to get issue' });
        }
    },

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
  },

  async addAttachment(req: Request, res: Response) {
    const { issueId } = req.params;
    if (!issueId) {
      return res.status(400).json({ error: 'Missing issueId' });
    }

    try {
      // Assuming the attachment is sent in the request body as a stream (e.g., using multer middleware)
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
      }

      const file = req.files[Object.keys(req.files)[0]]; // Assuming only one file is uploaded
      if (!file) {
        return res.status(400).json({ message: 'No files were uploaded.' });
      }
      const fileStream = Readable.from(file.data);
      const attachmentDetails = { 
        filename: file.name,
        mimetype: file.mimetype,
        size: file.size,
        encoding: file.encoding
      };

      await issueService.addAttachment(issueId, fileStream, attachmentDetails);
      return res.status(201).json({ message: 'Attachment added successfully' });
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      return res.status(500).json({ error: error.message || 'Failed to add attachment' });
    }
  }
};
