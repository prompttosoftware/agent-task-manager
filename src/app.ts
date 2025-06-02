import express, { Request, Response } from 'express';
import {
  DbSchema,
} from './models.js';
import { createIssue } from './api/controllers/issueController.ts';

const app = express();
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World');
});

app.post('/issues', createIssue);

export default app;
