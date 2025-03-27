import express, { Request, Response } from 'express';
import { Issue, Board } from './types';
import { getIssuesForBoardController } from './controllers/issueController';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.json());

// In-memory storage for boards and issues
export const boards: Map<number, Board> = new Map();
export const issues: Map<string, Issue> = new Map();
export const issueToBoard: Map<string, number> = new Map(); // Maps issue key to board ID

// Mock data (remove later)
const initialIssues: Issue[] = [
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

initialIssues.forEach(issue => issues.set(issue.key, issue));

// Example board (remove later)
boards.set(1, {
  id: 1,
  name: 'Board 1',
  statuses: [],
});

// API endpoints

// Get issues for a specific board
app.get('/board/:boardId/issues', getIssuesForBoardController);

// Implement API endpoint for 'List boards'
app.get('/boards', (req: Request, res: Response) => {
    const boardList = Array.from(boards.values());
    res.status(200).json(boardList);
});

// Create a new issue (basic implementation - add more fields as needed)
app.post('/issues', (req: Request, res: Response) => {
    const { key, summary, boardId }: { key: string, summary: string, boardId: number } = req.body;
    if (!key || !summary || !boardId) {
        return res.status(400).send('Missing required fields');
    }

    const newIssue: Issue = {
        id: Math.floor(Math.random() * 1000), // Placeholder ID
        key: key,
        fields: { summary: summary, status: { name: 'To Do' } },
    };
    issues.set(key, newIssue);
    issueToBoard.set(key, boardId);

    res.status(201).json(newIssue);
});

// Assign an issue to a board
app.post('/board/:boardId/issue/:issueKey', (req: Request, res: Response) => {
  const boardId = parseInt(req.params.boardId, 10);
  const issueKey = req.params.issueKey;

  if (!boards.has(boardId)) {
    return res.status(404).send('Board not found');
  }

  if (!issues.has(issueKey)) {
    return res.status(404).send('Issue not found');
  }

  issueToBoard.set(issueKey, boardId);
  res.status(200).send('Issue assigned to board');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});