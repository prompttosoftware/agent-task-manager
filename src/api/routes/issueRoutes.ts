import { Router, Request, Response, RequestHandler } from 'express'; // Import Request, Response, RequestHandler
// Removed .ts extension from import path, as is standard practice
import { createIssue } from '../controllers/issueController'; // This is currently the *simulated* controller

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Create a new issue
 *     tags:
 *       - Issues
 *     description: Creates a new issue with the specified type, summary, and initial status.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - issueType
 *               - summary
 *               - status
 *             properties:
 *               issueType:
 *                 type: string
 *                 description: The type of the issue (e.g., Bug, Task).
 *                 enum: [Task, Story, Epic, Bug, Subtask]
 *                 example: Task
 *               summary:
 *                 type: string
 *                 description: A brief summary of the issue.
 *                 example: Implement user login feature
 *               status:
 *                 type: string
 *                 description: The initial status of the issue (e.g., Todo, In Progress).
 *                 enum: [Todo, In Progress, Done]
 *                 example: Todo
 *               description:
 *                 type: string
 *                 description: A detailed description of the issue (optional).
 *                 example: The user login feature needs to be implemented...
               parentIssueKey:
                 type: string
                 description: The key of the parent issue. Required only when issueType is 'Subtask'.
                 example: ATM-1
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The unique identifier for the issue (UUID).
 *                   example: 123e4567-e89b-12d3-a456-426614174000
 *                 key:
 *                   type: string
 *                   description: The project-specific key for the issue.
 *                   example: ATM-1
 *                 issueType:
 *                   type: string
 *                   description: The type of the issue (e.g., Bug, Task).
 *                   enum: [Task, Story, Epic, Bug, Subtask]
 *                   example: Task
 *                 summary:
 *                   type: string
 *                   description: A brief summary of the issue.
 *                   example: Implement user login feature
 *                 description:
 *                   type: string
 *                   description: A detailed description of the issue.
 *                   example: The user login feature needs to be implemented...
 *                 status:
 *                   type: string
 *                   description: The current status of the issue.
 *                   enum: [Todo, In Progress, Done]
 *                   example: Todo
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp when the issue was created (ISO8601).
 *                   example: 2023-10-26T10:00:00.000Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: The timestamp when the issue was last updated (ISO8601).
 *                   example: 2023-10-26T10:00:00.000Z
 *       400:
 *         description: Bad Request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A description of the validation error.
 *                   example: Missing required fields: issueType, summary, and status are required.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A description of the server error.
 *                   example: Internal server error
 */
// Corrected route path to be just /issue, as it will be mounted under /rest/api/2 in the app/tests.
router.post('/issue', createIssue);

// Add a simple GET route for testing routing setup
// Explicitly type the handler function using RequestHandler
const statusHandler: RequestHandler = (req, res) => {
  res.send('OK');
};
router.get('/status', statusHandler);


export default router;
