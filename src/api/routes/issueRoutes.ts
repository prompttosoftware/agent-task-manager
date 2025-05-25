import { Router } from 'express';
import { createIssue } from '../controllers/issueController.ts';

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
 *                 example: Task
 *               summary:
 *                 type: string
 *                 description: A brief summary of the issue.
 *                 example: Implement user login feature
 *               status:
 *                 type: string
 *                 description: The initial status of the issue (e.g., Open, To Do).
 *                 example: To Do
 *     responses:
 *       201:
 *         description: Issue created successfully (simulation).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Issue created successfully (simulation)
 *                 data:
 *                   type: object
 *                   properties:
 *                     issueType:
 *                       type: string
 *                       example: Task
 *                     summary:
 *                       type: string
 *                       example: Implement user login feature
 *                     status:
 *                       type: string
 *                       example: To Do
 *       400:
 *         description: Bad Request - Missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields: issueType, summary, and status are required.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/rest/api/2/issue', createIssue);

export default router;
