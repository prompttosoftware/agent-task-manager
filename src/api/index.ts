import { Router, Request, Response } from 'express';
import { AnyIssue, Task, Story, Epic, Bug, Subtask, BaseIssue, EpicSpecifics, SubtaskSpecifics } from '../models/issue';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
/**
 * @openapi
 * components:
 *   schemas:
 *     BaseIssue:
 *       type: object
 *       required:
 *         - id
 *         - key
 *         - issueType
 *         - summary
 *         - status
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the issue.
 *         key:
 *           type: string
 *           description: The unique key of the issue.
 *         issueType:
 *           type: string
 *           enum:
 *             - Task
 *             - Story
 *             - Epic
 *             - Bug
 *             - Subtask
 *           description: The type of the issue.
 *         summary:
 *           type: string
 *           description: A brief summary of the issue.
 *         description:
 *           type: string
 *           description: A detailed description of the issue.
 *         status:
 *           type: string
 *           enum:
 *             - Todo
 *             - In Progress
 *             - Done
 *           description: The current status of the issue.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the issue was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the issue was last updated.
 *     Task:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseIssue'
 *     Story:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseIssue'
 *     Bug:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseIssue'
 *     Epic:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseIssue'
 *       properties:
 *         childIssueKeys:
 *           type: array
 *           items:
 *             type: string
 *           description: An array of keys for child issues.
 *     Subtask:
 *       allOf:
 *         - $ref: '#/components/schemas/BaseIssue'
 *       properties:
 *         parentIssueKey:
 *           type: string
 *           description: The key of the parent issue.
 *     AnyIssue:
 *       oneOf:
 *         - $ref: '#/components/schemas/Task'
 *         - $ref: '#/components/schemas/Story'
 *         - $ref: '#/components/schemas/Epic'
 *         - $ref: '#/components/schemas/Bug'
 *         - $ref: '#/components/schemas/Subtask'
 */

const router = Router();

// In-memory database (replace with a real database in a production environment)
let db: { issues: AnyIssue[], issueKeyCounter: number } = {
  issues: [],
  issueKeyCounter: 0,
};

/**
 * @openapi
 * /api/issues:
 *   get:
 *     summary: Retrieve a list of issues.
 *     description: Retrieve a list of issues from the system.
 *     responses:
 *       200:
 *         description: A list of issues.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AnyIssue'
 *       500:
 *         description: Internal server error.
 */
/**
 * @openapi
 *   /api/issues:
 *     get:
 *       summary: Get all issues
 *       description: Retrieve a list of all issues.
 *       responses:
 *         '200':
 *           description: Successfully retrieved a list of issues.
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AnyIssue'
 *         '500':
 *           description: Internal server error.
 */
router.get('/issues', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(db.issues);
});

/**
 * @openapi
 * /api/issues:
 *   post:
 *     summary: Create a new issue.
 *     description: Create a new issue in the system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnyIssue'
 *     responses:
 *       '201':
 *         description: Issue created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnyIssue'
 *       '400':
 *         description: Bad request. Invalid input.
 *       '500':
 *         description: Internal server error.
 */
router.post('/api/issues', (req: Request, res: Response) => {
  const newIssue: AnyIssue = req.body;
  // Basic validation
  if (!newIssue.issueType || !newIssue.summary || !newIssue.status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  //Assign an id and key
  newIssue.id = crypto.randomUUID(); // Assuming import of crypto
  db.issueKeyCounter++;
  newIssue.key = `ATM-${db.issueKeyCounter}`;
  db.issues.push(newIssue);
  res.status(201).json(newIssue);
});

export default router;
