import express, { Request, Response } from 'express';
import { Issue } from './types';

const app = express();
const port = 3000;

// Mock data for now
const issues: Issue[] = [
  {
    id: 1,
    key: 'ATM-1',
    fields: {
      summary: 'Implement X',
      status: { name: 'To Do' },
    },
  },
  {
    id: 2,
    key: 'ATM-2',
    fields: {
      summary: 'Implement Y',
      status: { name: 'In Progress' },
    },
  },
];

app.get('/board/:boardId/issues', (req: Request, res: Response) => {
  const boardId = req.params.boardId;
  // In a real application, you'd fetch issues from a database based on boardId
  const boardIssues = issues.filter(issue => issue.key.startsWith(`ATM-${boardId}`))
  res.json(boardIssues);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});