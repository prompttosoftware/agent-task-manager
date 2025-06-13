import { Request, Response, NextFunction } from 'express';
import { IssueLinkService } from '../services/issueLink.service';
import { BadRequestError, NotFoundError } from '../utils/http-errors';
import { container } from 'tsyringe';

export class IssueLinkController {
  private issueLinkService: IssueLinkService;

  constructor() {
    this.issueLinkService = container.resolve(IssueLinkService);
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>> {
    try {
      await this.issueLinkService.create(req.body);
      return res.status(201).send();
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({ message: error.message });
      } else if (error instanceof NotFoundError) {
        return res.status(404).json({ message: error.message });
      }
      console.error('Unexpected error creating issue link:', error);
      return res.status(500).json({ message: 'Internal Server Error' });

    }
  }
}
