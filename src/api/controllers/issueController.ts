import { Request, Response } from 'express';
import { TaskService } from '../../services/task.service';
import { AnyIssue, IssueType, Subtask } from '../../models/issue';
import { Database } from '../../db/database';

export const createIssue = async (req: Request, res: Response) => {
  console.log(req.body);
  console.log("createIssue called");
  try {
    const { fields } = req.body;

    if (!fields) {
      return res.status(400).json({ error: 'Missing required field: fields' });
    }

    if (!fields.summary) {
      return res.status(400).json({ error: 'Missing required field: fields.summary' });
    }

    if (!fields.issuetype || !fields.issuetype.name) {
      return res.status(400).json({ error: 'Missing required field: fields.issuetype.name' });
    }

    if (!fields.status) {
      return res.status(400).json({ error: 'Missing required field: fields.status' });
    }

    const issueType = fields.issuetype.name.toUpperCase() as IssueType;

    if (!['TASK', 'STOR', 'EPIC', 'BUG', 'SUBT'].includes(issueType)) {
      return res.status(400).json({ error: 'Invalid issue type' });
    }
    let parentIssueKey: string | undefined = undefined;

    if (issueType === 'SUBT') {
      if (!fields.parentIssueKey) {
        return res.status(400).json({ error: 'Missing required field: fields.parentIssueKey for subtask' });
      }
      parentIssueKey = fields.parentIssueKey;
    }

    let newIssue: AnyIssue = {
      summary: fields.summary,
      description: fields.description,
      issueType,
      status: fields.status,
    } as AnyIssue; // Initial cast to AnyIssue

    if (issueType === 'SUBT') {
        newIssue = {
            ...newIssue,
            issueType,
            parentIssueKey: parentIssueKey!, //Non-null assertion since it's already validated
        } as Subtask;
    }

    const db = new Database(); // Assuming Database is initialized here or injected
    const taskService = new TaskService(db);
    const createdIssue = await taskService.createTask({
      title: newIssue.summary,
      description: newIssue.description,
      issueType: newIssue.issueType,
      status: newIssue.status,
      parentIssueKey: (newIssue as Subtask).parentIssueKey, // Cast to Subtask to access parentIssueKey safely
    });

    res.status(201).json(createdIssue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: error.message || 'Failed to create issue' });
  }
};
