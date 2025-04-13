// src/api/controllers/issue.controller.ts

import { Request, Response } from 'express';
import { addIssue, updateIssue, deleteIssue, updateAssignee } from '../services/issue.service';

export const createIssue = async (req: Request, res: Response) => {
  try {
    const issue = await addIssue(req.body);
    console.log('Issue created:', issue);
    res.status(201).json(issue);
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateIssueController = async (req: Request, res: Response) => {
  const { issueKey } = req.params;
  try {
    const updatedIssue = await updateIssue(issueKey, req.body);
    console.log('Issue updated:', updatedIssue);
    if (!updatedIssue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.status(200).json(updatedIssue);
  } catch (error: any) {
    console.error('Error updating issue:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteIssueController = async (req: Request, res: Response) => {
  const { issueKey } = req.params;
  try {
    await deleteIssue(issueKey);
    console.log('Issue deleted:', issueKey);
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting issue:', error);
    res.status(500).json({ message: error.message });
  }
};

export const assignIssue = async (req: Request, res: Response) => {
  const { issueKey } = req.params;
  const { assignee } = req.body;

  try {
    const updatedIssue = await updateAssignee(issueKey, assignee);
    console.log(`Issue ${issueKey} assigned to ${assignee}`, updatedIssue);
    if (!updatedIssue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.status(200).json(updatedIssue);
  } catch (error: any) {
    console.error('Error assigning issue:', error);
    res.status(500).json({ message: error.message });
  }
};
