import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AnyIssue, BaseIssue, Epic, Subtask, Task, Story, Bug, EpicSpecifics, SubtaskSpecifics, DbSchema } from './models.js';
import { createIssue } from './api/controllers/issueController.ts';

const app = express();
app.use(express.json());

const db: DbSchema = {
  issues: [],
  issueKeyCounter: 1,
};

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.post('/issues', createIssue);

export default app;
