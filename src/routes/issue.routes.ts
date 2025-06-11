import express, { Request, Response, NextFunction } from 'express';
import { IssueController } from '../controllers/issue.controller';
import { IssueService } from '../services/issue.service';
import upload from '../middleware/upload.config';
import multer from 'multer';
import { UploadedFile } from '../middleware/upload.config';

const router = express.Router();
const issueService = new IssueService();
const issueController = new IssueController(issueService);

router.post('/rest/api/2/issue', issueController.create.bind(issueController));
router.get('/rest/api/2/issue/:issueKey', issueController.findByKey.bind(issueController));
router.delete('/rest/api/2/issue/:issueKey', issueController.delete.bind(issueController));

router.post(
  '/rest/api/2/issue/:issueKey/attachments',
  (req: Request, res: Response, next: NextFunction) => {
    console.log("Attachment upload route hit in route definition.");
    const uploadMiddleware = upload.array('file', 10);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: 'File size exceeds the limit (10MB)' });
        }
        return res.status(400).json({ message: `Multer error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: `Internal server error: ${err.message}` });
      }

      if (!req.files || (req.files as UploadedFile[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }
      else {
        next();
      }
    });
  },
  issueController.createAttachment.bind(issueController)
);

export default router;
