import express from 'express';
import { createIssue, getIssue, updateIssue, deleteIssue, listIssues, searchIssues, getIssueTransitions, transitionIssue, addAttachment, linkIssues, updateAssignee, getCreateIssueMetadata, getIssueByKey } from '../controllers/issue.controller';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Configure multer for file uploads

router.post('/', createIssue);
router.get('/:issueKey', getIssueByKey);
router.put('/:id', updateIssue);
router.delete('/:id', deleteIssue);
router.get('/', listIssues);
router.get('/search', searchIssues);
router.get('/:issueKey/transitions', getIssueTransitions);
router.post('/:issueKey/transitions', transitionIssue);
router.post('/:issueKey/attachments', upload.array('attachments'), addAttachment);
router.post('/issuelinks', linkIssues);
router.put('/:issueKey/assignee', updateAssignee);
router.get('/issue/createmeta', getCreateIssueMetadata);

export default router;