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
 *               // Define the schema properties based on expected Jira issue creation payload
 *               // Example (simplified):
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
 *                       id:
 *                         type: string
 *                         description: The ID of the issue type
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
 *                   id: "10002" # Example ID for a Story
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
 *                 // Define the schema properties based on expected response from Jira
 *                 // Example (simplified):
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
