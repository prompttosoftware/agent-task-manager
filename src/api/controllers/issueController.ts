import { Request, Response, NextFunction } from 'express';

export const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('createIssue endpoint');
};

export const getIssue = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('getIssue endpoint');
};

export const updateIssue = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('updateIssue endpoint');
};

export const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('deleteIssue endpoint');
};

export const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('getAllIssues endpoint');
};

export const createWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('createWebhookEndpoint endpoint');
};

export const deleteWebhookEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('deleteWebhookEndpoint endpoint');
};

export const linkIssues = async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send('linkIssues endpoint');
};