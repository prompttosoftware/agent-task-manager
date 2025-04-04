// src/api/routes/issue.routes.ts
import { Router } from 'express';
import { createIssue, getIssue, updateIssue, deleteIssue, listIssues } from '../controllers/issue.controller';
import { searchIssues } from '../controllers/issue.controller';

const router = Router();

router.post('/', createIssue);
router.get('/:id', getIssue);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);
router.get('/', listIssues);
router.get('/search', searchIssues);

export default router;