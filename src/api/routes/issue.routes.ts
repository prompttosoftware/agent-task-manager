import express from 'express';
import { createIssue, getIssue, updateIssue, deleteIssue, listIssues } from '../controllers/issue.controller';

const router = express.Router();

router.post('/', createIssue);
router.get('/:id', getIssue);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);
router.get('/', listIssues);

export default router;