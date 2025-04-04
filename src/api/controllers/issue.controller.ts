import { Request, Response } from 'express';
import { issueService } from '../services/issue.service';
import { validationResult } from 'express-validator';
import multer from 'multer';

export const issueController = {
  async getIssue(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const issueKey = req.params.issueKey;
      const issue = await issueService.getIssue(issueKey);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.status(200).json(issue);
    } catch (error: any) {
      console.error('Error fetching issue:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  },

  async addAttachment(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const issueKey = req.params.issueKey;
      const upload = multer({ dest: 'uploads/' });
      upload.single('attachment')(req, res, async (err: any) => {
        if (err) {
          console.error('File upload error:', err);
          return res.status(400).json({ message: 'File upload error' });
        }
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        const filePath = req.file.path;
        // Process the file (e.g., save to database, etc.)
        try{
          const attachmentId = await issueService.addAttachment(issueKey, filePath);
          res.status(200).json({ message: 'Attachment uploaded successfully', attachmentId });
        } catch (error:any) {
          console.error('Error adding attachment:', error);
          res.status(500).json({ message: error.message || 'Internal server error' });
        }
      });
    } catch (error: any) {
      console.error('Error adding attachment:', error);
      res.status(500).json({ message: error.message || 'Internal server error' });
    }
  },
};