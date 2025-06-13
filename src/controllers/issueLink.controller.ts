import { Request, Response, NextFunction } from 'express';
import { IssueLinkService } from '../services/issueLink.service';
import { BadRequestError, NotFoundError } from '../utils/http-errors';

export class IssueLinkController {
  constructor(private issueLinkService: IssueLinkService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.issueLinkService.create(req.body);
      res.status(201).send();
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        res.status(400).json({ message: error.message });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
      } else {
        console.error('Unexpected error creating issue link:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  }
}
