// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { Issue } from '../../models/issue.model';
import logger from '../utils/logger';

export const getAllIssues = async (req: Request, res: Response): Promise<void> => {
  logger.info('GET /issues', { method: req.method, url: req.originalUrl });
  try {
    const issues = await Issue.find();
    res.status(200).json(issues);
    logger.info('Issues retrieved successfully', { count: issues.length });
  } catch (error: any) {
    logger.error('Error retrieving issues', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};

export const createIssue = async (req: Request, res: Response): Promise<void> => {
    logger.info('POST /issues', { method: req.method, url: req.originalUrl, body: req.body });
  try {
    const issue = new Issue(req.body);
    const savedIssue = await issue.save();
    res.status(201).json(savedIssue);
      logger.info('Issue created successfully', { id: savedIssue._id });
  } catch (error: any) {
      logger.error('Error creating issue', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message });
  }
};

export const getIssueById = async (req: Request, res: Response): Promise<void> => {
  logger.info(`GET /issues/${req.params.id}`, { method: req.method, url: req.originalUrl });
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      logger.warn('Issue not found', { id: req.params.id });
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
    res.status(200).json(issue);
      logger.info('Issue retrieved successfully', { id: issue._id });
  } catch (error: any) {
      logger.error('Error retrieving issue', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};

export const updateIssue = async (req: Request, res: Response): Promise<void> => {
  logger.info(`PUT /issues/${req.params.id}`, { method: req.method, url: req.originalUrl, body: req.body });
  try {
    const issue = await Issue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!issue) {
      logger.warn('Issue not found', { id: req.params.id });
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
    res.status(200).json(issue);
      logger.info('Issue updated successfully', { id: issue._id });
  } catch (error: any) {
      logger.error('Error updating issue', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message });
  }
};

export const deleteIssue = async (req: Request, res: Response): Promise<void> => {
    logger.info(`DELETE /issues/${req.params.id}`, { method: req.method, url: req.originalUrl });
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) {
      logger.warn('Issue not found', { id: req.params.id });
      res.status(404).json({ message: 'Issue not found' });
      return;
    }
    res.status(204).send();
      logger.info('Issue deleted successfully', { id: req.params.id });
  } catch (error: any) {
      logger.error('Error deleting issue', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message });
  }
};
