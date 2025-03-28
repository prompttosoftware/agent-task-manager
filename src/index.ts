import express, { Request, Response } from 'express';
import { Issue } from './models/Issue';

const app = express();
const port = 3000;

app.use(express.json());

// Mock issue data (replace with database interaction)
const mockIssueTypes = {
  Task: {
    fields: ['summary', 'description', 'assignee', 'priority'],
  },
  Subtask: {
    fields: ['summary', 'description', 'assignee', 'priority'],
  },
  Story: {
    fields: ['summary', 'description', 'assignee', 'priority', 'epicLink'],
  },
  Bug: {
    fields: ['summary', 'description', 'assignee', 'priority', 'environment', 'stepsToReproduce'],
  },
  Epic: {
    fields: ['summary', 'description'],
  },
};

app.get('/issue/createmeta', (req: Request, res: Response) => {
  res.json({
    issueTypes: mockIssueTypes,
  });
});

app.post('/issue', (req: Request, res: Response) => {
  const { summary, description, issueType } = req.body;

  if (!summary || !description || !issueType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // In a real application, you'd save this to a database
  const newIssue: Issue = {
    id: Math.floor(Math.random() * 10000).toString(), // Generate a random ID
    summary,
    description,
    issueType,
    // Add other fields as needed
  };

  res.status(201).json(newIssue);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});