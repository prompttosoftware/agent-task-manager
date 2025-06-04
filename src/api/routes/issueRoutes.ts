import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Creates a new issue.
 *     description: Creates a new issue in the system. Requires authentication and appropriate permissions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Add detailed schema properties here based on the expected request body for creating an issue
 *             # Example structure (replace with actual schema):
 *             properties:
 *               fields:
 *                 type: object
 *                 properties:
 *                   project:
 *                     type: object
 *                     properties:
 *                       key:
 *                         type: string
 *                         example: "PROJ"
 *                   summary:
 *                     type: string
 *                     example: "Bug in login flow"
 *                   issuetype:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Bug"
 *                   description:
 *                     type: string
 *                     example: "User cannot log in after password reset."
 *     responses:
 *       201:
 *         description: Issue created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               # Add schema for the response body (e.g., issue key, ID, self link)
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "10000"
 *                 key:
 *                   type: string
 *                   example: "PROJ-1"
 *                 self:
 *                   type: string
 *                   example: "http://example.com/rest/api/2/issue/10000"
 *       400:
 *         description: Invalid input or missing required fields.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Forbidden, user does not have permission to create issues.
 *       500:
 *         description: Internal server error.
 */
router.post('/rest/api/2/issue', createIssue);

export default router;
