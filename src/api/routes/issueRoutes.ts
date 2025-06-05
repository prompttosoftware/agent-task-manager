import { Router } from 'express';
import * as issueController from '../controllers/issueController';

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Creates a new issue
 *     description: Creates a new issue resource.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               summary:
 *                 type: string
 *                 description: A brief summary of the issue.
 *               description:
 *                 type: string
 *                 description: A detailed description of the issue.
 *               project:
 *                 type: string
 *                 description: The project key or ID the issue belongs to.
 *               issueType:
 *                 type: string
 *                 description: The type of issue (e.g., Bug, Task).
 *             required:
 *               - summary
 *               - project
 *               - issueType
 *     responses:
 *       201:
 *         description: Issue created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created issue.
 *                 key:
 *                   type: string
 *                   description: The key of the created issue.
 *                 self:
 *                   type: string
 *                   description: The API URL for the created issue.
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.post('/rest/api/2/issue', issueController.createIssue);

export default router;
