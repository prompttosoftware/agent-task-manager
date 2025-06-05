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
    app.post('/rest/api/2/issue', createIssue); // Add the new route
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
    const issueRequestBody = {
      fields: {
        project: { key: "TEST" },
        summary: "Test issue creation via /issues",
        description: "This is a test description.",
        issuetype: { name: "Bug" }
      }
    };
    const res = await request(app)
      .post('/issues')
      .send(issueRequestBody); // Send a realistic body

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'Issue created successfully' });
  });

  // New test case for the /rest/api/2/issue route
  it('should return 201 and a success message when creating an issue via the /rest/api/2/issue endpoint', async () => {
    const issueRequestBody = {
      fields: {
        project: { key: "TEST" },
        summary: "Test issue creation via /rest/api/2/issue",
        description: "This is a test description.",
        issuetype: { name: "Bug" }
      }
    };
    const res = await request(app)
      .post('/rest/api/2/issue') // Use the new route
      .send(issueRequestBody); // Send a realistic body

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'Issue created successfully' });
  });
});
