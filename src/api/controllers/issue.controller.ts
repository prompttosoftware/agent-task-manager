import { Request, Response } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import * as issueService from '../services/issue.service';

export const createIssue = async (req: Request, res: Response) => {
  await Promise.all([
    body('title').isString().notEmpty().withMessage('Title is required').trim().escape().isLength({ max: 255 }).withMessage('Title must be less than 255 characters').run(req),
    body('description').optional().isString().trim().escape().run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const issue = await issueService.createIssue(req.body);
    res.status(201).json(issue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIssue = async (req: Request, res: Response) => {
  await param('id').isUUID().withMessage('Invalid issue ID').run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const issue = await issueService.getIssue(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.status(200).json(issue);
  } catch (error: any) {
    console.error('Error getting issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  await Promise.all([
    param('id').isUUID().withMessage('Invalid issue ID').run(req),
    body('title').optional().isString().trim().escape().isLength({ max: 255 }).withMessage('Title must be less than 255 characters').run(req),
    body('description').optional().isString().trim().escape().run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const issue = await issueService.updateIssue(req.params.id, req.body);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.status(200).json(issue);
  } catch (error: any) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  await param('id').isUUID().withMessage('Invalid issue ID').run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    await issueService.deleteIssue(req.params.id);
    res.status(204).send(); // No Content
  } catch (error: any) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const listIssues = async (req: Request, res: Response) => {
  try {
    const issues = await issueService.listIssues();
    res.status(200).json(issues);
  } catch (error: any) {
    console.error('Error listing issues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const searchIssues = async (req: Request, res: Response) => {
  await query('query').optional().isString().trim().escape().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const results = await issueService.searchIssues(req.query.query as string);
    res.status(200).json(results);
  } catch (error: any) {
    console.error('Error searching issues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIssuesByBoard = async (req: Request, res: Response) => {
    await param('boardId').isUUID().withMessage('Invalid board ID').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const issues = await issueService.getIssuesByBoard(req.params.boardId);
        res.status(200).json(issues);
    } catch (error: any) {
        console.error('Error getting issues by board:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getIssueTransitions = async (req: Request, res: Response) => {
    await param('issueKey').isString().notEmpty().withMessage('Issue Key is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const transitions = await issueService.getIssueTransitions(req.params.issueKey);
        res.status(200).json(transitions);
    } catch (error: any) {
        console.error('Error getting issue transitions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const transitionIssue = async (req: Request, res: Response) => {
    await Promise.all([
        param('issueKey').isString().notEmpty().withMessage('Issue Key is required').run(req),
        body('transitionId').isString().notEmpty().withMessage('Transition ID is required').run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await issueService.transitionIssue(req.params.issueKey, req.body.transitionId);
        res.status(204).send();
    } catch (error: any) {
        console.error('Error transitioning issue:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const addAttachment = async (req: Request, res: Response) => {
    await param('issueKey').isString().notEmpty().withMessage('Issue Key is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Assuming you have middleware to handle file uploads (e.g., multer)
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    }

    try {
        // Assuming you have a service function to handle attachment upload
        const issueKey = req.params.issueKey;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };
        const filePaths = files.attachments.map(file => file.path);
        await issueService.addAttachment(issueKey, filePaths);
        res.status(201).json({ message: 'Attachments added successfully' });
    } catch (error: any) {
        console.error('Error adding attachment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const linkIssues = async (req: Request, res: Response) => {
    await Promise.all([
        body('fromIssueKey').isString().notEmpty().withMessage('From Issue Key is required').run(req),
        body('toIssueKey').isString().notEmpty().withMessage('To Issue Key is required').run(req),
        body('linkType').isString().notEmpty().withMessage('Link Type is required').run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await issueService.linkIssues(req.body.fromIssueKey, req.body.toIssueKey, req.body.linkType);
        res.status(201).json({ message: 'Issue linked successfully' });
    } catch (error: any) {
        console.error('Error linking issues:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateAssignee = async (req: Request, res: Response) => {
    await Promise.all([
        param('issueKey').isString().notEmpty().withMessage('Issue Key is required').run(req),
        body('assignee').isString().notEmpty().withMessage('Assignee is required').run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await issueService.updateAssignee(req.params.issueKey, req.body.assignee);
        res.status(200).json({ message: 'Assignee updated successfully' });
    } catch (error: any) {
        console.error('Error updating assignee:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCreateIssueMetadata = async (_req: Request, res: Response) => {
    try {
        const metadata = await issueService.getCreateIssueMetadata();
        res.status(200).json(metadata);
    } catch (error: any) {
        console.error('Error getting create issue metadata:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getIssueByKey = async (req: Request, res: Response) => {
    await param('issueKey').isString().notEmpty().withMessage('Issue Key is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const issue = await issueService.getIssueByKey(req.params.issueKey);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.status(200).json(issue);
    } catch (error: any) {
        console.error('Error getting issue by key:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
