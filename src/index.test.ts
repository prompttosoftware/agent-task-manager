import { app, server } from './index'; // Assuming your app is exported
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { IssueService } from './services/issueService';
import { IssueController } from './controllers/issueController';
import { Request, Response } from 'express';
import { Board, Issue, BoardStatus } from './interfaces/board';
import { v4 as uuidv4 } from 'uuid';

// Mock the IssueService for controller tests
const mockIssueService = {
    getIssuesForBoard: async (boardId: string) => {
        if (boardId === '1') {
            return [
                {
                    id: '101',
                    summary: 'Issue 1',
                    description: 'Desc',
                    boardId: '1',
                    statusId: '1',
                    type: 'Story',
                },
            ];
        } else {
            return [];
        }
    },
};

// Unit tests for IssueController
describe('IssueController', () => {
    it('should get issues for a board with valid boardId', async () => {
        const controller = new IssueController(mockIssueService as any);
        const mockRequest = { params: { boardId: '1' } } as unknown as Request;
        const mockResponse = {
            json: vi.fn().mockResolvedValue([
                {
                    id: '101',
                    summary: 'Issue 1',
                    description: 'Desc',
                    boardId: '1',
                    statusId: '1',
                    type: 'Story',
                }
            ]),
            status: vi.fn(() => mockResponse),
        } as unknown as Response;

        await controller.getIssuesForBoard(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ boardId: '1' })]));
    });

    it('should return 200 with an empty array if board not found', async () => {
        const controller = new IssueController(mockIssueService as any);
        const mockRequest = { params: { boardId: '999' } } as unknown as Request;
        const mockResponse = {
            json: vi.fn().mockResolvedValue([]),
            status: vi.fn(() => mockResponse),
        } as unknown as Response;

        await controller.getIssuesForBoard(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
});


// Integration tests for GET /board/:boardId/issues
describe('GET /board/:boardId/issues', () => {
    it('should return 200 and issues for a valid boardId', async () => {
        const res = await request(app).get('/board/1/issues');
        expect(res.statusCode).toEqual(200);
        // Add more specific checks for the response body if needed
    });

    it('should return 404 for an invalid boardId', async () => {
        const res = await request(app).get('/board/999/issues');
        expect(res.statusCode).toEqual(404);
    });
});


// Helper functions for creating and cleaning up boards and issues

let testBoardId: string;

// Setup: Create a board before running the tests
beforeAll(async () => {
    const createBoardResponse = await request(app)
        .post('/boards')
        .send({ name: 'Test Board', statuses: [{ id: '4', name: 'Testing', category: 'open' }] });
    testBoardId = createBoardResponse.body.id;
});

// Teardown: Clean up the board and issues after running tests
afterAll(async () => {
    if (testBoardId) {
        await request(app).delete(`/boards/${testBoardId}`);
    }
    server.close();
});



describe('POST /boards', () => {
  it('should create a new board', async () => {
    const res = await request(app)
      .post('/boards')
      .send({ name: 'Test Board', statuses: [{ id: '4', name: 'Testing', category: 'open' }] });
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual('Test Board');
  });

  it('should return 400 if name or statuses are missing', async () => {
    const res = await request(app).post('/boards').send({ statuses: [] });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toEqual('Name and statuses are required');
  });
});



describe('POST /issues', () => {
    it('should create a new issue', async () => {
        const res = await request(app)
            .post('/issues')
            .send({ boardId: testBoardId, title: 'Test Issue', description: 'Test Description', statusId: '4', type: 'Story' });
        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual('Test Issue');
    });

    it('should return 400 if required fields are missing', async () => {
        const res = await request(app)
            .post('/issues')
            .send({ boardId: testBoardId, title: 'Test Issue' });
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('boardId, title, statusId, and type are required');
    });

    it('should return 404 if board does not exist', async () => {
        const res = await request(app)
            .post('/issues')
            .send({ boardId: '999', title: 'Test Issue', description: 'Test Description', statusId: '1', type: 'Story' });
        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('Board not found');
    });

    it('should return 400 if statusId does not exist on the board', async () => {
        const res = await request(app)
            .post('/issues')
            .send({ boardId: testBoardId, title: 'Test Issue', description: 'Test Description', statusId: '999', type: 'Story' });
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Invalid statusId for the specified board');
    });
});

describe('PUT /issues/:issueId', () => {
    let issueId: string;

    beforeAll(async () => {
        const createIssueResponse = await request(app)
            .post('/issues')
            .send({ boardId: testBoardId, title: 'Issue to Update', description: 'Initial Description', statusId: '4', type: 'Story' });
        issueId = createIssueResponse.body.id;
    });

    it('should update an existing issue', async () => {
        const res = await request(app)
            .put(`/issues/${issueId}`)
            .send({ title: 'Updated Issue' });
        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual('Updated Issue');
    });

    it('should return 404 if issue is not found', async () => {
        const res = await request(app)
            .put('/issues/999')
            .send({ title: 'Updated Issue' });
        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('Issue not found');
    });

    it('should return 400 if statusId does not exist on the board', async () => {
        const res = await request(app)
            .put(`/issues/${issueId}`)
            .send({ statusId: '999' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Invalid statusId for the specified board');
    });
});

describe('DELETE /issues/:issueId', () => {
    let issueId: string;

    beforeAll(async () => {
      const createIssueResponse = await request(app)
        .post('/issues')
        .send({ boardId: testBoardId, title: 'Issue to Delete', description: 'Description', statusId: '4', type: 'Story' });
      issueId = createIssueResponse.body.id;
    });

    it('should delete an existing issue', async () => {
        const res = await request(app).delete(`/issues/${issueId}`);
        expect(res.statusCode).toEqual(204);
    });

    it('should return 404 if issue is not found', async () => {
        const res = await request(app).delete('/issues/999');
        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('Issue not found');
    });
});

describe('PUT /boards/:boardId', () => {
  it('should update an existing board', async () => {
      const res = await request(app).put(`/boards/${testBoardId}`).send({ name: 'Updated Board Name' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual('Updated Board Name');
  });

  it('should return 404 if board is not found', async () => {
      const res = await request(app).put('/boards/999').send({ name: 'Updated Board Name' });
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Board not found');
  });
});

describe('DELETE /boards/:boardId', () => {
  it('should delete a board', async () => {
      const res = await request(app).delete(`/boards/${testBoardId}`);
      expect(res.statusCode).toEqual(204);
  });

  it('should return 404 if board is not found', async () => {
      const res = await request(app).delete('/boards/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Board not found');
  });
});

describe('GET /boards', () => {
  it('should return 200 and a list of boards', async () => {
    const res = await request(app).get('/boards');
    expect(res.statusCode).toEqual(200);
    // Add more specific checks for the response body if needed
    expect(res.body).toBeInstanceOf(Array)
  });
});