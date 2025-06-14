import express, { Router } from 'express';
import { IssueLinkController } from '../controllers/issueLink.controller';
import { container } from 'tsyringe';
import { authenticate } from '../middleware/logging.middleware';

const router: Router = express.Router();
const issueLinkController = container.resolve(IssueLinkController);

router.post('/rest/api/2/issueLink', authenticate, async (req, res, next) => {
  await issueLinkController.create(req, res, next);
  // Do not return the response object
});

export default router;
