import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AnyIssue, DbSchema } from './models';
import issueRoutes from './api/routes/issueRoutes';

const app = express();
const port = 3000;

// In-memory database
const db: DbSchema = {
  issues: [],
  issueKeyCounter: 1,
};

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  const exampleIssue: AnyIssue = {
    id: uuidv4(),
    key: `ISSUE-${db.issueKeyCounter++}`,
    issueType: 'Task',
    summary: 'Example Task',
    description: 'This is a sample task',
    status: 'Todo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  res.json(exampleIssue);
});

app.use('/api', issueRoutes);

export default app;
