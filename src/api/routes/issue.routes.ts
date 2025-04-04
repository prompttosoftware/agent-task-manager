import express from 'express';
import { issueController } from '../controllers/issue.controller';
import { validateAddAttachment } from '../api/controllers/issue.validation';
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({}), // Use disk storage for now, configure as needed
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Invalid file type.'));
    }
  },
});

const router = express.Router();

router.get('/:issueKey', issueController.getIssue);
router.post('/:issueKey/attachments', validateAddAttachment, upload.array('attachments'), issueController.addAttachment);

export default router;