import express, { Request, Response } from 'express';
import { Board, Issue } from './types';

const app = express();
const port = 3000;

// Sample data (replace with actual data fetching)
const boards: Board[] = [
  {
    id: 1,
    name: 'Development',
    statuses: [
      { id: 101, name: 'To Do', category: 'open' },
      { id: 102, name: 'In Progress', category: 'open' },
      { id: 103, name: 'Done', category: 'done' },
    ],
  },
];

const issues: Issue[] = [
  {
    id: '1',
    key: 'ATM-1',
    summary: 'Implement user authentication',
    status: { id: 102, name: 'In Progress', category: 'open' },
    boardId: 1,
  },
  {
    id: '2',
    key: 'ATM-2',
    summary: 'Design database schema',
    status: { id: 101, name: 'To Do', category: 'open' },
    boardId: 1,
  },
];

app.get('/board/:boardId/issues', (req: Request, res: Response) => {
  const boardId = parseInt(req.params.boardId, 10);
  const board = boards.find((b) => b.id === boardId);

  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  const boardIssues = issues.filter((issue) => issue.boardId === boardId);

  const response = boardIssues.map(issue => ({
    id: issue.id,
    key: issue.key,
    fields: {
      summary: issue.summary,
      status: { name: issue.status.name },
    },
  }));

  res.json(response);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});