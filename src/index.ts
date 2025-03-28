import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Issue, IssueLink, IssueType } from './src/models/Issue';
import { StatusCategory } from './src/models/Board';

const app = express();
const port = 3000;

app.use(express.json());

// Mock data - replace with database integration
let issues: Issue[] = [];

const issueTypeDetails: { [key in IssueType]?: { description: string; fields?: { [key: string]: any } } } = {
  [IssueType.Bug]: { description: 'A problem which impairs or prevents the functions of a product.', fields: { priority: ['High', 'Medium', 'Low'] } },
  [IssueType.Task]: { description: 'A unit of work.' },
  [IssueType.Story]: { description: 'A user story.', fields: { assignee: 'string', epicLink: 'string' } },
};

// Helper function to find an issue by ID
function findIssue(id: string): Issue | undefined {
  return issues.find((issue) => issue.id === id);
}

// Helper function to validate issue key
function isValidIssueKey(issueKey: string): boolean {
  return issues.some(issue => issue.id === issueKey);
}

// GET /issues
app.get('/issues', (req: Request, res: Response) => {
  res.json(issues);
});

// GET /issues/:id
app.get('/issues/:id', (req: Request, res: Response) => {
  const issue = findIssue(req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  res.json(issue);
});

// POST /issues
app.post('/issues', (req: Request, res: Response) => {
  // Validate request body
  if (!req.body.summary || !req.body.issueType) {
    return res.status(400).json({ message: 'Summary and issueType are required' });
  }

  if (!Object.values(IssueType).includes(req.body.issueType)) {
    return res.status(400).json({ message: 'Invalid issueType' });
  }

  const issueType = req.body.issueType as IssueType;
  const newIssue: Issue = {
    id: uuidv4(),
    summary: req.body.summary,
    statusCategory: StatusCategory.TO_DO,
    issueType: issueType,
  };

  // Add issue-type specific fields
  const issueTypeDetail = issueTypeDetails[issueType];
  if (issueTypeDetail?.fields) {
    for (const field in issueTypeDetail.fields) {
      newIssue[field] = req.body[field];
    }
  }

  issues.push(newIssue);
  res.status(201).json(newIssue);
});

// PUT /issues/:id
app.put('/issues/:id', (req: Request, res: Response) => {
  const issue = findIssue(req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }

  // Validate request body
  if (!req.body.summary) {
    return res.status(400).json({ message: 'Summary is required' });
  }

  issue.summary = req.body.summary;
  res.json(issue);
});

// DELETE /issues/:id
app.delete('/issues/:id', (req: Request, res: Response) => {
  issues = issues.filter((issue) => issue.id !== req.params.id);
  res.status(204).send();
});

// GET /issue/createmeta
app.get('/issue/createmeta', (req: Request, res: Response) => {
  // Return available issue types and their fields
  const createMeta = Object.entries(issueTypeDetails).map(([issueType, details]) => ({
    id: issueType,
    name: issueType,
    description: details?.description,
    fields: details?.fields,
  }));

  res.json({ issueTypes: createMeta });
});

// POST /issues/:id/links
app.post('/issues/:id/links', (req: Request, res: Response) => {
  const issue = findIssue(req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }

  if (!req.body.type || !req.body.issueKey) {
    return res.status(400).json({ message: 'Link type and issueKey are required' });
  }

  if (!isValidIssueKey(req.body.issueKey)) {
    return res.status(400).json({ message: 'Invalid issueKey.  Issue does not exist.' });
  }

  const newLink: IssueLink = {
    type: req.body.type,
    issueKey: req.body.issueKey,
  };

  if (!issue.links) {
    issue.links = [];
  }
  issue.links.push(newLink);

  res.status(201).json(newLink);
});

// GET /issues/:id/links
app.get('/issues/:id/links', (req: Request, res: Response) => {
  const issue = findIssue(req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }

  res.json(issue.links || []);
});

// PUT /issues/:id/links - Update links (including remove)
app.put('/issues/:id/links', (req: Request, res: Response) => {
  const issue = findIssue(req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }

  if (!Array.isArray(req.body.links)) {
    return res.status(400).json({ message: 'Links must be an array' });
  }

  // Validate each link
  for (const link of req.body.links) {
    if (!link.type || !link.issueKey) {
      return res.status(400).json({ message: 'Link type and issueKey are required for each link' });
    }
    if (!isValidIssueKey(link.issueKey)) {
      return res.status(400).json({ message: `Invalid issueKey: ${link.issueKey}. Issue does not exist.` });
    }
  }

  issue.links = req.body.links;

  res.json(issue.links);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
