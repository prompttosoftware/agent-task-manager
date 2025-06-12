import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { UploadedFile } from '../middleware/upload.config';
import { createIssueBodySchema, CreateIssueInput } from './schemas/issue.schema';
import { IssueService } from '../services/issue.service';
import logger from '../utils/logger';

export class IssueController {
  private issueService: IssueService;

  constructor(issueService: IssueService) {
    this.issueService = issueService;
  }

  async create(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
      const validatedData: CreateIssueInput = createIssueBodySchema.parse(req.body);
      const issue = await this.issueService.create(validatedData);

      console.log("Issue object in controller:", issue);

      // Assuming issueService.create returns an object with id, key, and self
      res.status(201).json({
        id: issue.id,
        key: issue.issueKey,
        self: `/rest/api/2/issue/${issue.issueKey}`,
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else if (error instanceof Error && (error.message === 'Reporter not found' || error.message === 'Assignee not found')) {
        return res.status(404).json({ message: 'Reporter or Assignee not found' });
      } else {
        logger.error('Error creating issue:', error);
        console.log('Caught error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
      }
    }
  }

  async findByKey(req: Request, res: Response): Promise<void> {
    try {
      const issueKey = req.params.issueKey;
      const issue = await this.issueService.findByKey(issueKey);

      if (!issue) {
        res.status(404).json({ message: 'Issue not found' });
        return;
      }

      res.status(200).json({
        data: {
          issueKey: issue.issueKey,
          self: `/rest/api/2/issue/${issue.issueKey}`,
          summary: issue.title,
          description: issue.description,
          ...issue,
        },
      });
    } catch (error: any) {
      logger.error(`Error getting issue with key ${req.params.issueKey}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const issueKey = req.params.issueKey;
      const deleted = await this.issueService.deleteByKey(issueKey);

      if (!deleted) {
        res.status(404).json({ message: 'Issue not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      logger.error(`Error deleting issue with key ${req.params.issueKey}:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  public async createAttachment(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>> {
    console.log("Attachment upload route hit in controller.");
    console.log("req.files after hitting route:", req.files);

    try {
      // Check if req.files exists before attempting to access it
      if (!req.files) {
        console.log("req.files is undefined or null");
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      // Attempt to cast req.files to UploadedFile[] and log any errors
      let files: UploadedFile[];
      try {
        files = req.files as UploadedFile[];
      } catch (castError: any) {
        console.error("Error casting req.files to UploadedFile[]:", castError);
        return res.status(500).json({ message: 'Error processing uploaded files.', error: castError.message });
      }

      if (!files || files.length === 0) {
        logger.error("No files found after middleware execution.");
        return res.status(500).json({ message: 'Files missing after upload middleware.' });
      }
      res.status(200).send({ message: 'Attachment upload successful.' });

    } catch (error: any) {
      logger.error('Error creating attachment:', error);
      console.error('req.files:', req.files);
      console.error('Error object:', error);
      console.error('Error code:', error.code);
      console.error('Error name:', error.name);

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File size exceeds the limit of 10MB.' });
      }

      if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }
}
