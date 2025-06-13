import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { IssueService } from '../services/issue.service';
import logger from '../utils/logger';
import { AttachmentService } from '../services/attachment.service';
import { createIssueBodySchema } from './schemas/issue.schema'; // Import AttachmentService

const isNumber = (value: any): boolean => {
  if (typeof value === 'string') {
    return /^\d+$/.test(value); // Check if the string contains only digits
  }
  return typeof value === 'number' && !isNaN(value);
};

export interface SearchParams {
  status?: number;
  issuetype?: number;
  assignee?: string;
}

export class IssueController {
  private issueService: IssueService;
  private attachmentService: AttachmentService; // Add AttachmentService

  constructor(issueService: IssueService, attachmentService: AttachmentService) {
    this.issueService = issueService;
    this.attachmentService = attachmentService; // Initialize AttachmentService
  }

  async create(req: Request, res: Response): Promise<Response<any, Record<string, any>>> {
    try {
      const validatedData = createIssueBodySchema.parse(req.body);
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

    let files: Express.Multer.File[] = [];

    try {
      // Check if req.files exists before attempting to access it
      if (req.files) {
        files = req.files as Express.Multer.File[];
      } else {
        console.log("req.files is undefined or null");
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      if (!files || files.length === 0) {
        console.log("No files found after middleware execution.");
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      const issueKey = req.params.issueKey;

      try {
        const attachmentMetadata = await this.attachmentService.create(issueKey, files);
        return res.status(200).json(attachmentMetadata);
      } catch (serviceError: any) {
        logger.error('Error creating attachment:', serviceError);
        if (serviceError.message === 'Issue not found') {
          return res.status(404).json({ message: 'Issue not found' });
        } else {
          return res.status(500).json({ message: 'Internal server error', error: serviceError.message });
        }
      }

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

      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      }
      next(error);
    }
  }

  async search(req: Request, res: Response): Promise<void> {
    try {
      const { status, issuetype, assignee } = req.query;

      // Validate parameters
      if (status !== undefined && !isNumber(status)) {
        res.status(400).json({ message: 'Invalid status parameter: must be a number' });
        return;
      }

      if (issuetype !== undefined && !isNumber(issuetype)) {
        res.status(400).json({ message: 'Invalid issuetype parameter: must be a number' });
        return;
      }

      if (assignee !== undefined && typeof assignee !== 'string') {
        res.status(400).json({ message: 'Invalid assignee parameter' });
        return;
      }

      const searchParams: SearchParams = {
        status: status ? Number(status) : undefined,
        issuetype: issuetype ? Number(issuetype) : undefined,
        assignee: assignee ? String(assignee) : undefined,
      };

      const issues = await this.issueService.search(searchParams);

      res.status(200).json({ total: issues.total, issues: issues.issues });
    } catch (error: any) {
      logger.error('Error searching issues:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
}
