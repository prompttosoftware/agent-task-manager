// src/api/controllers/issue.controller.test.ts

import request from 'supertest';
import app from '../../src/index'; // Assuming your app is exported
import * as issueService from '../../src/api/services/issue.service'; // Corrected import
import { Issue } from '../../src/types/issue.d';
import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest'; // Import Vitest functions
import { createDatabase, closeDatabase } from '../../src/db/database';
import Database from 'better-sqlite3';

vi.mock('../../src/api/services/issue.service'); // Use vi.mock for Vitest

describe('Issue Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
  });

  beforeAll(async () => {
    await createDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /issues/:id', () => {
    it('should get an issue and return 200 if found', async () => {
      const mockIssue: Issue = {
        id: 1,
        summary: 'Test issue',
        description: 'This is a test issue',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      (issueService.getIssue as any).mockResolvedValue(mockIssue);

      const response = await request(app).get('/issues/1');

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockIssue);
      expect(issueService.getIssue).toHaveBeenCalledWith(1);
    });

    it('should return 404 if issue is not found', async () => {
      (issueService.getIssue as any).mockResolvedValue(undefined);

      const response = await request(app).get('/issues/999');

      expect(response.statusCode).toBe(404);
      expect(issueService.getIssue).toHaveBeenCalledWith(999);
    });

    it('should return 400 for an invalid id', async () => {
      const response = await request(app).get('/issues/abc');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid issue ID');
    });

    it('should return 500 if issueService.getIssue throws an error', async () => {
      (issueService.getIssue as any).mockRejectedValue(new Error('Service error'));

      const response = await request(app).get('/issues/1');

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Service error');
    });
  });

  describe('POST /issues', () => {
    it('should create a new issue and return 201', async () => {
      const newIssueData = {
        summary: 'New issue',
        description: 'This is a new issue',
        status: 'open',
      };
      const mockIssue: Issue = {
        id: 2,
        ...newIssueData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      (issueService.createIssue as any).mockResolvedValue(mockIssue);

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
      (issueService.createIssue as any).mockRejectedValue(new Error('Service error'));
      const response = await request(app).post('/issues').send({ summary: 'test', description: 'test', status: 'open' }).set('Content-Type', 'application/json');
      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Service error');
    });

    it('should rollback transaction on create issue database error', async () => {
        const newIssueData = {
            summary: 'New issue',
            description: 'This is a new issue',
            status: 'open',
        };

        const mockExec = vi.fn();
        // Mock the createIssue function to throw an error
        (issueService.createIssue as any).mockImplementation(() => {
            throw new Error('Simulated database error');
        });

        // Mock db.exec to spy on the rollback
        const dbMock = {
          exec: mockExec
        };
        vi.mock('../../src/db/database', () => ({
          ...jest.requireActual('../../src/db/database'),
          db: dbMock,
        }));

        const response = await request(app).post('/issues').send(newIssueData).set('Content-Type', 'application/json');

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Simulated database error');
        expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('PUT /issues/:id', () => {
    it('should update an issue and return 200', async () => {
      const updateData = {
        summary: 'Updated issue',
      };
      (issueService.updateIssue as any).mockResolvedValue({ changes: 1 });

      const response = await request(app).put('/issues/1').send(updateData).set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(200);
      expect(issueService.updateIssue).toHaveBeenCalledWith(1, updateData);
      expect(response.body.message).toBe('Issue updated');
    });

    it('should return 400 for an invalid id', async () => {
        const response = await request(app).put('/issues/abc').send({ summary: 'Updated issue' }).set('Content-Type', 'application/json');

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toBe('Invalid issue ID');
    });

    it('should return 404 if issue is not found', async () => {
      (issueService.updateIssue as any).mockResolvedValue({ changes: 0 });

      const response = await request(app).put('/issues/999').send({ summary: 'Updated issue' }).set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(404);
      expect(issueService.updateIssue).toHaveBeenCalledWith(999, expect.anything());
      expect(response.body.message).toBe('Issue not found or no changes');
    });

    it('should return 500 if issueService.updateIssue throws an error', async () => {
      (issueService.updateIssue as any).mockRejectedValue(new Error('Service error'));

      const response = await request(app).put('/issues/1').send({ summary: 'Updated issue' }).set('Content-Type', 'application/json');

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Service error');
    });

    it('should rollback transaction on update issue database error', async () => {
        const updateData = {
            summary: 'Updated issue',
        };

        const mockExec = vi.fn();
        // Mock the updateIssue function to throw an error
        (issueService.updateIssue as any).mockImplementation(() => {
            throw new Error('Simulated database error');
        });

        // Mock db.exec to spy on the rollback
        const dbMock = {
          exec: mockExec
        };
        vi.mock('../../src/db/database', () => ({
          ...jest.requireActual('../../src/db/database'),
          db: dbMock,
        }));

        const response = await request(app).put('/issues/1').send(updateData).set('Content-Type', 'application/json');

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Simulated database error');
        expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('DELETE /issues/:id', () => {
    it('should delete an issue and return 204', async () => {
      (issueService.deleteIssue as any).mockResolvedValue(undefined);

      const response = await request(app).delete('/issues/1');

      expect(response.statusCode).toBe(204);
      expect(issueService.deleteIssue).toHaveBeenCalledWith(1);
    });

    it('should return 400 for an invalid id', async () => {
      const response = await request(app).delete('/issues/abc');

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe('Invalid issue ID');
    });

    it('should return 500 if issueService.deleteIssue throws an error', async () => {
      (issueService.deleteIssue as any).mockRejectedValue(new Error('Service error'));

      const response = await request(app).delete('/issues/1');

      expect(response.statusCode).toBe(500);
      expect(response.body.message).toBe('Service error');
    });

    it('should rollback transaction on delete issue database error', async () => {
        // Mock the deleteIssue function to throw an error
        (issueService.deleteIssue as any).mockImplementation(() => {
            throw new Error('Simulated database error');
        });
        const mockExec = vi.fn();
        // Mock db.exec to spy on the rollback
        const dbMock = {
          exec: mockExec
        };
        vi.mock('../../src/db/database', () => ({
          ...jest.requireActual('../../src/db/database'),
          db: dbMock,
        }));

        const response = await request(app).delete('/issues/1');

        expect(response.statusCode).toBe(500);
        expect(response.body.message).toBe('Simulated database error');
        expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
