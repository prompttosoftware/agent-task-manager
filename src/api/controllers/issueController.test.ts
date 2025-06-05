import request = require('supertest');
import express = require('express');
import { createIssue } from './issueController';
import { Request, Response } from 'express';

describe('IssueController', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/issues', createIssue);
  });

  it('should create a new issue successfully', async () => {
    const mockIssue = { message: 'Issue created successfully' };
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnValue(mockIssue),
    } as unknown as Response;
    const req = {} as Request;

    createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockIssue);
  });

  it('should return 201 and a success message when creating an issue via the endpoint', async () => {
    const res = await request(app)
      .post('/issues')
      .send({}); // Send an empty body as the controller doesn't use it yet

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'Issue created successfully' });
  });
});
