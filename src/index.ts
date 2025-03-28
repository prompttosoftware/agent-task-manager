import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Issue, IssueLink, IssueType } from './src/models/Issue';
import { StatusCategory } from './src/models/Board';
import { resolve } from 'path';
import { Database } from './db';

const app = express();
const port = 3000;

app.use(express.json());

const db = new Database();

const issueTypeDetails: { [key in IssueType]?: { description: string; fields?: { [key: string]: any } } } = {
    [IssueType.Bug]: { description: 'A problem which impairs or prevents the functions of a product.', fields: { priority: ['High', 'Medium', 'Low'] } },
    [IssueType.Task]: { description: 'A unit of work.' },
    [IssueType.Story]: { description: 'A user story.', fields: { assignee: 'string', epicLink: 'string' } },
};

async function isValidIssueKey(issueKey: string): Promise<boolean> {
    try {
        await db.init();
        const issue = await db.getIssue(issueKey);
        return !!issue;
    } catch (error) {
        console.error('Error validating issue key:', error);
        return false;
    }
}

// GET /issues
app.get('/issues', async (req: Request, res: Response) => {
    try {
        await db.init();
        const issues = await db.getEpics();
        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /issues/:id
app.get('/issues/:id', async (req: Request, res: Response) => {
    const issueId = req.params.id;
    try {
        await db.init();
        const issue = await db.getIssue(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.json(issue);
    } catch (error) {
        console.error('Error fetching issue:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /issues
app.post('/issues', async (req: Request, res: Response) => {
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

    try {
        await db.init();
        await db.addIssue(newIssue);
        res.status(201).json(newIssue);
    } catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /issues/:id
app.put('/issues/:id', async (req: Request, res: Response) => {
    const issueId = req.params.id;
    try {
        await db.init();
        const issue = await db.getIssue(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Validate request body
        if (!req.body.summary) {
            return res.status(400).json({ message: 'Summary is required' });
        }

        issue.summary = req.body.summary;
        // TODO: implement update in db.ts
        res.json(issue);
    } catch (error) {
        console.error('Error updating issue:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /issues/:id
app.delete('/issues/:id', async (req: Request, res: Response) => {
    const issueId = req.params.id;
    try {
        await db.init();
        // TODO: implement delete in db.ts
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting issue:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
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
app.post('/issues/:id/links', async (req: Request, res: Response) => {
    const issueId = req.params.id;
    try {
        await db.init();
        const issue = await db.getIssue(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        if (!req.body.type || !req.body.issueKey) {
            return res.status(400).json({ message: 'Link type and issueKey are required' });
        }

        const isValid = await isValidIssueKey(req.body.issueKey);
        if (!isValid) {
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
        //TODO: Implement update links in db.ts
        res.status(201).json(newLink);
    } catch (error) {
        console.error('Error creating link:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /issues/:id/links
app.get('/issues/:id/links', async (req: Request, res: Response) => {
    const issueId = req.params.id;
    try {
        await db.init();
        const issue = await db.getIssue(issueId);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        res.json(issue.links || []);
    } catch (error) {
        console.error('Error getting links:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /issues/:id/links - Update links (including remove)
app.put('/issues/:id/links', async (req: Request, res: Response) => {
    const issueId = req.params.id;
    try {
        await db.init();
        const issue = await db.getIssue(issueId);
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
            const isValid = await isValidIssueKey(link.issueKey);
            if (!isValid) {
                return res.status(400).json({ message: `Invalid issueKey: ${link.issueKey}. Issue does not exist.` });
            }
        }

        issue.links = req.body.links;
        //TODO: Implement update links in db.ts
        res.json(issue.links);
    } catch (error) {
        console.error('Error updating links:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /issue/{issueId} - Implement Get Issue Endpoint
app.get('/issue/:issueId', async (req: Request, res: Response) => {
    const issueId = req.params.issueId;
    try {
        await db.init();
        const issue = await db.getIssue(issueId);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const jiraIssue = {
            id: issue.id,
            key: issue.id, // Use issue ID as key for now
            self: `http://localhost:3000/issue/${issue.id}`, // Replace with actual URL
            fields: {
                summary: issue.summary,
                issuetype: {
                    name: issue.issueType,
                    id: issue.issueType,
                    //TODO: Add more fields
                },
                status: {
                    name: issue.statusCategory,
                    //TODO: Add more fields
                }
                // Add more fields as needed to match Jira format
            }
        };

        res.json(jiraIssue);
    } catch (error) {
        console.error('Error fetching issue:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /issue?query={searchTerms} - Implement Find Issue Endpoint
app.get('/issue', async (req: Request, res: Response) => {
    const query = req.query.query as string;
    if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
    }

    try {
        await db.init();
        // Assuming you want to search in summary, description, etc.
        const issues = await db.searchIssues(query);

        const jiraIssues = issues.map(issue => ({
            id: issue.id,
            key: issue.id, // Use issue ID as key for now
            self: `http://localhost:3000/issue/${issue.id}`, // Replace with actual URL
            fields: {
                summary: issue.summary,
                issuetype: {
                    name: issue.issueType,
                    id: issue.issueType,
                },
                status: {
                    name: issue.statusCategory,
                }
            }
        }));

        res.json(jiraIssues);
    } catch (error) {
        console.error('Error searching issues:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});