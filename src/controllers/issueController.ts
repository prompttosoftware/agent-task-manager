// src/controllers/issueController.ts
import { Request, Response } from 'express';
import * as issueService from '../services/issueService';

export async function createIssue(req: Request, res: Response) {
  try {
    const newIssue = await issueService.createIssue(req.body);
    res.status(201).json(newIssue);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to create issue' });
  }
}
