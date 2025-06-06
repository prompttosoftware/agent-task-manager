import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Create a new issue
 *     tags: [Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fields:
 *                 type: object
 *                 description: The issue fields.
 *                 properties:
 *                   summary:
 *                     type: string
 *                     description: The summary/title of the issue.
 *                     example: "Bug in authentication module"
 *                   description:
 *                     type: string
 *                     description: The detailed description of the issue.
 *                     example: "When trying to log in with invalid credentials, the error message is incorrect."
 *                   issuetype:
 *                     type: object
 *                     description: The type of issue.
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: The name of the issue type (e.g., "TASK", "STOR", "EPIC", "BUG", "SUBT").
 *                         example: "BUG"
 *                   status:
 *                     type: string
 *                     description: The status of the issue.
 *                     example: "Open"
 *                   parentIssueKey:
 *                     type: string
 *                     description: The key of the parent issue (for subtasks).
 *                     example: "PROJ-123"
 *             required:
 *               - summary
 *               - issuetype
 *               - status
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
 *                   description: The ID of the created issue.
 *                   example: "10001"
 *                 key:
 *                   type: string
 *                   description: The key of the created issue.
 *                   example: "PROJ-123"
 *       400:
 *         description: Invalid request body or parameters
 *       500:
 *         description: Internal server error
 */
router.post('/rest/api/2/issue', createIssue);

export default router;
