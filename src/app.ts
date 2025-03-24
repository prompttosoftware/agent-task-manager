import express from 'express';
import boardRoutes from './routes/boardRoutes';

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json()); 

// In-memory data storage
let boards: any[] = []; // Assuming Board and Issue interfaces are defined in types.ts
let issues: any[] = [];

// Route to create a new board (example)
app.post('/boards', (req, res) => {
    const newBoard = {
        id: Date.now(), // Simple ID generation, consider UUIDs for production
        name: req.body.name,
        statuses: req.body.statuses || [],
        issueIds: []
    };
    boards.push(newBoard);
    res.status(201).json(newBoard);
});

// Route to get all boards
app.get('/boards', (req, res) => {
    res.json(boards);
});

// Route to create an issue and associate it with a board
app.post('/issues', (req, res) => {
    const { summary, description, boardId } = req.body;
    const newIssue = {
        id: Date.now(),
        summary,
        description,
        boardId: boardId || null // Allow issues without a board
    };
    issues.push(newIssue);

    // Associate issue with board
    if (boardId) {
        const board = boards.find(b => b.id === boardId);
        if (board) {
            board.issueIds.push(newIssue.id);
        }
    }
    res.status(201).json(newIssue);
});

// Route to get all issues
app.get('/issues', (req, res) => {
    res.json(issues);
});

// Route to get issues for a specific board
app.get('/boards/:boardId/issues', (req, res) => {
    const boardId = parseInt(req.params.boardId, 10);
    const board = boards.find(b => b.id === boardId);
    if (!board) {
        return res.status(404).json({ message: 'Board not found' });
    }

    const boardIssueIds = board.issueIds;
    const boardIssues = issues.filter(issue => boardIssueIds.includes(issue.id));
    res.json(boardIssues);
});

app.use('/', boardRoutes);

export default app;