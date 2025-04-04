import { Request, Response } from 'express';
import { EpicController } from '../api/controllers/epic.controller';
import { EpicService } from '../services/epic.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock EpicService
vi.mock('../services/epic.service');

describe('EpicController', () => {
  let epicController: EpicController;
  let mockEpicService: EpicService;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Initialize mocks
    mockEpicService = new EpicService(null as any); // type assertion as we are mocking
    (EpicService as any).mockImplementation(() => mockEpicService); // Mock the constructor
    epicController = new EpicController();

    mockRequest = {
      params: {},
      body: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('getEpicByKey', () => {
    it('should return an epic if found', async () => {
      const mockEpic = { key: 'EPIC-1', name: 'Test Epic' };
      mockEpicService.getEpicByKey = vi.fn().mockResolvedValue(mockEpic);
      mockRequest.params = { epicKey: 'EPIC-1' };

      await epicController.getEpicByKey(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.getEpicByKey).toHaveBeenCalledWith('EPIC-1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockEpic);
    });

    it('should return 404 if epic is not found', async () => {
      mockEpicService.getEpicByKey = vi.fn().mockResolvedValue(null);
      mockRequest.params = { epicKey: 'EPIC-1' };

      await epicController.getEpicByKey(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.getEpicByKey).toHaveBeenCalledWith('EPIC-1');
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Epic not found' });
    });

    it('should return 500 on service error', async () => {
      const errorMessage = 'Internal server error';
      mockEpicService.getEpicByKey = vi.fn().mockRejectedValue(new Error(errorMessage));
      mockRequest.params = { epicKey: 'EPIC-1' };

      await epicController.getEpicByKey(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.getEpicByKey).toHaveBeenCalledWith('EPIC-1');
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('getAllEpics', () => {
    it('should return all epics', async () => {
      const mockEpics = [{ key: 'EPIC-1', name: 'Test Epic 1' }, { key: 'EPIC-2', name: 'Test Epic 2' }];
      mockEpicService.getAllEpics = vi.fn().mockResolvedValue(mockEpics);

      await epicController.getAllEpics(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.getAllEpics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockEpics);
    });

    it('should return 500 on service error', async () => {
      const errorMessage = 'Internal server error';
      mockEpicService.getAllEpics = vi.fn().mockRejectedValue(new Error(errorMessage));

      await epicController.getAllEpics(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.getAllEpics).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('createEpic', () => {
    it('should create an epic and return 201', async () => {
      const mockEpicData = { name: 'New Epic' };
      const mockCreatedEpic = { key: 'EPIC-3', ...mockEpicData };
      mockEpicService.createEpic = vi.fn().mockResolvedValue(mockCreatedEpic);
      mockRequest.body = mockEpicData;

      await epicController.createEpic(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.createEpic).toHaveBeenCalledWith(mockEpicData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedEpic);
    });

    it('should return 500 on service error', async () => {
      const errorMessage = 'Internal server error';
      mockEpicService.createEpic = vi.fn().mockRejectedValue(new Error(errorMessage));
      mockRequest.body = { name: 'New Epic' };

      await epicController.createEpic(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.createEpic).toHaveBeenCalledWith({ name: 'New Epic' });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('updateEpic', () => {
    it('should update an epic and return 200', async () => {
      const mockEpicKey = 'EPIC-1';
      const mockEpicData = { name: 'Updated Epic' };
      const mockUpdatedEpic = { key: mockEpicKey, ...mockEpicData };
      mockEpicService.updateEpic = vi.fn().mockResolvedValue(mockUpdatedEpic);
      mockRequest.params = { epicKey: mockEpicKey };
      mockRequest.body = mockEpicData;

      await epicController.updateEpic(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.updateEpic).toHaveBeenCalledWith(mockEpicKey, mockEpicData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedEpic);
    });

    it('should return 500 on service error', async () => {
      const errorMessage = 'Internal server error';
      const mockEpicKey = 'EPIC-1';
      mockEpicService.updateEpic = vi.fn().mockRejectedValue(new Error(errorMessage));
      mockRequest.params = { epicKey: mockEpicKey };
      mockRequest.body = { name: 'Updated Epic' };

      await epicController.updateEpic(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.updateEpic).toHaveBeenCalledWith(mockEpicKey, { name: 'Updated Epic' });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('deleteEpic', () => {
    it('should delete an epic and return 204', async () => {
      const mockEpicKey = 'EPIC-1';
      mockEpicService.deleteEpic = vi.fn().mockResolvedValue(undefined);
      mockRequest.params = { epicKey: mockEpicKey };

      await epicController.deleteEpic(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.deleteEpic).toHaveBeenCalledWith(mockEpicKey);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      const errorMessage = 'Internal server error';
      const mockEpicKey = 'EPIC-1';
      mockEpicService.deleteEpic = vi.fn().mockRejectedValue(new Error(errorMessage));
      mockRequest.params = { epicKey: mockEpicKey };

      await epicController.deleteEpic(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.deleteEpic).toHaveBeenCalledWith(mockEpicKey);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe('getIssuesByEpicKey', () => {
    it('should return issues for an epic', async () => {
      const mockEpicKey = 'EPIC-1';
      const mockIssues = [{ key: 'ISSUE-1', summary: 'Issue 1' }, { key: 'ISSUE-2', summary: 'Issue 2' }];
      mockEpicService.getIssuesByEpicKey = vi.fn().mockResolvedValue(mockIssues);
      mockRequest.params = { epicKey: mockEpicKey };

      await epicController.getIssuesByEpicKey(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.getIssuesByEpicKey).toHaveBeenCalledWith(mockEpicKey);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockIssues);
    });

    it('should return 500 on service error', async () => {
      const errorMessage = 'Internal server error';
      const mockEpicKey = 'EPIC-1';
      mockEpicService.getIssuesByEpicKey = vi.fn().mockRejectedValue(new Error(errorMessage));
      mockRequest.params = { epicKey: mockEpicKey };

      await epicController.getIssuesByEpicKey(mockRequest as Request, mockResponse as Response);

      expect(mockEpicService.getIssuesByEpicKey).toHaveBeenCalledWith(mockEpicKey);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});