import { Router } from 'express';
import * as issueController from '../api/controllers/issue.controller';

const router = Router();

router.post('/', issueController.create);
router.get('/:id', issueController.findOne);
router.get('/', issueController.findAll);
router.put('/:id', issueController.update);
router.delete('/:id', issueController.remove);

export default router;
