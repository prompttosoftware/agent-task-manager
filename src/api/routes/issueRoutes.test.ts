import request from 'supertest';
import app from '../../src/app';
import * as issueController from './controllers/issueController';
import { Request, Response, NextFunction } from 'express';

describe('Issue Routes', () => {
  it('should create a new issue', async () => {
    jest.spyOn(issueController, 'createIssue').mockImplementation((req: Request, res: Response, next: NextFunction) => {
      res.sendStatus(201);
    });

    const response = await request(app).post('/rest/api/2/issues');
    expect(response.statusCode).toBe(201);
  });
});
