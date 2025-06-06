import { Router } from 'express';
import { createIssue } from '../controllers/issueController'; // Assuming the controller is in ../controllers/issueController

const router = Router();

/**
 * @swagger
 * /2/issue:
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
 *               // Define properties for the issue creation request body
 *               // This schema should match the expected structure of the request body
 *               // Example properties (adjust as needed):
 *               project:
 *                 type: string
 *                 description: The project key or ID for the new issue.
 *                 example: "PROJ"
 *               summary:
 *                 type: string
 *                 description: The summary/title of the issue.
 *                 example: "Bug in authentication module"
 *               issueType:
 *                 type: string
 *                 description: The type of issue (e.g., "Bug", "Task").
 *                 example: "Bug"
 *               description:
 *                 type: string
 *                 description: The detailed description of the issue.
 *                 example: "When trying to log in with invalid credentials, the error message is incorrect."
 *               // Add other relevant fields like reporter, assignee, priority, etc.
 *             required:
 *               - project
 *               - summary
 *               - issueType
 *     responses:
 *       201:
 *         description: Issue created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 // Define properties for the success response body
 *                 // Example properties (adjust as needed):
 *                 id:
 *                   type: string
 *                   description: The ID of the created issue.
 *                   example: "10001"
 *                 key:
 *                   type: string
 *                   description: The key of the created issue.
 *                   example: "PROJ-123"
 *                 self:
 *                   type: string
 *                   description: The URL to the created issue.
 *                   example: "http://example.com/rest/api/2/issue/10001"
 *       400:
 *         description: Invalid request body or parameters
 *       500:
 *         description: Internal server error
 */
router.post('/2/issue', createIssue);

export default router;
