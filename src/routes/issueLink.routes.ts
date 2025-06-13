import express from 'express';
import { authenticate } from '../middleware/logging.middleware';
import { IssueLinkController } from '../controllers/issueLink.controller';
import { IssueLinkService } from '../services/issueLink.service'; // Import IssueLinkService

const router = express.Router();

const issueLinkService = new IssueLinkService(); // Create an instance of IssueLinkService
const issueLinkController = new IssueLinkController(issueLinkService); // Create an instance of IssueLinkController

router.post('/issueLink', authenticate, (req, res, next) => issueLinkController.create(req, res, next)); // Use the create method

export default router;
