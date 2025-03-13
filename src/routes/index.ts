// src/routes/index.ts
import express from 'express';
import { issueController } from '../controllers/issueController';
import multer from 'multer';

const router = express.Router();

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

router.post('/issue', issueController.createIssue);
router.get('/issue/:issueKey', issueController.getIssue);
router.post('/issue/:issueKey/attachments', upload.single('file'), issueController.addAttachment);

export default router;
