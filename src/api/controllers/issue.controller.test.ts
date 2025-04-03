// src/api/controllers/issue.controller.test.ts
import { deleteIssue } from './issue.controller';
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

  it('should return 404 if the issue is not found (service throws not found error)', async () => {
    const errorMessage = 'Issue not found';
    (issueService.deleteIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await deleteIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.deleteIssue).toHaveBeenCalledWith('123');
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Issue not found.' });
  });

  it('should return 500 if an error occurs during deletion (other errors)', async () => {
    const errorMessage = 'Failed to delete issue from the database';
    (issueService.deleteIssue as Mock).mockRejectedValue(new Error(errorMessage));

    await deleteIssue(mockRequest as Request, mockResponse as Response);

    expect(issueService.deleteIssue).toHaveBeenCalledWith('123');
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: `Failed to delete issue. ${errorMessage}`,
    });
  });

  it('should handle errors with a custom error message', async () => {
      const errorMessage = 'Database connection error';
      (issueService.deleteIssue as Mock).mockRejectedValue(new Error(errorMessage));

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
          error: `Failed to delete issue. ${errorMessage}`,
      });
  });
});