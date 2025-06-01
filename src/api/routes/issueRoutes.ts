import { Router, RequestHandler } from 'express';
import { createIssue } from '../controllers/createIssue';
import { getIssues, getIssue, getIssueByKeyEndpoint } from '../controllers/readIssues';
import { updateIssueEndpoint } from '../controllers/updateIssue';
import { deleteIssueEndpoint } from '../controllers/deleteIssue';

const router = Router();

// Route to create a new issue
router.post('/issues', createIssue as RequestHandler);

// Route to get all issues
router.get('/issues', getIssues);

// Route to get a specific issue by its ID
router.get('/issues/:id', getIssue);

// Route to get a specific issue by its key
// The path parameter name should match what getIssueByKeyEndpoint expects (e.g., 'key')
router.get('/issues/key/:key', getIssueByKeyEndpoint);

// Route to update an existing issue by its ID
router.put('/issues/:id', updateIssueEndpoint);

// Route to delete an issue by its ID
router.delete('/issues/:id', deleteIssueEndpoint);

export default router;
