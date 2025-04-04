// src/api/controllers/issue.controller.test.ts
import {
  createIssue,
  getIssue,
  updateIssue,
  deleteIssue,
  listIssues,
} from './issue.controller';
import * as issueService from '../services/issue.service';
import { Request, Response } from 'express';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { validationResult } from 'express-validator';

// Mock the issue service
vi.mock('../services/issue.service');
vi.mock('express-validator', () => ({
  validationResult: vi.fn(),
}));

describe('Issue Controller - createIssue', () => {
  let mockRequest: any;
  let mockResponse: any;
  const mockValidationResult = (errors: any) => {
    (validationResult as Mock).mockReturnValue({
      isEmpty: () => errors.length === 0,
      array: () => errors,
    });
  };

  beforeEach(() => {
    mockRequest = {
      body: {
        summary: 'Test Summary',
        description: 'Test Description',
        status: 'open',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockValidationResult([]); // Default: no validation errors
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create an issue and return 201 status', async () => {
    const mockIssue = { id: 1, ...mockRequest.body };
    (issueService.createIssue as Mock).mockResolvedValue(mockIssue);

    await createIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(201);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
  });

  it('should return 400 status if validation fails', async () => {
    mockValidationResult([{ msg: 'Invalid summary' }]); // Simulate a validation failure

    await createIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      errors: [{ msg: 'Invalid summary' }],
    });
    expect(issueService.createIssue).not.toHaveBeenCalled();
  });

  it('should return 500 status if an error occurs during issue creation', async () => {
    const errorMessage = 'Failed to create issue';
    (issueService.createIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await createIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});

describe('Issue Controller - getIssue', () => {
  let mockRequest: any;
  let mockResponse: any;
  const mockValidationResult = (errors: any) => {
    (validationResult as Mock).mockReturnValue({
      isEmpty: () => errors.length === 0,
      array: () => errors,
    });
  };

  beforeEach(() => {
    mockRequest = {
      params: {
        id: '1',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockValidationResult([]); // Default: no validation errors
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should get an issue and return 200 status', async () => {
    const mockIssue = { id: 1, summary: 'Test Issue' };
    (issueService.getIssue as Mock).mockResolvedValue(mockIssue);

    await getIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.getIssue).toHaveBeenCalledWith('1');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
  });

  it('should return 404 status if issue is not found', async () => {
    (issueService.getIssue as Mock).mockResolvedValue(undefined);

    await getIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.getIssue).toHaveBeenCalledWith('1');
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
  });

    it('should return 400 status if validation fails', async () => {
        mockValidationResult([{ msg: 'Invalid id' }]); // Simulate a validation failure

        await getIssue(mockRequest as Request, mockResponse as Response);

        expect(validationResult).toHaveBeenCalledWith(mockRequest);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid id' }] });
        expect(issueService.getIssue).not.toHaveBeenCalled();
    });

  it('should return 500 status if an error occurs during getting issue', async () => {
    const errorMessage = 'Failed to get issue';
    (issueService.getIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await getIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.getIssue).toHaveBeenCalledWith('1');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});

describe('Issue Controller - updateIssue', () => {
  let mockRequest: any;
  let mockResponse: any;
  const mockValidationResult = (errors: any) => {
    (validationResult as Mock).mockReturnValue({
      isEmpty: () => errors.length === 0,
      array: () => errors,
    });
  };

  beforeEach(() => {
    mockRequest = {
      params: {
        id: '1',
      },
      body: {
        summary: 'Updated Summary',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockValidationResult([]); // Default: no validation errors
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should update an issue and return 200 status', async () => {
    const mockIssue = { id: 1, summary: 'Updated Summary' };
    (issueService.updateIssue as Mock).mockResolvedValue(mockIssue);

    await updateIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.updateIssue).toHaveBeenCalledWith('1', mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
  });

  it('should return 404 status if issue is not found', async () => {
    (issueService.updateIssue as Mock).mockResolvedValue(undefined);

    await updateIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.updateIssue).toHaveBeenCalledWith('1', mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
  });

  it('should return 400 status if validation fails', async () => {
      mockValidationResult([{ msg: 'Invalid summary' }]); // Simulate a validation failure

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(validationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid summary' }] });
      expect(issueService.updateIssue).not.toHaveBeenCalled();
  });

  it('should return 500 status if an error occurs during issue update', async () => {
    const errorMessage = 'Failed to update issue';
    (issueService.updateIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await updateIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.updateIssue).toHaveBeenCalledWith('1', mockRequest.body);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});

describe('Issue Controller - deleteIssue', () => {
  let mockRequest: any;
  let mockResponse: any;
  const mockValidationResult = (errors: any) => {
    (validationResult as Mock).mockReturnValue({
      isEmpty: () => errors.length === 0,
      array: () => errors,
    });
  };

  beforeEach(() => {
    mockRequest = {
      params: {
        id: '1',
      },
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    mockValidationResult([]); // Default: no validation errors
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delete an issue and return 204 status', async () => {
    (issueService.deleteIssue as Mock).mockResolvedValue(undefined);

    await deleteIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.deleteIssue).toHaveBeenCalledWith('1');
    expect(mockResponse.status).toHaveBeenCalledWith(204);
    expect(mockResponse.send).toHaveBeenCalled();
  });

  it('should return 400 status if validation fails', async () => {
      mockValidationResult([{ msg: 'Invalid id' }]); // Simulate a validation failure

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(validationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid id' }] });
      expect(issueService.deleteIssue).not.toHaveBeenCalled();
  });

  it('should return 500 status if an error occurs during issue deletion', async () => {
    const errorMessage = 'Failed to delete issue';
    (issueService.deleteIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await deleteIssue(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.deleteIssue).toHaveBeenCalledWith('1');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});

describe('Issue Controller - listIssues', () => {
  let mockRequest: any;
  let mockResponse: any;
  const mockValidationResult = (errors: any) => {
    (validationResult as Mock).mockReturnValue({
      isEmpty: () => errors.length === 0,
      array: () => errors,
    });
  };

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockValidationResult([]); // Default: no validation errors
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should list issues and return 200 status', async () => {
    const mockIssues = [{ id: 1, summary: 'Test Issue 1' }, { id: 2, summary: 'Test Issue 2' }];
    (issueService.listIssues as Mock).mockResolvedValue(mockIssues);

    await listIssues(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.listIssues).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockIssues);
  });

  it('should return 400 status if validation fails', async () => {
      mockValidationResult([{ msg: 'Invalid filter' }]); // Simulate a validation failure

      await listIssues(mockRequest as Request, mockResponse as Response);

      expect(validationResult).toHaveBeenCalledWith(mockRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid filter' }] });
      expect(issueService.listIssues).not.toHaveBeenCalled();
  });

  it('should return 500 status if an error occurs during listing issues', async () => {
    const errorMessage = 'Failed to list issues';
    (issueService.listIssues as Mock).mockRejectedValue(new Error(errorMessage));

    await listIssues(mockRequest as Request, mockResponse as Response);

    expect(validationResult).toHaveBeenCalledWith(mockRequest);
    expect(issueService.listIssues).toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
  });
});