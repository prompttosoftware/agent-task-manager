import { Router, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit'; // Added import
import { createIssue } from '../controllers/createIssue';
import { getIssues, getIssue, getIssueByKeyEndpoint } from '../controllers/readIssues';
import { updateIssueEndpoint } from '../controllers/updateIssue';
import { deleteIssueEndpoint } from '../controllers/deleteIssue';
import { authenticate } from '../middleware/authenticate';

// Define the rate limit middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});

const router = Router();

// Route to create a new issue
// Apply the rate limiter specifically to the POST /issues route
router.post('/issues', apiLimiter, authenticate, createIssue as RequestHandler);

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
