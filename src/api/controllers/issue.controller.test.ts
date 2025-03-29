// src/api/controllers/issue.controller.test.ts

import { createIssue, getIssue, updateIssue, deleteIssue, transitionIssue } from './issue.controller';
import * as issueService from '../services/issue.service';
import { Request, Response } from 'express';

// Mock the issue service
jest.mock('../services/issue.service');

describe('Issue Controller', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createIssue', () => {
    it('should create an issue and return 201 with the issue data', async () => {
      const mockIssue = { id: 1, summary: 'Test issue', description: 'Test description', status: 'Open' };
      (issueService.createIssue as jest.Mock).mockResolvedValue(mockIssue);
      mockRequest.body = { summary: 'Test issue', description: 'Test description', status: 'Open' };

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
    });

    it('should return 500 if issue creation fails', async () => {
      (issueService.createIssue as jest.Mock).mockRejectedValue(new Error('Failed to create issue'));
      mockRequest.body = { summary: 'Test issue', description: 'Test description', status: 'Open' };

      await createIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.createIssue).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to create issue' });
    });
  });

  describe('getIssue', () => {
    it('should get an issue and return 200 with the issue data', async () => {
      const mockIssue = { id: 1, summary: 'Test issue', description: 'Test description', status: 'Open' };
      (issueService.getIssue as jest.Mock).mockResolvedValue(mockIssue);
      mockRequest.params = { id: '1' };

      await getIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.getIssue).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockIssue);
    });

    it('should return 400 if issueId is invalid', async () => {
      mockRequest.params = { id: 'abc' };

      await getIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
    });

    it('should return 404 if issue is not found', async () => {
      (issueService.getIssue as jest.Mock).mockResolvedValue(null);
      mockRequest.params = { id: '1' };

      await getIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.getIssue).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should return 500 if getting issue fails', async () => {
      (issueService.getIssue as jest.Mock).mockRejectedValue(new Error('Failed to get issue'));
      mockRequest.params = { id: '1' };

      await getIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.getIssue).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to get issue' });
    });
  });

  describe('updateIssue', () => {
    it('should update an issue and return 200', async () => {
      (issueService.updateIssue as jest.Mock).mockResolvedValue({ changes: 1 });
      mockRequest.params = { issueKey: '1' };
      mockRequest.body = { summary: 'Updated summary' };

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.updateIssue).toHaveBeenCalledWith(1, mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue updated' });
    });

    it('should return 400 if issueKey is invalid', async () => {
      mockRequest.params = { issueKey: 'abc' };
      mockRequest.body = { summary: 'Updated summary' };

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
    });

    it('should return 404 if issue is not found or no changes', async () => {
      (issueService.updateIssue as jest.Mock).mockResolvedValue({ changes: 0 });
      mockRequest.params = { issueKey: '1' };
      mockRequest.body = { summary: 'Updated summary' };

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.updateIssue).toHaveBeenCalledWith(1, mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found or no changes' });
    });

    it('should return 500 if updating issue fails', async () => {
      (issueService.updateIssue as jest.Mock).mockRejectedValue(new Error('Failed to update issue'));
      mockRequest.params = { issueKey: '1' };
      mockRequest.body = { summary: 'Updated summary' };

      await updateIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.updateIssue).toHaveBeenCalledWith(1, mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to update issue' });
    });
  });

  describe('deleteIssue', () => {
    it('should delete an issue and return 204', async () => {
      (issueService.deleteIssue as jest.Mock).mockResolvedValue(undefined);
      mockRequest.params = { id: '1' };

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.deleteIssue).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 400 if issueId is invalid', async () => {
      mockRequest.params = { id: 'abc' };

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid issue ID' });
    });

    it('should return 500 if deleting issue fails', async () => {
      (issueService.deleteIssue as jest.Mock).mockRejectedValue(new Error('Failed to delete issue'));
      mockRequest.params = { id: '1' };

      await deleteIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.deleteIssue).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to delete issue' });
    });
  });

  describe('transitionIssue', () => {
    it('should transition an issue and return 200', async () => {
      (issueService.transitionIssue as jest.Mock).mockResolvedValue({ message: 'Issue transitioned successfully' });
      mockRequest.params = { issueKey: '1' };
      mockRequest.body = { transitionId: '2' };

      await transitionIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.transitionIssue).toHaveBeenCalledWith('1', mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue transitioned successfully' });
    });

    it('should return 400 if issueKey is invalid', async () => {
      mockRequest.params = { issueKey: 'abc' };
      mockRequest.body = { transitionId: '2' };

      await transitionIssue(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid issue key format.  Must be a number.' });
    });

    it('should return 500 if transition fails', async () => {
      (issueService.transitionIssue as jest.Mock).mockRejectedValue(new Error('Failed to transition issue'));
      mockRequest.params = { issueKey: '1' };
      mockRequest.body = { transitionId: '2' };

      await transitionIssue(mockRequest as Request, mockResponse as Response);

      expect(issueService.transitionIssue).toHaveBeenCalledWith('1', mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to transition issue' });
    });
  });
});
