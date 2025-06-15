import express, { Request, Response, NextFunction } from 'express';
import { IssueController } from '../controllers/issue.controller';
import { IssueService } from '../services/issue.service';
import { AttachmentService } from '../services/attachment.service';
import { IssueLinkService } from '../services/issueLink.service'; // Import IssueLinkService
import { AppDataSource } from '../data-source';
import upload from '../middleware/upload.config';
import multer from 'multer';
import { Issue } from '../db/entities/issue.entity';
import { NotFoundError } from '../utils/http-errors';

export const router = express.Router();

const issueRepository = AppDataSource.getRepository(Issue);
const attachmentService = new AttachmentService();
const issueService = new IssueService(issueRepository, attachmentService);
const issueLinkService = new IssueLinkService(); // Instantiate IssueLinkService
const issueController = new IssueController(issueService, attachmentService, issueLinkService);

// Middleware to check if the issue exists
const checkIfIssueExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const issueKey = req.params.issueKey;
  try {
    const issue = await issueService.findByKey(issueKey);
    if (!issue) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
    next();
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
    console.error("Error checking issue existence:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

router.post('/rest/api/2/issue', issueController.create.bind(issueController));
router.get('/rest/api/2/issue/:issueKey', issueController.findByKey.bind(issueController));
router.delete('/rest/api/2/issue/:issueKey', issueController.delete.bind(issueController));

router.post(
  '/rest/api/2/issue/:issueKey/attachments',
  checkIfIssueExists, // Add the middleware here
  (req: Request, res: Response, next: NextFunction) => {
    console.log("Attachment upload route hit in route definition.");
    console.log("req in route definition", req);
    next();
  },
  (req: Request, res: Response, next: NextFunction) => {
    upload.array('file', 10)(req, res, (err) => {
      if (err) {
        
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: `File size exceeds the limit of 10MB.` });
        } else if (err.message.includes('Multipart: Boundary not found')) {
          return res.status(400).json({ message: 'No files attached.' });
        }
        return next(err); // Pass the error to the next middleware
      }
      console.log("req.files in route definition after middleware", req.files);
      next();
    });
  },
  issueController.createAttachment.bind(issueController)
);

router.get('/rest/api/2/issue/:issueKey/transitions', issueController.getIssueTransitions.bind(issueController));
router.get('/rest/api/2/search', issueController.search.bind(issueController));

router.put('/rest/api/2/issue/:issueKey/assignee', issueController.updateAssignee.bind(issueController));

export default router;
