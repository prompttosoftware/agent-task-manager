import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AnyIssue, BaseIssue, Epic, Subtask, Task, Story, Bug, EpicSpecifics, SubtaskSpecifics, DbSchema } from './models.ts';

const app = express();
app.use(express.json());

const db: DbSchema = {
  issues: [],
  issueKeyCounter: 1,
};

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.post('/issues', (req: Request, res: Response) => {
  try {
    const newIssue: AnyIssue = req.body;
    // Validate the request body against the AnyIssue type
    // This is a basic validation, you might want to use a library like Zod or Joi for more robust validation
    if (!newIssue.issueType || !newIssue.summary || !newIssue.status) {
      return res.status(400).json({ error: 'Invalid issue data' });
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    const key = `ISSUE-${db.issueKeyCounter.toString().padStart(4, '0')}`;

    const createdIssue: AnyIssue = {
      ...newIssue,
      id,
      key,
      createdAt: now,
      updatedAt: now,
    };

    db.issues.push(createdIssue);
    db.issueKeyCounter++;

    res.status(201).json(createdIssue);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default app;
