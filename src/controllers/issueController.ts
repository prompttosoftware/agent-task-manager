// src/controllers/issueController.ts
import { Request, Response } from 'express';
import { issueService } from '../services/issueService';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    // Create the uploads directory if it doesn't exist
    if (!require('fs').existsSync(uploadDir)) {
      require('fs').mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

export class IssueController {
  async createIssue(req: Request, res: Response) {
    try {
      const { summary, description, issueType } = req.body;
      const issue = await issueService.createIssue(summary, description, issueType);
      res.status(201).json(issue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getIssue(req: Request, res: Response) {
    try {
      const { issueKey } = req.params;
      const issue = await issueService.getIssue(issueKey);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.json(issue);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async addAttachment(req: Request, res: Response) {
    try {
      const { issueKey } = req.params;
      // @ts-ignore
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const issue = await issueService.getIssue(issueKey);
      if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
      }

      const attachmentPath = file.path;
      await issueService.addAttachment(issueKey, attachmentPath);

      res.status(201).json({ message: 'Attachment added', filePath: attachmentPath });
    } catch (error: any) {
      if (error.message === 'Issue not found') {
        return res.status(404).json({ message: 'Issue not found' });
      }
      res.status(400).json({ message: error.message });
    }
  }
}

export const issueController = new IssueController();
