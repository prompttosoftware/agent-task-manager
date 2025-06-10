import { Request, Response } from 'express';
import { Issue } from '../db/entities/issue.entity';
import { IssueService } from '../services/issue.service';

export class IssueController {
  private readonly issueService: IssueService;

  constructor() {
    this.issueService = new IssueService();
  }

  async createIssue(req: Request, res: Response) {
    try {
      const issue = await this.issueService.createIssue(req.body);
      return res.status(200).json(issue);
    } catch (error) {
      console.error('Error creating issue:', error);
      return res.status(500).json({ error: 'Failed to create issue' });
    }
  }

  async getIssue(req: Request, res: Response) {
    try {
      const issueKey = req.params.issueKey;
      const issue = await this.issueService.getIssue(issueKey);
      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      return res.status(200).json(issue);
    } catch (error) {
      console.error('Error getting issue:', error);
      return res.status(500).json({ error: 'Failed to get issue' });
    }
  }

  async deleteIssue(req: Request, res: Response) {
    try {
      const issueKey = req.params.issueKey;
      await this.issueService.deleteIssue(issueKey);
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting issue:', error);
      return res.status(500).json({ error: 'Failed to delete issue' });
    }
  }

  async addAttachment(req: Request, res: Response) {
    try {
      const issueKey = req.params.issueKey;
      // Assuming multer middleware handles the file upload
      // and the files are available in req.files

      if (!req.files || Array.isArray(req.files) && req.files.length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
      }
      // Access the uploaded files through req.files
      const files = req.files as Express.Multer.File[];

      // Process each file (e.g., save to disk, store metadata)
      files.forEach(file => {
        console.log('Uploaded file:', file.originalname);
        // Example:  Save file to disk
        // const filePath = `/path/to/uploads/${file.originalname}`;
        // fs.writeFileSync(filePath, file.buffer);
      });

      return res.status(200).json({ message: 'Files uploaded successfully' });
    } catch (error) {
      console.error('Error adding attachment:', error);
      return res.status(500).json({ error: 'Failed to add attachment' });
    }
  }
}
