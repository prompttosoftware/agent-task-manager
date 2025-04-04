// src/api/controllers/issue.controller.test.ts
import { deleteIssue, createIssue, getIssue, updateIssue, listIssues } from './issue.controller';
import * as issueService from '../services/issue.service';
import { Request, Response } from 'express';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

// Mock the issue service
vi.mock('../services/issue.service');

describe('Issue Controller - deleteIssue', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      params: {
        id: '123',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an issue and return 204 status', async () => {
    (issueService.deleteIssue as Mock).mockResolvedValue(undefined); // Simulate successful deletion

    await deleteIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.deleteIssue).toHaveBeenCalledWith('123');
    expect(mockResponse.status).toHaveBeenCalledWith(204);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  it('should return 500 if an error occurs during deletion (other errors)', async () => {
    const errorMessage = 'Failed to delete issue from the database';
    (issueService.deleteIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await deleteIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.deleteIssue).toHaveBeenCalledWith('123');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

    it('should return 400 if id is invalid', async () => {
        mockRequest = { params: { id: 'not-a-uuid' } };
        await deleteIssue(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    });
});

describe('Issue Controller - createIssue', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      body: {
        title: 'Test Title',
        description: 'Test Description',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create an issue and return 201 status', async () => {
    const mockIssue = { id: '456', ...mockRequest.body };
    (issueService.createIssue as Mock).mockResolvedValue(mockIssue);

    await createIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
  });

  it('should return 400 status if validation fails', async () => {
    mockRequest = { ...mockRequest, body: { title: '' } };
    await createIssue(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
  });

  it('should return 500 if an error occurs during creation', async () => {
    const errorMessage = 'Failed to create issue in the database';
    (issueService.createIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await createIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

    it('should return 400 status if title is too long', async () => {
        mockRequest = { ...mockRequest, body: { title: 'a'.repeat(256), description: 'test' } };
        await createIssue(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    });
});

describe('Issue Controller - getIssue', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      params: {
        id: '123',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should get an issue and return 200 status', async () => {
    const mockIssue = { id: '123', title: 'Test' };
    (issueService.getIssue as Mock).mockResolvedValue(mockIssue);

    await getIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.getIssue).toHaveBeenCalledWith('123');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
  });

  it('should return 404 if the issue is not found', async () => {
    (issueService.getIssue as Mock).mockResolvedValue(null);

    await getIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.getIssue).toHaveBeenCalledWith('123');
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
  });

  it('should return 500 if an error occurs during retrieval', async () => {
    const errorMessage = 'Failed to retrieve issue from the database';
    (issueService.getIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await getIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.getIssue).toHaveBeenCalledWith('123');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

    it('should return 400 if id is invalid', async () => {
        mockRequest = { params: { id: 'not-a-uuid' } };
        await getIssue(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    });
});

describe('Issue Controller - updateIssue', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      params: {
        id: '123',
      },
      body: {
        title: 'Updated Title',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update an issue and return 200 status', async () => {
    const mockIssue = { id: '123', title: 'Updated Title' };
    (issueService.updateIssue as Mock).mockResolvedValue(mockIssue);

    await updateIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.updateIssue).toHaveBeenCalledWith('123', mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
  });

  it('should return 404 if the issue is not found', async () => {
    (issueService.updateIssue as Mock).mockResolvedValue(null);

    await updateIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.updateIssue).toHaveBeenCalledWith('123', mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
  });

  it('should return 500 if an error occurs during update', async () => {
    const errorMessage = 'Failed to update issue in the database';
    (issueService.updateIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await updateIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.updateIssue).toHaveBeenCalledWith('123', mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });

    it('should return 400 if id is invalid', async () => {
        mockRequest = { ...mockRequest, params: { id: 'not-a-uuid' } };
        await updateIssue(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    });

    it('should return 400 if title is too long', async () => {
        mockRequest = { ...mockRequest, body: { title: 'a'.repeat(256), description: 'test' } };
        await updateIssue(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    });
});

describe('Issue Controller - listIssues', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should list issues and return 200 status', async () => {
    const mockIssues = [{ id: '1', title: 'Issue 1' }, { id: '2', title: 'Issue 2' }];
    (issueService.listIssues as Mock).mockResolvedValue(mockIssues);

    await listIssues(mockRequest as Request, mockResponse as Response);

    expect(issueService.listIssues).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssues);
  });

  it('should return 500 if an error occurs during listing', async () => {
    const errorMessage = 'Failed to list issues from the database';
    (issueService.listIssues as Mock).mockRejectedValue(new Error(errorMessage));

    await listIssues(mockRequest as Request, mockResponse as Response);

    expect(issueService.listIssues).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Internal server error' });
  });
});
