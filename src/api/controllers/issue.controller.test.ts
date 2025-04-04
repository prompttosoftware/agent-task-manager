// src/api/controllers/issue.controller.test.ts
import { expect, test, describe, jest } from 'vitest';
import request from 'supertest';
import app from '../../index'; // Assuming your main app file is index.ts
import * as issueService from '../services/issue.service';

// Mock the issueService to control its behavior in tests
jest.mock('../services/issue.service');

describe('Issue Controller - POST /issues', () => {
  const mockIssueServiceCreateIssue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (issueService.createIssue as jest.Mock).mockImplementation(mockIssueServiceCreateIssue);
  });

  test('should return 201 and the new issue if the request is valid', async () => {
    const newIssue = {
      summary: 'Test Summary',
      description: 'Test Description',
      issueType: 'Bug',
      project: 'ProjectA',
    };
    const createdIssue = { ...newIssue, id: '123', createdAt: new Date() };
    mockIssueServiceCreateIssue.mockResolvedValue(createdIssue);

    const response = await request(app).post('/issues').send(newIssue);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdIssue);
    expect(issueService.createIssue).toHaveBeenCalledWith(newIssue);
  });

  test('should return 400 if the request is invalid (missing summary)', async () => {
    const invalidIssue = {
      description: 'Test Description',
      issueType: 'Bug',
      project: 'ProjectA',
    };

    const response = await request(app).post('/issues').send(invalidIssue);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
    expect(response.body.errors).toBeInstanceOf(Array);
    expect(response.body.errors[0].msg).toBe('Summary is required');
    expect(issueService.createIssue).not.toHaveBeenCalled();
  });

  test('should return 500 if issue service fails', async () => {
    const newIssue = {
      summary: 'Test Summary',
      description: 'Test Description',
      issueType: 'Bug',
      project: 'ProjectA',
    };
    mockIssueServiceCreateIssue.mockRejectedValue(new Error('Service Error'));

    const response = await request(app).post('/issues').send(newIssue);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Service Error');
    expect(issueService.createIssue).toHaveBeenCalledWith(newIssue);
  });
});
