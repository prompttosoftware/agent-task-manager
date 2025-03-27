"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueToBoard = exports.issues = exports.boards = void 0;
const express_1 = __importDefault(require("express"));
const issueController_1 = require("./controllers/issueController");
const app = (0, express_1.default)();
const port = 3000;
// In-memory storage for boards and issues
exports.boards = new Map();
exports.issues = new Map();
exports.issueToBoard = new Map(); // Maps issue key to board ID
// Mock data (remove later)
const initialIssues = [
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
initialIssues.forEach(issue => exports.issues.set(issue.key, issue));
// Example board (remove later)
exports.boards.set(1, {
    id: 1,
    name: 'Board 1',
    statuses: [],
});
// API endpoints
// Get issues for a specific board
app.get('/board/:boardId/issues', issueController_1.getIssuesForBoardController);
// Create a new issue (basic implementation - add more fields as needed)
app.post('/issues', express_1.default.json(), (req, res) => {
    const { key, summary, boardId } = req.body;
    if (!key || !summary || !boardId) {
        return res.status(400).send('Missing required fields');
    }
    const newIssue = {
        id: Math.floor(Math.random() * 1000), // Placeholder ID
        key: key,
        fields: { summary: summary, status: { name: 'To Do' } },
    };
    exports.issues.set(key, newIssue);
    exports.issueToBoard.set(key, boardId);
    res.status(201).json(newIssue);
});
// Assign an issue to a board
app.post('/board/:boardId/issue/:issueKey', (req, res) => {
    const boardId = parseInt(req.params.boardId, 10);
    const issueKey = req.params.issueKey;
    if (!exports.boards.has(boardId)) {
        return res.status(404).send('Board not found');
    }
    if (!exports.issues.has(issueKey)) {
        return res.status(404).send('Issue not found');
    }
    exports.issueToBoard.set(issueKey, boardId);
    res.status(200).send('Issue assigned to board');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map