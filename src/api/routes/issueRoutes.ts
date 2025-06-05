import { Router } from 'express';
import { createIssue } from '../controllers/issueController'; // Assuming the controller is located here

const router = Router();

/**
 * @swagger
 * /2/issue:
 *   post:
 *     summary: Creates a new issue
 *     tags: [Issues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Define schema properties based on your issue structure
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: The ID of the project the issue belongs to.
 *               issueType:
 *                 type: string
 *                 description: The type of issue (e.g., Bug, Task).
 *               summary:
 *                 type: string
 *                 description: A brief summary of the issue.
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue.
 *               reporterId:
 *                 type: string
 *                 description: The ID of the user reporting the issue.
 *               assigneeId:
 *                 type: string
 *                 description: The ID of the user assigned to the issue (optional).
 *               priority:
 *                 type: string
 *                 description: The priority of the issue (e.g., High, Medium).
 *             example:
 *               projectId: "PROJ-123"
 *               issueType: "Task"
 *               summary: "Implement user authentication"
 *               description: "Detailed steps for implementing user authentication feature."
 *               reporterId: "user-abc"
 *               assigneeId: "user-xyz"
 *               priority: "High"
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
 *                   description: The ID of the newly created issue.
 *                 key:
 *                   type: string
 *                   description: The unique key of the newly created issue (e.g., PROJ-1).
 *                 # Add other relevant issue properties returned on creation
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */
router.post('/2/issue', createIssue);

export default router;
