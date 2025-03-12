// src/controllers/issueController.ts
import { Request, Response } from 'express';
import { Issue } from '../models/issue';

// In-memory storage (replace with database)
const issues: Issue[] = [
  { id: '1', boardId: 'board1', summary: 'Issue 1', description: 'Description 1', status: 'Open' },
  { id: '2', boardId: 'board1', summary: 'Issue 2', description: 'Description 2', assignee: 'user1', status: 'In Progress' },
];

// Helper function to generate a unique ID (replace with UUID generation)
const generateId = () => String(Math.random()).substring(2, 10);

export const findIssue = (req: Request, res: Response) => {
  const issueId = req.params.id;
  const issue = issues.find(issue => issue.id === issueId);

  if (issue) {
    res.json(issue);
  } else {
    res.status(404).json({ message: 'Issue not found' });
  }
};

export const getIssuesForBoard = (req: Request, res: Response) => {
    const boardId = req.params.boardId;
    const issuesForBoard = issues.filter(issue => issue.boardId === boardId);
    res.json(issuesForBoard);
};

export const addIssue = (req: Request, res: Response) => {
    const newIssue: Issue = { ...req.body, id: generateId() }; // Generate an ID
    issues.push(newIssue);
    res.status(201).json(newIssue);
};

export const transitionIssue = (req: Request, res: Response) => {
    const issueId = req.params.id;
    const { transitionId } = req.body;
    const issueIndex = issues.findIndex(issue => issue.id === issueId);

    if (issueIndex === -1) {
        return res.status(404).json({ message: 'Issue not found' });
    }

    // In a real implementation, you'd use transitionId to update the status.
    // For now, we'll just update the status to 'In Progress'.
    issues[issueIndex].status = 'In Progress';
    res.json(issues[issueIndex]);
};

export const deleteIssue = (req: Request, res: Response) => {
    const issueId = req.params.id;
    const issueIndex = issues.findIndex(issue => issue.id === issueId);

    if (issueIndex === -1) {
        return res.status(404).json({ message: 'Issue not found' });
    }

    issues.splice(issueIndex, 1);
    res.status(204).send(); // No content
};

export const updateAssignee = (req: Request, res: Response) => {
    const issueId = req.params.id;
    const { assignee } = req.body;
    const issueIndex = issues.findIndex(issue => issue.id === issueId);

    if (issueIndex === -1) {
        return res.status(404).json({ message: 'Issue not found' });
    }

    issues[issueIndex].assignee = assignee;
    res.json(issues[issueIndex]);
};

export const getIssueCreateMetadata = (req: Request, res: Response) => {
    // Mock metadata.  Replace with actual metadata retrieval logic.
    const metadata = {
        fields: {
            summary: { required: true, type: 'string' },
            description: { required: false, type: 'string' },
            boardId: {required: true, type: 'string'}
        }
    };
    res.json(metadata);
};

export const listTransitions = (req: Request, res: Response) => {
    const issueId = req.params.id;
    const issue = issues.find(issue => issue.id === issueId);

    if (!issue) {
        return res.status(404).json({ message: 'Issue not found' });
    }

    // Mock transitions. Replace with actual transition retrieval logic.
    const transitions = [
        { id: '1', name: 'To Do' },
        { id: '2', name: 'In Progress' },
        { id: '3', name: 'Done' }
    ];
    res.json(transitions);
};

export const issueLink = (req: Request, res: Response) => {
    // In a real implementation, this would link two issues.
    res.status(204).send(); // No content
};

export const addAttachment = (req: Request, res: Response) => {
    // In a real implementation, this would handle file uploads.
    res.status(204).send(); // No content
};
