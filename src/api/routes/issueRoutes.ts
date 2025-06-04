import { Router } from 'express';
import { createIssue } from '../controllers/issueController'; // Assuming controller is in ../controllers

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Create a new issue
 *     tags:
 *       - Issues
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               // Define the expected properties for creating an issue
 *               // This is a placeholder; replace with actual schema details
 *               summary:
 *                 type: string
 *                 description: The summary of the issue.
 *                 example: "Fix bug in user profile"
 *               description:
 *                 type: string
 *                 description: The detailed description of the issue.
 *                 example: "When clicking on the edit profile button, the form does not load."
 *               projectKey:
 *                 type: string
 *                 description: The key of the project the issue belongs to.
 *                 example: "PROJ"
 *               issueType:
 *                 type: string
 *                 description: The type of the issue (e.g., Bug, Task, Story).
 *                 example: "Bug"
 *               // Add other relevant fields like priority, assignee, etc.
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 // Define the properties of the response object
 *                 // This is a placeholder; replace with actual response structure
 *                 id:
 *                   type: string
 *                   description: The ID of the created issue.
 *                 key:
 *                   type: string
 *                   description: The key of the created issue.
 *                 self:
 *                   type: string
 *                   description: The URL of the created issue.
 *       400:
 *         description: Bad request (e.g., missing required fields, invalid data)
 *       500:
 *         description: Internal server error
 */
router.post('/rest/api/2/issue', createIssue);

export default router;
