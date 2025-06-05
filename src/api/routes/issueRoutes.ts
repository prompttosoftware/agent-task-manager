// src/api/routes/issueRoutes.ts
import { Router } from 'express';
import { createIssue } from '../controllers/issueController';

const router = Router();

/**
 * @swagger
 * /rest/api/2/issue:
 *   post:
 *     summary: Create a new issue
 *     description: Creates a new issue in the system with the provided details.
 *     tags:
 *       - Issues
 *     requestBody:
 *       description: Issue details
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
 *                       id:
 *                         type: string
 *                         description: The ID of the project (optional, use key if ID is unknown)
 *                   summary:
 *                     type: string
 *                     description: The summary/title of the issue
 *                   description:
 *                     type: string
 *                     description: The detailed description of the issue
 *                   issuetype:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The ID of the issue type
 *                       name:
 *                         type: string
 *                         description: The name of the issue type (optional, use id if name is unknown)
 *                 required:
 *                   - project
 *                   - summary
 *                   - issuetype
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
 *                   description: The ID of the created issue
 *                 key:
 *                   type: string
 *                   description: The key of the created issue (e.g., PROJ-123)
 *                 self:
 *                   type: string
 *                   description: The URL of the created issue
 *       400:
 *         description: Invalid request body or data
 *       500:
 *         description: Internal server error
 */
router.post('/rest/api/2/issue', createIssue);

// This route is not part of the specific Swagger request but kept from previous context
router.post('/issues', createIssue);

export default router;
