import express, { Request, Response } from 'express';
import { Board, BoardStatus } from './interfaces/board';
import { v4 as uuidv4 } from 'uuid';
import { IssueService } from './services/issueService';
import { Issue } from './interfaces/board';
import { BoardController } from './controllers/boardController';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

// Enum for issue types
enum IssueType {
  Story = 'Story',
  Bug = 'Bug',
  Task = 'Task',
}

// In-memory data storage using Maps for faster lookups
const boards: Map<string, Board> = new Map([
  [
    '1',
    {
      id: '1',
      name: 'Board 1',
      statuses: [
        {
          id: '1',
          name: 'To Do',
          category: 'open',
        },
        {
          id: '2',
          name: 'In Progress',
          category: 'open',
        },
        {
          id: '3',
          name: 'Done',
          category: 'done',
        },
      ],
    },
  ],
]);

const issues: Map<string, Issue> = new Map([
  [
    '1',
    {
      id: '1',
      boardId: '1',
      title: 'Issue 1',
      description: 'Description for issue 1',
      statusId: '1',
      type: IssueType.Story,
    },
  ],
  [
    '2',
    {
      id: '2',
      boardId: '1',
      title: 'Issue 2',
      statusId: '2',
      type: IssueType.Bug,
    },
  ],
]);


interface Issue {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  statusId: string;
  type: IssueType;
}

// Initialize IssueService
const issueService = new IssueService();
const boardController = new BoardController(issueService);

app.get('/board/:boardId/issues', async (req: Request, res: Response) => {
  const boardId = req.params.boardId;

  // Error handling for invalid board IDs
  const board = boards.get(boardId);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  try {
      const boardIssues = await issueService.getIssuesForBoard(boardId);

      // Mimic Jira API response
      const response = {
          expand: 'schema,names',
          startAt: 0,
          maxResults: boardIssues.length,
          total: boardIssues.length,
          issues: boardIssues.map((issue) => {
              const status = board.statuses.find((status) => status.id === issue.statusId);
              return {
                  id: issue.id,
                  key: `ISSUE-${issue.id}`,
                  fields: {
                      summary: issue.title,
                      description: issue.description,
                      status: {
                          name: status ? status.name : 'Unknown', // Get the actual status name
                          id: issue.statusId,
                      },
                      issuetype: {
                          name: issue.type, // Use the enum for issue type
                      },
                  },
              };
          }),
      };

      res.json(response);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// POST endpoint to create a new board
app.post('/boards', (req: Request, res: Response) => {
  const { name, statuses }: { name: string; statuses: BoardStatus[] } = req.body;

  if (!name || !statuses || statuses.length === 0) {
    return res.status(400).json({ error: 'Name and statuses are required' });
  }

  const newBoard: Board = {
    id: uuidv4(), // Generate a unique ID
    name,
    statuses,
  };

  boards.set(newBoard.id, newBoard);
  res.status(201).json(newBoard);
});

// POST endpoint to create a new issue
app.post('/issues', (req: Request, res: Response) => {
  const {
    boardId,
    title,
    description,
    statusId,
    type,
  }: {
    boardId: string;
    title: string;
    description?: string;
    statusId: string;
    type: IssueType;
  } = req.body;

  // Basic validation
  if (!boardId || !title || !statusId || !type) {
    return res.status(400).json({ error: 'boardId, title, statusId, and type are required' });
  }

  // Check if board exists
  if (!boards.has(boardId)) {
    return res.status(404).json({ error: 'Board not found' });
  }

  // Check if status exists in board
  const board = boards.get(boardId);
  if (board && !board.statuses.some((s) => s.id === statusId)) {
    return res.status(400).json({ error: 'Invalid statusId for the specified board' });
  }

  const newIssue: Issue = {
    id: uuidv4(),
    boardId,
    title,
    description,
    statusId,
    type,
  };

  issues.set(newIssue.id, newIssue);
  res.status(201).json(newIssue);
});

// PUT endpoint to update an existing issue
app.put('/issues/:issueId', (req: Request, res: Response) => {
  const issueId = req.params.issueId;
  const {
    title,
    description,
    statusId,
    type,
  }: {
    title?: string;
    description?: string;
    statusId?: string;
    type?: IssueType;
  } = req.body;

  const issue = issues.get(issueId);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  // Update the issue properties if they are provided in the request body
  if (title !== undefined) {
    issue.title = title;
  } 
  if (description !== undefined) {
    issue.description = description;
  }  if (statusId !== undefined) {
    // Verify if status exists on the board
    const board = boards.get(issue.boardId);
    if (board && !board.statuses.some((s) => s.id === statusId)) {
      return res.status(400).json({ error: 'Invalid statusId for the specified board' });
    }    issue.statusId = statusId;
  }  if (type !== undefined) {
    issue.type = type;
  }

  issues.set(issueId, issue);
  res.json(issue);
});

// DELETE endpoint to delete an issue
app.delete('/issues/:issueId', (req: Request, res: Response) => {
  const issueId = req.params.issueId;

  if (!issues.has(issueId)) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issues.delete(issueId);
  res.status(204).send(); // No content
});

// PUT endpoint to update a board
app.put('/boards/:boardId', (req: Request, res: Response) => {
  const boardId = req.params.boardId;
  const { name, statuses }: { name?: string; statuses?: BoardStatus[] } = req.body;

  const board = boards.get(boardId);

  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }

  if (name !== undefined) {
    board.name = name;
  }
  if (statuses !== undefined) {
    board.statuses = statuses;
  }

  boards.set(boardId, board);
  res.json(board);
});

// DELETE endpoint to delete a board and associated issues
app.delete('/boards/:boardId', (req: Request, res: Response) => {
  const boardId = req.params.boardId;

  if (!boards.has(boardId)) {
    return res.status(404).json({ error: 'Board not found' });
  }

  // Delete associated issues
  for (const [issueId, issue] of issues) {
    if (issue.boardId === boardId) {
      issues.delete(issueId);
    }
  }

  boards.delete(boardId);
  res.status(204).send();
});

// GET endpoint to list all boards
app.get('/boards', async (req: Request, res: Response) => {
  boardController.listBoards(req, res);
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, world!');
});

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

export { app, server };
