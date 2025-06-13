import express, { Request, Response, NextFunction } from 'express';
import { IssueController } from '../controllers/issue.controller';
import { IssueService } from '../services/issue.service';
import { AttachmentService } from '../services/attachment.service';
import upload from '../middleware/upload.config';
import multer from 'multer';
import { UploadedFile } from '../middleware/upload.config';

const router = express.Router();
const issueService = new IssueService();
const attachmentService = new AttachmentService();
const issueController = new IssueController(issueService, attachmentService);

router.post('/rest/api/2/issue', issueController.create.bind(issueController));
router.get('/rest/api/2/issue/:issueKey', issueController.findByKey.bind(issueController));
router.delete('/rest/api/2/issue/:issueKey', issueController.delete.bind(issueController));

router.post(
  '/rest/api/2/issue/:issueKey/attachments',
  (req: Request, res: Response, next: NextFunction) => {
    console.log("Attachment upload route hit in route definition.");
    console.log("req in route definition", req);
    next();
  },
  (req: Request, res: Response, next: NextFunction) => {
    upload.array('file', 10)(req, res, (err) => {
      if (err) {
        console.error("Error from upload.array middleware:", err);
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: `File size exceeds the limit of 10MB.` });
        } else if (err.message.includes('Multipart: Boundary not found')) {
          return res.status(400).json({ message: 'No files attached.' });
        }
        return res.status(500).json({ message: `File upload failed: ${err.message}` });
      }
      console.log("req.files in route definition after middleware", req.files);
      next();
    });
  },
  issueController.createAttachment.bind(issueController)
);

export default router;
