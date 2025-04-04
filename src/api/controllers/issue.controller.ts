import { Request, Response } from 'express';
import { validationResult, body, param } from 'express-validator';
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
