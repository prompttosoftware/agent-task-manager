import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Creates a new issue
 *     description: Creates a new issue with the provided details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project:
 *                 type: string
 *                 description: The key of the project the issue belongs to.
 *                 example: "TEST"
 *               summary:
 *                 type: string
 *                 description: The summary of the issue.
 *                 example: "REST API issue creation test"
 *               issueType:
 *                 type: string
 *                 description: The name of the issue type (e.g., "Bug", "Task").
 *                 example: "Task"
 *               description:
 *                 type: string
 *                 description: The description of the issue.
 *                 example: "Creating an issue via REST API."
 *             required:
 *               - project
 *               - summary
 *               - issueType
 *     responses:
 *       201:
 *         description: Issue created successfully. Returns the created issue details.
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
 *               example:
 *                 id: "10000"
 *                 key: "TEST-1"
 *                 self: "http://localhost:8080/rest/api/2/issue/10000"
 *       400:
 *         description: Bad request, invalid input data.
 *       500:
 *         description: Internal server error.
 */
router.post('/rest/api/2/issue', createIssue);

export default router;
