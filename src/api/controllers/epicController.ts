import { Request, Response, NextFunction } from 'express';
import { Issue } from '../../models/issue';
import * as IssueModule from '../../models/issue';

export const getEpics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const epics = await (IssueModule as any).Issue.findAll({ where: { issueTypeId: 1 } }); // Assuming issueTypeId 1 represents Epics
    res.json(epics);
  } catch (error) {
    next(error);
  }
};