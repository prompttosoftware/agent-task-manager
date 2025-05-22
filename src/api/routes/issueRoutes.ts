import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Creates a new issue
 *     description: Creates a new issue in the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fields:
 *                 type: object
 *                 properties:
 *                   project:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         description: The key of the project
 *                   issuetype:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: The name of the issue type (e.g., 'Story', 'Bug'). Available issue types are 'Story', 'Bug', 'Task', and 'Epic'.
 *                   summary:
 *                     type: string
 *                     description: The summary/title of the issue
 *                   description:
 *                     type: string
 *                     description: The description of the issue
 *             example:
 *               fields:
 *                 project:
 *                   key: "TEST"
 *                 issuetype:
 *                   name: "Story"
 *                 summary: "This is a test issue"
 *                 description: "Creating an issue via the API."
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
 *                 key:
 *                   type: string
 *                 self:
 *                   type: string
 *       400:
 *         description: Invalid request payload
 *       500:
 *         description: Internal server error
 */
router.post('/rest/api/2/issue', createIssue);

export default router;
