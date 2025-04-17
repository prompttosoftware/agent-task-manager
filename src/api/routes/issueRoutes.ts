import express from 'express';
import { issueController } from '../controllers/issueController';
import { upload } from '../../app';

export const issueRoutes = express.Router();

issueRoutes.post('/:issueIdOrKey/attachments', upload.single('file'), issueController.addAttachment);
