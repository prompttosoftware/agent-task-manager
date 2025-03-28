// src/api/controllers/issue.controller.test.ts
import request from 'supertest';
import app from '../../src/app'; // Assuming your app is exported
import * as issueService from '../services/issue.service';
import { Issue } from '../types/issue.d';

jest.mock('../services/issue.service');

describe('Issue Controller', () => {
  describe('GET /issues', () => {
    it('should find issues and return 200', async () => {
      const mockIssues: Issue[] = [
        {
          id: '1',
          summary: 'Test issue',
          description: 'This is a test issue',
          status: 'open',
          assignee: 'testuser',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      (issueService.findIssues as jest.Mock).mockResolvedValue(mockIssues);

      const response = await request(app).get('/issues');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockIssues);
      expect(issueService.findIssues).toHaveBeenCalled();
    });

    it('should return 500 if issueService.findIssues throws an error', async () => {
      (issueService.findIssues as jest.Mock).mockRejectedValue(new Error('Service error'));

      const response = await request(app).get('/issues');

      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ message: 'Internal Server Error' });
      expect(issueService.findIssues).toHaveBeenCalled();
    });

     it('should handle filtering by status', async () => {
            const mockIssues: Issue[] = [
                {
                    id: '1',
                    summary: 'Test issue',
                    description: 'This is a test issue',
                    status: 'open',
                    assignee: 'testuser',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];
            (issueService.findIssues as jest.Mock).mockResolvedValue(mockIssues);

            const response = await request(app).get('/issues?status=open');

            expect(response.statusCode).toBe(200);
            expect(issueService.findIssues).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }));
        });
  });

  describe('POST /issues', () => {
    it('should create a new issue and return 201', async () => {
      const newIssueData = {
        summary: 'New issue',
        description: 'This is a new issue',
      };
      const mockIssue: Issue = {
        id: '2',
        summary: newIssueData.summary,
        description: newIssueData.description,
        status: 'open',
        assignee: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      (issueService.createIssue as jest.Mock).mockResolvedValue(mockIssue);

      const response = await request(app).post('/issues').send(newIssueData).set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual(mockIssue);
      expect(issueService.createIssue).toHaveBeenCalledWith(newIssueData);
    });

    it('should return 400 if the request body is invalid', async () => {
      const response = await request(app).post('/issues').send({ invalid: 'data' }).set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(400);
    });

     it('should return 500 if issueService.createIssue throws an error', async () => {
            (issueService.createIssue as jest.Mock).mockRejectedValue(new Error('Service error'));
            const response = await request(app).post('/issues').send({ summary: 'test', description: 'test' }).set('Content-Type', 'application/json');
            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({ message: 'Internal Server Error' });
        });
  });
});